const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

fs.readdir('imgs', (err) => {
  if(err) {
    console.log('imgs 폴더가 없어 imgs 폴더를 생성합니다.');
    fs.mkdirSync('imgs');
  }
});

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-zie=1050,1150']
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 1100,
    });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36");
    await page.goto('https://unsplash.com');
    let result = [];
    while (result.length <= 30) {
      const srcs = await page.evaluate(() => {
        window.scrollTo(0, 0);
        let imgs = [];
        const imgEls = document.querySelectorAll('._1Nk0C');
        if (imgEls.length) {
          imgEls.forEach((v) => {
            let src = v.querySelector('img._2zEKz').src;
            if (src) {
              imgs.push(src);
            } // if(v.src)
            v.parentElement.removeChild(v);
          }); // imgEls.forEach((v) =>
        } // if(imgEls.length)
        window.scrollBy(0, 200);
        setTimeout(() => {
          window.scrollBy(0, 300);
        }, 500);

        return imgs;
      }); // const result = await page.evaluate(() =>
      result = result.concat(srcs);
      await page.waitForSelector('._1Nk0C');
      console.log('새 이미지 태그 로딩 완료!');
      } // while (result.length <= 30)
      console.log(result);
      result.forEach(async (src) => {
        const imgResult = await axios.get(src.replace(/\?.*$/, ''), {
          responseType: 'arraybuffer',
        });
        fs.writeFileSync(`imgs/${new Date().valueOf()}.jpg`, imgResult.data);
      });
    await page.close();
    await browser.close();
    console.log("종료 완료");
  } catch (e) {
    console.error(e);
  }
}
crawler();
