

## typescript ESM 에러

ts-node index.ts
-> The ESM module loader is experimental.

### 해결방법

package.json 중에서
"type": "module"가 포함되어 있다면 위에 에러가 나옴