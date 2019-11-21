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

    await page.waitForSelector('.XTCLo');
    await page.click('.XTCLo');
    await page.keyboard.type('맛집');
    await page.waitForSelector('.drKGC');

    const href = await page.evaluate(() => {
      return document.querySelector('.drKGC a:first-child').href;
    });

    await page.goto(href);




    // await page.close();
    // await browser.close();
    // await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
}
crawler();
