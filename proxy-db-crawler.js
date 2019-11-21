const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const db = require('./models');

const crawler = async () => {
await db.sequelize.sync();
  try {
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
    //await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36");
    await page.goto('http://spys.one/free-proxy-list/KR/');

    const proxies = await page.evaluate(() => {
      const ips = Array.from(document.querySelectorAll('tr > td:first-of-type > .spy14')).map((v) => v.textContent.replace(/document\.write\(.+\)/, ''));
      const types = Array.from(document.querySelectorAll('tr > td:nth-of-type(2)')).slice(5).map((v) => v.textContent);
      const latencies = Array.from(document.querySelectorAll('tr > td:nth-of-type(6) .spy1')).map((v) => v.textContent);
      return ips.map((v, i) => {
        return {
          ip: v,
          type: types[i],
          latency: latencies[i],
        }
      });
    });
    // 확인한 결과 HTTP는 먹히지 않고 HTTPS만 먹히고
    // HTTPS 중 느린 것도 있으니 다른 것도 시도 해야 함
    // 2차 테스트 후 HTTP도 먹히는게 있음
    const filtered = proxies.filter((v) => v.type.startsWith('HTTPS')).sort((p, c) => p.latency - c.latency);
    await Promise.all(filtered.map(async(v) => {
      return db.Proxy.upsert({
        ip: v.ip,
        type: v.type,
        latency: v.latency,
      });
    }));
    await page.close();
    await browser.close();
    const fastestProxies = await db.Proxy.findAll({ // 속도가 빠른 순으로 정렬
      order: [['latency', 'ASC']],
    });
    console.log("프록시 IP 추출 완료");
    console.log(filtered);

    let idx = 0; // 루프 인덱스
    let idxerr = 0; // 에러 확인 할 ip
    while(idx <= fastestProxies.length) // 프록시 IP가 안 먹히는 경우 다음 IP 적용
    {
      console.log(`fastestProxies[idx].ip 연결 중`);
      try {
        browser = await puppeteer.launch({
          headless: false,
          args: [
            '--window-zie=1050,1150',
            '--disable-notifications',
            `--proxy-server=${fastestProxies[idx++].ip}`,
          ]
        });
        page = await browser.newPage();
        await page.setViewport({
          width: 1000,
          height: 1100,
        });
        await page.goto('https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=%EB%82%B4+%EC%95%84%EC%9D%B4%ED%94%BC');
        console.log(`fastestProxies[idx].ip 연결 완료`);

        await page.waitFor(3000);
        break;
      } catch(e) {
        console.log(`${filtered[--idxerr].ip} 이 IP 에러났다.`);
        await page.waitFor(5000);
      } // try catch
    } // while
    await page.close();
    await browser.close();
    await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
}
crawler();
