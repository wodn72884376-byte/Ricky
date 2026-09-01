/**
 * 제품명 + 색상 + 공식몰 URL 을 한 파일로 뽑는다.
 *
 * 사용: npm run urls
 * 결과: 공식몰-url.csv (gitignore 대상 — 카탈로그에서 언제든 다시 만든다)
 *
 * `/admin` 의 `옵션 엑셀`과 같은 내용이지만 **DB 없이** 돈다. 시드 전이거나
 * 로그인하기 귀찮을 때 쓰라고 둔 것이고, 값의 원본은 양쪽 다 카탈로그다.
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './db-env.mjs';

const { CATALOG } = await import('../src/lib/catalog.generated.ts');

/** 엑셀이 `=`·`+`·`-`·`@` 로 시작하는 값을 수식으로 실행한다. 앞에 `'` 를 붙여 막는다. */
const field = (v) => {
  if (v === null || v === undefined) return '';
  const s = /^[=+\-@\t\r]/.test(String(v)) ? `'${v}` : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/*
  행을 **배열로** 모으고 CSV 조립은 마지막에 한다. 완성된 CSV 줄을 `split(',')` 해서
  세면 안 된다 — 값에 쉼표가 들어간 칸은 따옴표로 감싸이므로 그 split 이 칸을 쪼개고,
  그때부터 열 번호가 밀린다.
*/
const rows = [];
for (const p of CATALOG) {
  for (const v of p.variants) {
    // 옵션 주소가 있으면 그것이 정확하다. 없으면 상품 주소로 떨어지되 그 사실을 적는다.
    const url = v.officialUrl ?? p.officialUrl ?? null;
    const scope = v.officialUrl ? '옵션' : p.officialUrl ? '상품' : '';
    /*
      구매 경로도 같은 규칙이다. 범위가 `상품`이면 고객이 스마트스토어에서 색을 다시 고른다 —
      그 마찰을 없애려고 색상별로 등록하는 것이므로, 어디가 아직 상품 단위인지 보여야 한다.
    */
    const buy = v.smartstoreUrl ?? p.smartstoreUrl ?? null;
    const buyScope = v.smartstoreUrl ? '옵션' : p.smartstoreUrl ? '상품' : '';
    rows.push([p.brand, p.name, v.colorKo, v.color, p.slug, url, scope, buy, buyScope]);
  }
}

const headers = [
  '브랜드', '제품명', '색상', '색상(원문)', '슬러그',
  '공식몰 URL', '공식몰 범위',
  '스마트스토어 URL', '구매 경로 범위',
];
// BOM 이 없으면 한국어 윈도우 엑셀이 CP949 로 읽어 한글이 깨진다.
const body = rows.map((r) => r.map(field).join(','));
const csv = `﻿${[headers.join(','), ...body].join('\r\n')}\r\n`;

const out = join(ROOT, '공식몰-url.csv');
await writeFile(out, csv);

/** 범위 칸이 비어 있으면 그 경로가 아예 없다는 뜻이다. */
const scoped = (i) => {
  const n = rows.filter((r) => r[i] !== '').length;
  const byVariant = rows.filter((r) => r[i] === '옵션').length;
  return `${n}개 (옵션 ${byVariant} · 상품 ${n - byVariant})`;
};

console.log(`옵션 ${rows.length}개 → ${out}`);
console.log(`  공식몰    ${scoped(6)}`);
console.log(`  구매 경로  ${scoped(8)}`);
