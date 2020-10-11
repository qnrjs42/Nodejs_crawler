import fs from "fs";

interface IwrtieFileAPI {
  folderName: string;
  title: string;
  index: number;
  data: Buffer;
}

export const mkdirAPI = (folderName: string) => {
  try {
    fs.readdir(`${folderName}`, (err) => {
      if (err) {
        fs.mkdir(`${folderName}`, () => {
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

export const writeFileAPI = ({
  folderName,
  title,
  index,
  data,
}: IwrtieFileAPI) => {
  fs.writeFileSync(
    `${folderName}/${title}/${index + 1}_${new Date().valueOf()}.jpg`,
    data
  );
};
