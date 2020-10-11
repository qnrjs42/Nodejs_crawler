import axios from 'axios';
import fs from 'fs';
import {parse} from 'node-html-parser';

interface IwrtieFileAPI {
  folderName: string;
  title: string;
  index: number;
  data: Buffer;
}

const mkdirAPI = (folderName: string) => {
  try {
    fs.readdir(folderName, (err) => {
      if (err) {
        fs.mkdir(folderName, () => {
          console.log(`${folderName} 폴더를 생성합니다.`);
        });
      }
    });
    return "success";
  } catch (err) {
    console.error(err);
    return "failure";
  }
};

const writeFileAPI = ({
  folderName,
  title,
  index,
  data,
}: IwrtieFileAPI) => {
  try {
    fs.writeFileSync(
        `${folderName}/${title}/${index + 1}_${new Date().valueOf()}.jpg`,
        data
    );
    return 'success';
  } catch(err) {
    console.error(err);
    return 'failure';
  }
};

const getTitleHref = async () => {
    const response = await axios.get('https://marumaru.pics/bbs/cmoic/20092');

    if(response.status === 200) {
        const root = parse(response.data);

        const listArr = root.querySelectorAll('.list-subject a');
        let titleHrefArr = [];

        // 전체
        // const hrefArr = listArr.map((aTag, index) => {
        //     if(index >= 3) return ''; 
        //     return {
        //         title: aTag.text.trim().replace(/[\t ]+/g,' '),
        //         href: `https://marumaru.pics${aTag.getAttribute('href')}`,
        //     }
        // });

        // 3개만 가져오기 위해
        for(let i = 0; i < 3; i++) {
            titleHrefArr.push({
                title: listArr[i].text.trim().replace(/[\t ]+/g,' '),
                href: `https://marumaru.pics${listArr[i].getAttribute('href')}`,
            });
        }

        return { status: 'success', data: titleHrefArr }
    } else return { status: 'failure', data: [] };
}

const getImgsrc = async (href: string) => {
    try {
        const response = await axios.get(href);

            const root = parse(response.data);

            const imgListArr = root.querySelectorAll('.view-img img');

            const srcArr = imgListArr.map((img) => img.getAttribute('src')!);

            return { status: 'success', data: srcArr };
    } catch(err) {
        console.error(err);
        return { status: 'failure', data: [] };
    }
}

const crawler = async () => {
    try {
        const folderName = 'CrawlData';
        const mkdirResult = mkdirAPI(folderName);
        if(mkdirResult === 'failure') throw new Error(`${folderName} 폴더 생성을 실패했습니다.`);

        const titleHrefArr = await getTitleHref();
        if(titleHrefArr.status === 'failure') throw new Error('타이틀과 각각의 링크를 가져오는데 실패했습니다.');

        console.log('titleHrefArr: ', titleHrefArr);

        for(const titleHref of titleHrefArr.data) {

            const srcArr = await getImgsrc(titleHref.href);
            if(srcArr.status === 'failure') throw new Error('이미지 주소를 가져오는데 실패했습니다.');
            

            const mkdirResult = mkdirAPI(`${folderName}/${titleHref.title}`);
                if(mkdirResult === 'failure') throw new Error(`${folderName}/${titleHref.title} 폴더 생성을 실패했습니다.`);

            srcArr.data.map(async (src, index) => {
                const img = await axios.get(src.replace(/\?.*$/, ""), {
                    responseType: "arraybuffer",
                });

                const writeResult = writeFileAPI({ folderName, title: titleHref.title, index, data: img.data });
                if(writeResult === 'failure') throw new Error('이미지 변환 실패했습니다.');
            })
        }
    } catch(err) {
        console.error(err);
    }
}
crawler();