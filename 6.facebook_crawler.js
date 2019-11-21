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
      ]
    });
    let page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 1100,
    });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36");
    await page.goto('https://facebook.com');
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    await page.type('#email', email);
    await page.type('#pass', password);
    await page.waitFor(1000);
    await page.click('#loginbutton');

    await page.waitForResponse((response) => { // 로그인이 끝날 때까지 기다림
      return response.url().includes('login_attempt');
    });

    await page.keyboard.press('Escape'); // 로그인 로딩이 끝나면 Esc눌러 검은 화면에서 나감
      // 아이유는 아이가 아니에유 페이지
      //await page.goto('https://www.facebook.com/pg/Iuisnotchildren/posts/?ref=page_internal');

    let result = [];
    while (result.length < 5) {
      await page.waitForSelector('[id^=hyperfeed_story_id]:first-child');
      const newPost = await page.evaluate(() => {
        window.scrollTo(0, 0);
        const firstFeed = document.querySelector('[id^=hyperfeed_story_id]:first-child');
        const name = firstFeed.querySelector('.fwb.fcg') && firstFeed.querySelector('.fwb.fcg').textContent;
        const content = firstFeed.querySelector('.userContent') && firstFeed.querySelector('.userContent').textContent;
        const img = firstFeed.querySelector('[class=mtm] img') && firstFeed.querySelector('[class=mtm] img').src;
        const postId = firstFeed.id.split('_').slice(-1)[0];
        return {
          name, img, content, postId,
        }
      });
      console.log(newPost);

      const exist = await db.Facebook.findOne({
        where: {
          postId: newPost.postId,
        }
      });
      if (!exist && newPost.name) {
         result.push(newPost);
      }

      await page.waitFor(1000);

      const likeBtn = await page.$('[id^=hyperfeed_story_id]:first-child ._666k a');
      await page.evaluate((like) => {
        const sponsor = document.querySelector('[id^=hyperfeed_story_id]:first-child')
          .textContent.includes('Sponsored');
        if (!sponsor && like.getAttribute('aria-pressed') === 'false') {
          like.click();
        } else if (sponsor && like.getAttribute('aria-pressed') === 'true') {
          like.click();
        }
      }, likeBtn);
      await page.waitFor(1000);
      await page.evaluate(() => {
        const firstFeed = document.querySelector('[id^=hyperfeed_story_id]:first-child');
        firstFeed.parentNode.removeChild(firstFeed);
        window.scrollBy(0, 200);
      });
      await page.waitFor(1000);
    }
    await Promise.all(result.map((r) => {
      return db.Facebook.create({
        postId: r.postId,
        media: r.img,
        writer: r.name,
        content: r.content,
      });
    }));
    console.log(result.length);

    await page.close();
    await browser.close();
    //await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
}
crawler();
