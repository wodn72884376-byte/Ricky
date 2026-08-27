/**
 * Pretendard Variable(동적 서브셋)을 node_modules에서 public/fonts로 복사한다.
 * postinstall에서 자동 실행되며, public/fonts는 gitignore 대상이다.
 *
 * 동적 서브셋을 쓰는 이유: 전체 variable woff2는 2.0MB지만,
 * 92개 유니코드 범위로 쪼갠 서브셋은 브라우저가 실제 쓰는 범위만 내려받는다.
 */
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// 경로에 한글이 포함되므로 URL.pathname 대신 fileURLToPath를 쓴다
const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'node_modules/pretendard/dist/web/variable');
const dest = join(root, 'public/fonts/pretendard');

if (!existsSync(src)) {
  console.error('pretendard 패키지를 찾을 수 없습니다. npm install을 먼저 실행하세요.');
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });

await cp(join(src, 'woff2-dynamic-subset'), join(dest, 'woff2-dynamic-subset'), { recursive: true });

// @font-face 선언은 src/app/fonts.css로 내보내 Next 번들러가 처리하게 한다.
// (public에 두고 <link>로 부르면 @next/next/no-css-tags 경고가 난다)
// CSS는 커밋 대상, woff2 바이너리는 gitignore 대상이다.
const css = await readFile(join(src, 'pretendardvariable-dynamic-subset.css'), 'utf8');
await writeFile(
  join(root, 'src/app/fonts.css'),
  '/* 생성 파일 — 직접 수정하지 말 것. `npm run fonts:sync`로 재생성한다. */\n' +
    css.replaceAll('./woff2-dynamic-subset/', '/fonts/pretendard/woff2-dynamic-subset/'),
);

console.log('Pretendard Variable → public/fonts/pretendard + src/app/fonts.css');
