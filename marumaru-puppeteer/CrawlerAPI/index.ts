import fs from 'fs';
import axios from 'axios';
import puppeteer from 'puppeteer';

export const mkdir = (folderName: string) => {
  try {
    fs.readdir(`${folderName}`, (err) => {
        if (err) {
          fs.mkdir(`${folderName}`, () => {console.log(`${folderName} 폴더를 생성합니다.`)});
        }
    });
    return 'success';
  } catch(err) {
    console.error(err);
    return 'failure';
  }
}

export const getAllHref = async (page: puppeteer.Page) => {
  try {
    await page.goto("https://marumaru.pics/bbs/cmoic/20092");

    await page.waitForSelector('.list-subject');

    const result = await page.evaluate(() => {
      const trArr = document.querySelectorAll('.list-subject');
      let href: string[] = [];

      trArr.forEach((trData: Element, trArrIndex: number) => {
          try{
              // 해당 태그가 없으면 catch로 이동
              if (trData.querySelector('a')) {
                // 첫 번째 인덱스는 만화 링크가 아님

                // if (trArrIndex !== 0) {
                  // 이 부분을 변수값으로 주면 에러 발생
                  if (trArrIndex < 3) {
                    console.log('3단계');
                    const aTag = trData.querySelector('a')?.getAttribute('href');
                    href.push(`https://marumaru.pics${aTag}`);
                    // a태그가 있다면
                  }
                // }
              }
          } catch(err) {
              console.log('해당 태그에는 a태그가 없으므로 다음으로 넘어갑니다.');
          }
      });
      return href;
  });

  return { state: 'success', result };
  } catch(err) {
    console.error(err);
    return { state: 'failure', result: [] };
  }
}

export const geTtitleAndImgSrc = async (page: puppeteer.Page, href: string) => {
  try {
    await page.goto(href);

    // 해당 태그가 있을 때 까지 기다림
    await page.waitForSelector(".view-img img");

   const result = await page.evaluate(() => {

       // 메타 데이터에서 타이틀 제목 가져옴
      const metaTitle = document.querySelector('head > meta:nth-child(4)');
      console.log(metaTitle);
      let title: string | null = '';
      // 메타 데이터의 content가 있다면
      if(metaTitle?.getAttribute('content') !== undefined) {
        title = metaTitle?.getAttribute('content');
      }

      // 이미지 태그 가져옴
      const imgTag = document.querySelectorAll(".view-img img");

      let imgSrcArr: string[] = [];

      // 이미지 링크 푸쉬
      imgTag.forEach((img) => {
        const src: string | null = img.getAttribute('src');
        src ? imgSrcArr.push(src) : null;
      });

      return { title, imgSrcArr };
    });
    return {state: 'success', result };
  } catch(err) {
    console.error(err);
    return { state: 'failure', result: { title: null, imgSrc: null} };
  }
}

export const imgDownload = async (imgSrc: string[], title: string, folderName: string) => {
  // 이미지 링크 다운로드
    imgSrc.forEach(async (src, index) => {
      const imgResult = await axios.get(src.replace(/\?.*$/, ""), {
        responseType: "arraybuffer",
      });

      fs.writeFileSync(
        `${folderName}/${title}/${
          index + 1
        }_${new Date().valueOf()}.jpg`,
        imgResult.data
      );
    });
}