const puppeteer = require("puppeteer"); // postman으로 요청 보냈을 때 이미지 로딩 상태 확인하기
const fs = require("fs");
const axios = require("axios");

fs.readdir(`crawlData`, (err) => {
  if (err) {
    console.log(`crawlData 폴더가 없으므로 생성합니다.`);
    fs.mkdir(`crawlData`);
  }
});

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );
    await page.goto("https://marumaru.pics/bbs/cmoic/20092");

    const hrefResult = await page.evaluate(() => {
        const trArr = document.querySelectorAll("table tbody tr");
        let href = [];
        trArr.forEach((trData, trArrIndex) => {
            try{
                // 해당 태그가 없으면 catch로 이동
                if (trData.querySelectorAll("td")[2].querySelector("a")) {
                    // 첫 번째 인덱스는 만화 링크가 아님
                    if (trArrIndex !== 0) {
                        // 3개만 구함
                        if (href.length < 3) {
                        href.push(trData.querySelectorAll("td")[2].querySelector("a").href);
                        }
                    }

                }
            } catch(e) {
                console.log('해당 태그에는 a태그가 없다');
            }
        })
        return href;
    });
    // 가져온 a.href 결과
    console.log("hrefResult: ", hrefResult);

    for(const href of hrefResult) {
      await page.goto(href);

      // 해당 태그가 있을 때 까지 기다림
      await page.waitForSelector(".view-img img");

     const titleImg = await page.evaluate(() => {
         // 타이틀 제목 가져옴
        const title = document.querySelector('head > meta:nth-child(4)').content;
        // 이미지 태그 가져옴
        const imgTag = document.querySelectorAll(".view-img img");

        let imgSrcArr = [];

        // 이미지 링크 푸쉬
        imgTag.forEach((img) => {
          imgSrcArr.push(img.src);
        });

        return { title, imgSrcArr };
      });
      // 가져온 타이틀과 이미지 링크
      console.log("titleImg :", titleImg);

      // 타이틀 제목으로 폴더 생성
      fs.readdir(`crawlData/${titleImg.title}`, (err) => {
        if (err) {
          console.log(`${titleImg.title} 폴더가 없으므로 생성합니다.`);
          fs.mkdir(`crawlData/${titleImg.title}`);
        }
      });

      // 이미지 링크 다운로드
      titleImg.imgSrcArr.forEach(async (src, index) => {
        const imgResult = await axios.get(src.replace(/\?.*$/, ""), {
          responseType: "arraybuffer",
        });

        fs.writeFileSync(
          `crawlData/${titleImg.title}/${
            index + 1
          }_${new Date().valueOf()}.jpg`,
          imgResult.data
        );
      });
    }

    await page.close();
    await browser.close();
  } catch (e) {
    console.error(e);
  }
};

crawler();

