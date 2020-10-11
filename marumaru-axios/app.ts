import axios from 'axios';
import {parse} from 'node-html-parser';
import * as fs from 'fs';
import {resolve6} from 'dns';

const listHtmlFilePath = './list_html.txt';
const comicDirPath = './comic';
interface List{
  title:string;
  link:string;
}


function mkdir(path: string){
  return new Promise((resolve,reject) =>{
    fs.mkdir(path,(err) =>{
      if(err){
        reject(err);
      }else{
        resolve();
      }
    })
  });
}
function isExist(path: string){
  return new Promise((resolve,reject) =>{
    fs.exists(path, (exists) =>{
      resolve(exists);
    })
  });
}
function writeFile(path: string,data: string){
  return new Promise((resolve,reject) =>{
    fs.writeFile(path, data, (err) => {
      if(err){
        reject(err);
      }else{
        resolve();
      }
    });
  })
}
function readFile(path: string): Promise<string>{
  return new Promise((resolve,reject) => {
    fs.readFile(path, 'utf8', (err,data) => {
      if(err){
        reject(err);
      }else{
        resolve(data);
      }
    });
  });
}



async function loadList(): Promise<List[]>{
  let result: any;
  const isListHtmlExists = await isExist(listHtmlFilePath);
  let htmlData = '';
  if(isListHtmlExists){
    try{
      htmlData = await readFile(listHtmlFilePath);
    }catch(e){
      console.log(e);
      throw e;
    }
  }else{
    try{
      result = await axios.get('https://marumaru.golf/bbs/cmoic/20092')
      htmlData = result.data;
    }catch(e){
      console.log(e);
      throw e;
    }
    await writeFile(listHtmlFilePath, result.data);
  }

  const root = parse(htmlData);

  const nodeArr = root.querySelectorAll('table tbody tr td.list-subject a');
  const listArr: List[] = nodeArr.map(v => ({
    title: v.text.trim().replace(/[\t ]+/g,' '),
    link: `https://marumaru.golf${v.getAttribute('href')}`
  }));
  return listArr.reverse();
}

async function downloadImage(url: string,path : string){
  let data: string;
  try{
    const result = await axios.get(url,{
      responseType:'arraybuffer'
    });
    data = result.data;
  }catch(e){
    throw e;
  }
  fs.writeFileSync(path, data);
}
async function loadComic(list:List){
  const dirPath = `${comicDirPath}/${list.title}`;
  const isDirExists = await isExist(dirPath);
  if(!isDirExists){
    await mkdir(dirPath);
  } 
  let htmlData: string = '';
  try{
    const result = await axios.get(list.link)
    htmlData = result.data;
  }catch(e){
    console.log(e);
    throw e;
  }
  const root = parse(htmlData);
  const nodeList = root.querySelectorAll('#thema_wrapper div.at-body div div div.col-md-9.at-col.at-main div div.view-img img');
  const imageSrcArr = nodeList.map(v => (v.attributes['src']));

  let page = 1;
  for(const imageSrc of imageSrcArr){
    await downloadImage(imageSrc, `${dirPath}/${page++}.jpg`)
  }
}
async function loadComicArr(listArr: List[]){
  for(const list of listArr){
    try{
      await loadComic(list);
    }catch(e){
      throw e;
    }
  }
}

async function main(){
  let listArr: List[] = [];
  try{
    listArr = await loadList();
    await loadComicArr(listArr);
  }catch(e){
    console.log(e);
    return;
  }

}

main();

