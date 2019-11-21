const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

const db = require('./models');
dotenv.config();

const crawler = async () => {
  try {
    await db.sequelize.sync();
    let browser = await puppeteer.launch({
      headless: false,
      args: [
        '--window-zie=1050,1150',
        '--disable-notifications'
      ],
      userDataDir: `C:\\Users\\tracker\\AppData\\Local\\Google\\Chrome\\User Data`, // 쿠키 이용하여 재로그인 생략
    });
    let page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 1100,
    });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36");
    await page.goto('https://instagram.com');

    if(await page.$('a[href="/wlq.rkwk/"]')) {
      console.log('이미 로그인');
    } else {
      const email = process.env.EMAIL;
      const password = process.env.PASSWORD;

      await page.waitForSelector('button.L3NKy'); // facebook으로 로그인 버튼
      await page.click('button.L3NKy');
      await page.waitForNavigation(); // facebook 로그인으로 넘어가는 것을 기다림

      await page.waitForSelector('#email');
      await page.type('#email', email);
      await page.type('#pass', password);
      await page.waitForSelector('#loginbutton');
      await page.click('#loginbutton');

      await page.waitForNavigation();

      console.log('로그인 완료');
    }

    let result = [];
    let prevPostId = '';
    while(result.length < 5) {
      const moreButton = await page.$('button.sXUSN'); // 더보기 버튼 클릭
      if(moreButton) {
        await page.evaluate((btn) => btn.click(), moreButton);
      }

      // 게시글 틀, 게시글 특정 Id, 작성자, 이미지, 내용
      const newPost = await page.evaluate(() => {
        const article = document.querySelector('article:first-child');
        const postId = article.querySelector('.c-Yi7') && article.querySelector('.c-Yi7').href.split('/').slice(-2, -1)[0];
        const name = article.querySelector('h2') && article.querySelector('h2').textContent;
        const img = article.querySelector('.KL4Bh img') && article.querySelector('.KL4Bh img').src;
        const content = article.querySelector('.C4VMK > span') && article.querySelector('.C4VMK > span').textContent;
        const commentTags = article.querySelectorAll('ul li');

        let comments = [];
        commentTags.forEach( (c, i) => {
          if(i < 2) {
          }
          else {
            const name = c.querySelector('.C4VMK h3') && c.querySelector('.C4VMK h3').textContent;
            const comment = c.querySelector('.C4VMK > span') && c.querySelector('.C4VMK > span').textContent;
            comments.push({
              name, comment,
            });
          }

        });
        
        return {
          postId, name, img, content, comments,
        }
      });
      if(newPost.postId !== prevPostId) {
        console.log(newPost);

        if (!result.find((v) => v.postId === newPost.postId)) {
          const exist = await db.Instagram.findOne({ where: { postId: newPost.postId } });
          if (!exist) {
            result.push(newPost);
          }
        }
      }

      await page.waitFor(500);
      await page.evaluate(() => {
        const article = document.querySelector('article:first-child');
        const heartBtn = article.querySelector('.dCJp8.afkep span');

        // 좋아요 버튼
        if(heartBtn.className.includes('outline')) {
          heartBtn.click();
        }
      });


      prevPostId = newPost.postId;

      await page.waitFor(500);
      await page.evaluate(() => {
        window.scrollBy(0, 600);
      });
    } // while(result.length < 5)

    await Promise.all(result.map((r) => {
      return db.Instagram.create({
        postId: r.postId,
        media: r.img,
        writer: r.name,
        content: r.content,
      });
    }));


    // await page.close();
    // await browser.close();
    await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
}
crawler();
