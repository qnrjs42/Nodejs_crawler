const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--window-zie=1050,1150',
        '--disable-notifications'
    ]
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 1100,
    });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36");

    /* confirm 창 끄기
    page.on('dialog', async (dialog) => { //
      console.log(dialog.type(), dialog.message());
      await dialog.accept(); // 확인 버튼
      // await dialog.accept(); // 취소 버튼
    });
    await page.evaluate(() => { // prompt
      if(confirm('이 창이 꺼져야 다음으로 넘어갑니다.')) {
        location.href = "http://zerocho.com";
      } else {
        location.href = "http://inflearn.com";
      }
    });
    */

    /* alert 창 끄기
    page.on('dialog', async (dialog) => { //
      console.log(dialog.type(), dialog.message());
      await dialog.dismiss();
    });
    await page.evaluate(() => { // prompt
      alert('이 창이 꺼져야 다음으로 넘어갑니다.');
      location.href = "http://zerocho.com";
    });
    */

    /* prompt 창 끄기
    // page.on('dialog', async (dialog) => { //
    //   console.log(dialog.type(), dialog.message());
    //   await dialog.accept('http://zerocho.com');
    // });
    // await page.evaluate(() => { // prompt
    //   const data = prompt('주소를 입력하세요');
    //   location.href = data;
    // });
    */

  } catch(e) {
    console.error(e);
  }
}

  crawler();
