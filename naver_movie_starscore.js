const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const add_to_sheet = require('./add_to_sheet');

const workbook = xlsx.readFile('xlsx/data.xlsx');
const ws = workbook.Sheets.Sheet1;
const records = xlsx.utils.sheet_to_json(ws);

fs.readdir('screenshot', (err) => {
  if(err) {
    console.log('screenshot 폴더가 없어 screenshot 폴더를 생성합니다.');
    fs.mkdirSync('screenshot');
  }
});

fs.readdir('poster', (err) => {
  if(err) {
    console.log('poster 폴더가 없어 poster 폴더를 생성합니다.');
    fs.mkdirSync('poster');
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
    add_to_sheet(ws, 'C1', 's', '평점');
    for (const [i, r] of records.entries()) {
      await page.goto(r.링크);
      const result = await page.evaluate(() => {
        const scoreEl = document.querySelector('.score.score_left .star_score');
        let score = '';
        if (scoreEl) {
          score = score.textContent;
        }

        const imgEl = document.querySelector('.poster img');
        let img = '';
        if(imgEl) {
          img = imgEl.src;
        }
        return { score, img };
      });
      if (result.score) {
        const newCell = 'C' + (i + 2);
        console.log(r.제목, '평점', result.score.trim(), newCell);
        add_to_sheet(ws, newCell, 'n', result.score.trim());
      }
      if(result.img) {
        await page.screenshot({
          path: `screenshot/${r.제목}.png`,
          // fullPage: true,
          clip: {
            x: 100,
            y: 100,
            width: 300,
            height: 300,
        }});
        const imgResult = await axios.get(result.img.replace(/\?.*$/, ''), {
          responseType: 'arraybuffer',
        });
        fs.writeFileSync(`poster/${r.제목}.jpg`, imgResult.data);
      }
      await page.waitFor(1000);
    }
    await page.close();
    await browser.close();
    xlsx.writeFile(workbook, 'xlsx/result.xlsx');
  } catch (e) {
    console.error(e);
  }
};
crawler();
