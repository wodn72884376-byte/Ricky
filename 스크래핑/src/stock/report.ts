/**
 * 재고 리포트.
 *
 * 운영자가 보는 단위는 표 한 줄이 아니라 **색상 × 사이즈 매트릭스**다.
 * "어느 색 어느 사이즈가 비었나"를 한눈에 보려면 격자로 그려야 한다.
 */
import { BRANDS } from '../config/brands.ts';
import { EVENT_LABEL, sortEvents, type StockEvent } from './diff.ts';
import { compareSizes } from './normalize.ts';
import { summarize, type ProductStock, type StockRow } from './types.ts';

const cad = (c: number | null) => (c === null ? '—' : `CA$${(c / 100).toFixed(2)}`);

/** 재고 상태 → 격자 기호. 한 칸에 들어가야 하므로 문자 하나로 만든다. */
const MARK: Record<string, string> = {
  in_stock: '●',
  low_stock: '◐',
  out_of_stock: '○',
  discontinued: '✕',
  unknown: '?',
};

// ---------------------------------------------------------------------------
// CSV — variant 한 줄에 한 행. 엑셀에서 필터·피벗하기 위한 것.
// ---------------------------------------------------------------------------

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CSV_COLUMNS: Array<[string, (r: StockRow) => unknown]> = [
  ['브랜드', (r) => BRANDS[r.brand].labelKo],
  ['상품명', (r) => r.productName],
  ['상품코드', (r) => r.productCode],
  ['SKU', (r) => r.sku],
  ['색상', (r) => r.colour],
  ['색상코드', (r) => r.colourCode],
  ['사이즈', (r) => r.size.label],
  ['사이즈_치수', (r) => r.size.code],
  ['사이즈_폭', (r) => r.size.width],
  ['사이즈_원문', (r) => r.size.declared],
  ['재고', (r) => r.availability],
  ['가격CAD', (r) => (r.priceCents === null ? '' : (r.priceCents / 100).toFixed(2))],
  ['정가CAD', (r) => (r.listPriceCents === null ? '' : (r.listPriceCents / 100).toFixed(2))],
  ['세일', (r) => (r.onSale ? 'Y' : '')],
  ['GTIN', (r) => r.gtin],
  ['확인시각', (r) => r.checkedAt],
  ['수집경로', (r) => r.source],
  ['URL', (r) => r.productUrl],
];

export function toStockCsv(rows: StockRow[]): string {
  const lines = [CSV_COLUMNS.map(([h]) => esc(h)).join(',')];
  for (const r of rows) lines.push(CSV_COLUMNS.map(([, get]) => esc(get(r))).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}

// ---------------------------------------------------------------------------
// 마크다운
// ---------------------------------------------------------------------------

/** 색상 × 사이즈 격자를 그린다. 사이즈가 없는 상품은 색상 목록으로 대신한다. */
function renderMatrix(rows: StockRow[]): string[] {
  const out: string[] = [];
  const sizes = [...new Set(rows.map((r) => r.size.label))].filter((s) => s !== '-').sort(compareSizes);
  const colours = [...new Set(rows.map((r) => r.colour ?? '(색상 없음)'))].sort();

  if (sizes.length === 0) {
    /*
     * 가방·지갑 — 사이즈 축이 없다.
     * 색상으로 묶으면 안 된다. Coach 는 같은 색상명("Brass/Black")을 가진
     * 서로 다른 스타일이 한 페이지에 섞여 있어(SKU·가격이 다름) 색상 기준으로
     * 접으면 variant 가 조용히 사라진다. SKU 한 줄씩 그대로 편다.
     */
    out.push('| 색상 | SKU | 재고 | 가격 |');
    out.push('|---|---|:--:|---:|');
    for (const r of rows) {
      out.push(
        `| ${r.colour ?? '(색상 없음)'} | \`${r.sku ?? '-'}\` | ${MARK[r.availability] ?? '?'} | ${cad(r.priceCents)} |`,
      );
    }
    return out;
  }

  out.push(`| 색상 \\ 사이즈 | ${sizes.join(' | ')} |`);
  out.push(`|---|${sizes.map(() => ':--:').join('|')}|`);

  for (const c of colours) {
    const cells = sizes.map((s) => {
      const r = rows.find((x) => (x.colour ?? '(색상 없음)') === c && x.size.label === s);
      // 해당 조합이 애초에 편성되지 않은 경우와 품절은 다르다.
      return r ? (MARK[r.availability] ?? '?') : '·';
    });
    out.push(`| ${c} | ${cells.join(' | ')} |`);
  }
  return out;
}

/**
 * 한 상품의 재고를 그린다.
 *
 * (색상, 사이즈)가 variant 를 유일하게 지목하지 못하는 경우가 있다 —
 * Coach 는 스타일코드가 다른 관련 상품을 한 페이지에 묶어 두어서
 * 같은 "Black / 7 D" 가 스타일별로 재고가 다르게 두 줄 존재한다.
 * 그럴 때는 스타일코드로 먼저 갈라 매트릭스를 여러 개 그린다.
 * 하나로 뭉개면 한 쪽이 조용히 사라진다.
 */
function renderProduct(rows: StockRow[]): string[] {
  const cellKey = (r: StockRow) => `${r.colour ?? ''}|${r.size.label}`;
  const collides = new Set(rows.map(cellKey)).size !== rows.length;

  const styles = [...new Set(rows.map((r) => r.styleCode).filter((c): c is string => Boolean(c)))];
  if (!collides || styles.length <= 1) return renderMatrix(rows);

  const out: string[] = [];
  for (const style of styles.sort()) {
    const group = rows.filter((r) => r.styleCode === style);
    const prices = group.map((r) => r.priceCents).filter((x): x is number => x !== null);
    const price = prices.length ? cad(Math.min(...prices)) : '—';
    out.push(`**스타일 \`${style}\`** · ${price} · 재고 ${group.filter((r) => r.availability === 'in_stock').length}/${group.length}`);
    out.push('');
    out.push(...renderMatrix(group));
    out.push('');
  }
  return out;
}

export function renderStockReport(
  results: ProductStock[],
  events: StockEvent[],
  meta: { startedAt: string; durationMs: number; comparedWith: string | null },
): string {
  const out: string[] = [];
  const ok = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const allRows = ok.flatMap((r) => r.rows);
  const total = summarize(allRows);

  const date = new Date(meta.startedAt).toISOString().slice(0, 16).replace('T', ' ');

  out.push('# 캐나다 공식몰 재고 조회');
  out.push('');
  out.push(`> ${date} UTC · 소요 ${(meta.durationMs / 1000).toFixed(0)}초`);
  out.push(
    `> 상품 ${ok.length}건 · variant ${total.totalVariants}개 · 재고 ${total.inStock} / 품절 ${total.outOfStock}` +
      (failed.length ? ` · **수집 실패 ${failed.length}건**` : ''),
  );
  out.push('');
  out.push('기호: ● 재고 · ◐ 임박 · ○ 품절 · ✕ 단종 · · 미편성');
  out.push('');

  // -------------------------------------------------------------------------
  if (events.length > 0) {
    out.push(`## 변화 (${meta.comparedWith ? `이전 스냅샷 ${meta.comparedWith} 대비` : '최초 실행'})`);
    out.push('');
    out.push('| 유형 | 브랜드 | 상품 | 색상 | 사이즈 | 변화 |');
    out.push('|---|---|---|---|:--:|---|');
    for (const e of sortEvents(events).slice(0, 60)) {
      const change =
        e.deltaCents !== undefined
          ? `${cad(Number(e.before))} → ${cad(Number(e.after))} (${e.deltaCents > 0 ? '+' : ''}${(e.deltaCents / 100).toFixed(2)})`
          : `${e.before ?? '—'} → ${e.after ?? '—'}`;
      out.push(
        `| ${EVENT_LABEL[e.type]} | ${BRANDS[e.brand].labelKo} | [${trim(e.productName, 34)}](${e.productUrl}) | ${e.colour ?? '—'} | ${e.size} | ${change} |`,
      );
    }
    if (events.length > 60) out.push(`\n_외 ${events.length - 60}건은 JSON 참고._`);
    out.push('');
  } else if (meta.comparedWith) {
    out.push('## 변화');
    out.push('');
    out.push(`_이전 스냅샷(${meta.comparedWith}) 대비 변화 없음._`);
    out.push('');
  }

  // -------------------------------------------------------------------------
  out.push('## 상품별 재고 매트릭스');
  out.push('');

  const byBrand = new Map<string, ProductStock[]>();
  for (const r of ok) {
    const list = byBrand.get(r.brand) ?? [];
    list.push(r);
    byBrand.set(r.brand, list);
  }

  for (const [brand, products] of byBrand) {
    out.push(`### ${BRANDS[brand as keyof typeof BRANDS].labelKo}`);
    out.push('');
    for (const p of products) {
      const s = summarize(p.rows);
      out.push(`#### [${p.productName}](${p.productUrl})`);
      out.push('');
      out.push(
        `\`${p.productCode ?? '-'}\` · ${priceLabel(p.rows)}` +
          ` · 색상 ${s.colours} × 사이즈 ${s.sizes || 1} · **재고 ${s.inStock}/${s.totalVariants}**`,
      );
      out.push('');
      out.push(...renderProduct(p.rows));
      out.push('');
    }
  }

  // -------------------------------------------------------------------------
  if (failed.length > 0) {
    out.push('## 수집 실패');
    out.push('');
    out.push('**실패는 품절이 아니다.** 마지막 성공값으로 판매를 지속하면 안 된다 (PROJECT.md §6.3 5번).');
    out.push('');
    out.push('| 브랜드 | URL | 사유 |');
    out.push('|---|---|---|');
    for (const f of failed) {
      out.push(`| ${BRANDS[f.brand].labelKo} | ${f.productUrl} | ${f.error} |`);
    }
    out.push('');
  }

  out.push('---');
  out.push('');
  out.push(
    '재고는 이 시각 기준 스냅샷이다. 주문매입 상품 판매는 §6.5 신선도 게이트(기본 6시간)를 통과해야 한다.',
  );

  return out.join('\n');
}

/**
 * 가격 표시.
 * variant 마다 가격이 다르면 하나만 골라 보여 주는 건 거짓말이다 — 범위로 적는다.
 */
function priceLabel(rows: StockRow[]): string {
  const prices = rows.map((r) => r.priceCents).filter((p): p is number => p !== null);
  if (prices.length === 0) return '—';

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const sale = rows.find((r) => r.onSale);

  if (min !== max) return `${cad(min)} ~ ${cad(max)}`;
  return sale ? `${cad(min)} _(세일, 정가 ${cad(sale.listPriceCents)})_` : cad(min);
}

function trim(s: string, n: number): string {
  const c = s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
  return c.length > n ? `${c.slice(0, n - 1)}…` : c;
}
