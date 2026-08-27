/** CSV 직렬화. 엑셀에서 열 수 있도록 BOM 을 붙인다. */
import type { BrandRunResult, ComparisonRow } from '../core/types.ts';
import { BRANDS } from '../config/brands.ts';

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const COLUMNS: Array<[header: string, get: (r: ComparisonRow) => unknown]> = [
  ['브랜드', (r) => BRANDS[r.brand].labelKo],
  ['상품명', (r) => r.productName],
  ['상품코드', (r) => r.productCode],
  ['신제품', (r) => (r.isNew ? 'Y' : '')],
  ['인기점수', (r) => r.popularity?.score ?? ''],
  ['검색증가율(%)', (r) => r.popularity?.momentumPct ?? ''],
  ['CA현재가(CAD)', (r) => (r.caPriceCents === null ? '' : (r.caPriceCents / 100).toFixed(2))],
  ['CA정가(CAD)', (r) => (r.caListPriceCents === null ? '' : (r.caListPriceCents / 100).toFixed(2))],
  ['CA세일', (r) => (r.caOnSale ? 'Y' : '')],
  ['CA재고', (r) => r.caAvailability],
  ['CA가_원화환산', (r) => r.caPriceKrw ?? ''],
  ['예상판매가(KRW)', (r) => r.estimatedSaleKrw ?? ''],
  ['KR공식가(KRW)', (r) => r.krOfficialKrw ?? ''],
  ['KR공식가_매칭', (r) => r.krOfficialMatch ?? ''],
  ['KR최저가(KRW)', (r) => r.krLowestKrw ?? ''],
  ['KR최저가출처', (r) => r.krLowestSource],
  ['절감률(%)', (r) => (r.savingRate === null ? '' : (r.savingRate * 100).toFixed(1))],
  ['비교기준', (r) => r.savingBaseline ?? ''],
  ['매칭방법', (r) => r.matchMethod],
  ['매칭신뢰도', (r) => r.matchConfidence],
  ['CA_URL', (r) => r.caUrl],
  ['KR_URL', (r) => r.krOfficialUrl],
  ['비고', (r) => r.notes.join(' / ')],
];

export function toCsv(rows: ComparisonRow[]): string {
  const lines = [COLUMNS.map(([h]) => esc(h)).join(',')];
  for (const row of rows) {
    lines.push(COLUMNS.map(([, get]) => esc(get(row))).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}

export function allRows(results: BrandRunResult[]): ComparisonRow[] {
  return results.flatMap((r) => r.rows);
}
