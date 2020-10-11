import puppeteer from 'puppeteer';

import { mkdir, getAllHref, geTtitleAndImgSrc, imgDownload } from './CrawlerAPI';

const crawler = async () => {
  try {
    // 폴더 생성
    const folderName = 'crawlData';
    const mkdirResult = mkdir(folderName);
    if(mkdirResult === 'failure') throw new Error(`${folderName} 폴더 생성을 실패했습니다.`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );

    // 최상단부터 3개만 가져옴
    const hrefResult = await getAllHref(page);
    // if(hrefResult.state === 'failure') throw new Error('모든 링크를 가져오는데 실패했습니다.');

    // 가져온 a.href 결과
    console.log("hrefResult: ", hrefResult);

    if(hrefResult) {
      for(const href of hrefResult.result) {
        const geTtitleAndImgSrcResult = await geTtitleAndImgSrc(page, href);
        if(geTtitleAndImgSrcResult.state === 'failure') throw new Error('타이틀과 이미지 주소 가져오는데 실패했습니다.');

        // 가져온 타이틀과 이미지 링크
        console.log("titleImg :", geTtitleAndImgSrcResult.result);

        // 타이틀 제목으로 폴더 생성
        if(geTtitleAndImgSrcResult.result.title !== null) {
          mkdir(`crawlData/${geTtitleAndImgSrcResult.result.title}`);

          await imgDownload(geTtitleAndImgSrcResult.result.imgSrcArr, geTtitleAndImgSrcResult.result.title, folderName);

        }
      }
  }

    await page.close();
    await browser.close();
  } catch (e) {
    console.error(e);
  }
};

crawler();

