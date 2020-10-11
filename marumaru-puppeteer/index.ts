import puppeteer from "puppeteer";

import {
  getAllHref,
  getTitleAndImgSrc,
  imgDownload,
} from "./CrawlerAPI/puppeteerAPI";
import { mkdirAPI } from "./CrawlerAPI/fsAPI";

const crawler = async () => {
  try {
    // 폴더 생성
    const folderName: string = "CrawlData";
    const mkdirResult = mkdirAPI(folderName);
    if (mkdirResult === "failure")
      throw new Error(`${folderName} 폴더 생성을 실패했습니다.`);

    // headless: false - GUI mode On
    // headless: true - GUI mode Off
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );

    // 최상단부터 3개만 가져옴
    const hrefResult = await getAllHref(page);
    if (hrefResult.status === "failure")
      throw new Error("모든 링크를 가져오는데 실패했습니다.");

    // 가져온 a.href 결과
    console.log("hrefResult: ", hrefResult);

    if (hrefResult) {
      for (const href of hrefResult.result) {
        const getTitleAndImgSrcResult = await getTitleAndImgSrc(page, href);
        if (getTitleAndImgSrcResult.status === "failure")
          throw new Error("타이틀과 이미지 주소 가져오는데 실패했습니다.");

        // 가져온 타이틀과 이미지 링크
        console.log("titleImg :", getTitleAndImgSrcResult.result);

        // 타이틀 제목으로 폴더 생성
        if (getTitleAndImgSrcResult.result.title !== null) {
          mkdirAPI(`crawlData/${getTitleAndImgSrcResult.result.title}`);

          await imgDownload(
            getTitleAndImgSrcResult.result.imgSrcArr,
            getTitleAndImgSrcResult.result.title,
            folderName
          );
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
