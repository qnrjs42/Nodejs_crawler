const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const fs = require('fs');
const ytdl = require('ytdl-core');

//const db = require('./models');
dotenv.config();

const crawler = async () => {
  try {
    //await db.sequelize.sync();
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
    await page.goto('https://youtube.com', {
      /*
        페이지 네트워크 작업이 모두 끝났을 때 까지 기다림
        스트리밍 같은 경우 네트워크 작업이 계속 이어지니 사용 X
      */
      waitUntil: 'networkidle0',
    });

    if(!await page.$('#avatar-btn')) {
      // 유튜브-구글 아이디 로그인
      await page.waitForSelector('#buttons ytd-button-renderer:last-child a');
      await page.click('#buttons ytd-button-renderer:last-child a');
      await page.waitForNavigation({
        waitUntil: 'networkidle2' // 네트워크 작업이 2개정도 남았을 때까지 기다림
      });

      // 구글 이메일 입력 후 다음
      await page.waitForSelector('#identifierId');
      await page.type('#identifierId', process.env.GMAIL);
      await page.waitForSelector('#identifierNext');
      await page.click('#identifierNext');

      await page.waitForNavigation({
        waitUntil: 'networkidle2'
      });

      // 구글 비밀번호 입력 후 로그인
      await page.waitForSelector('input[aria-label="비밀번호 입력"]');
      await page.evaluate((password) => {
        document.querySelector('input[aria-label="비밀번호 입력"]').value = password;
      }, process.env.GPASSWORD);
      //await page.type('input[aira-label="비밀번호 입력"]', process.env.GPASSWORD);
      await page.waitFor(2000);
      await page.waitForSelector("#passwordNext");
      await page.click('#passwordNext');

      await page.waitForNavigation({
        waitUntil: 'networkidle2'
      });
    } else {
      console.log('이미 로그인 됨');
    }

    // 인기 동영상
    await page.goto('https://www.youtube.com/feed/trending', {
      waitUntil: 'networkidle0'
    });
    await page.waitForSelector('ytd-video-renderer');
    await page.click('ytd-video-renderer');

    const url = await page.url(); // 현재 페이지의 URL 가져옴
    const title = await page.title(); // 현재 페이지의 제목 가져옴

    //console.log(url, title);

    const info = await ytdl.getInfo(url);

    console.log(info);

    // 유튜브 다운로드
    // replace(/\u20A9/g, '') -> 한국 돈 '원'표시 제거
    ytdl(url).pipe(fs.createWriteStream(`${info.title.replace(/\u20A9/g, '')}.mp4`));

    // await page.close();
    // await browser.close();
    // await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
}
crawler();
