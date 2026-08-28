/**
 * 재고 리포트 — HTML.
 *
 * 마크다운은 상품이 몇 개 넘어가면 못 읽는다. 매트릭스가 가로로 길어지고,
 * 찾고 싶은 것을 찾을 방법이 없다. 브라우저에서 여는 한 장짜리 문서로 만들되
 * 외부 의존 없이 파일 하나로 끝나게 한다(file:// 로 바로 열려야 한다).
 *
 * 필터는 서버 렌더 + data-* 속성 토글로 처리한다. 클라이언트에서 다시 그리지 않으므로
 * JS 가 죽어도 내용은 전부 보인다.
 */
import { BRANDS } from '../config/brands.ts';
import { EVENT_LABEL, sortEvents, type StockEvent, type StockEventType } from './diff.ts';
import { compareSizes } from './normalize.ts';
import { summarize, type ProductStock, type StockRow } from './types.ts';

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const cad = (c: number | null) => (c === null ? '—' : `CA$${(c / 100).toFixed(2)}`);

/** 재고 상태 → 표시용 기호·클래스 */
const STATE: Record<string, { mark: string; cls: string; label: string }> = {
  in_stock: { mark: '●', cls: 'ok', label: '재고' },
  low_stock: { mark: '◐', cls: 'low', label: '임박' },
  out_of_stock: { mark: '○', cls: 'out', label: '품절' },
  discontinued: { mark: '✕', cls: 'out', label: '단종' },
  unknown: { mark: '?', cls: 'unk', label: '미확인' },
};

const EVENT_CLASS: Record<StockEventType, string> = {
  oos: 'ev-oos',
  restock: 'ev-restock',
  price_up: 'ev-up',
  price_down: 'ev-down',
  low_stock: 'ev-low',
  added: 'ev-add',
  removed: 'ev-rm',
};

// ---------------------------------------------------------------------------

/** 색상 × 사이즈 격자 한 벌 */
function matrixTable(rows: StockRow[]): string {
  const sizes = [...new Set(rows.map((r) => r.size.label))]
    .filter((s) => s !== '-')
    .sort(compareSizes);
  const colours = [...new Set(rows.map((r) => r.colour ?? '(색상 없음)'))].sort();

  // 사이즈 축이 없는 상품(가방·지갑)은 SKU 한 줄씩 편다.
  if (sizes.length === 0) {
    const body = rows
      .map((r) => {
        const st = STATE[r.availability] ?? STATE.unknown!;
        return `<tr><td class="c">${esc(r.colour ?? '(색상 없음)')}</td>
          <td class="sku">${esc(r.sku ?? '—')}</td>
          <td class="m ${st.cls}" title="${esc(st.label)}">${st.mark}</td>
          <td class="p">${cad(r.priceCents)}</td></tr>`;
      })
      .join('');
    return `<table class="mx flat"><thead><tr><th>색상</th><th>SKU</th><th>재고</th><th>가격</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  const head = sizes.map((s) => `<th>${esc(s)}</th>`).join('');
  const body = colours
    .map((c) => {
      const mine = rows.filter((x) => (x.colour ?? '(색상 없음)') === c);

      /*
       * 사이즈 정보가 아예 없는 색상은 "미편성"이 아니라 "미확인"이다.
       *
       * 랄프로렌은 선택된 색상의 사이즈만 싣고 나머지 색상은 색상 정보만 준다.
       * 이걸 미편성(·)으로 그리면 재고가 멀쩡히 있는 색상이 "살 수 없음"으로 보인다.
       * 모르는 것은 모른다고 그려야 한다.
       */
      if (!mine.some((x) => x.size.label !== '-')) {
        const cells = sizes
          .map(
            () =>
              `<td class="m unk" title="이 색상의 사이즈별 재고는 확인되지 않았다">?</td>`,
          )
          .join('');
        return `<tr><td class="c">${esc(c)}</td>${cells}</tr>`;
      }

      const cells = sizes
        .map((s) => {
          const r = mine.find((x) => x.size.label === s);
          // 미편성(·)과 품절(○)은 다르다.
          if (!r) return `<td class="m none" title="미편성">·</td>`;
          const st = STATE[r.availability] ?? STATE.unknown!;
          const tip = `${c} / ${s} · ${st.label} · ${cad(r.priceCents)}${r.sku ? ` · ${r.sku}` : ''}`;
          return `<td class="m ${st.cls}" title="${esc(tip)}">${st.mark}</td>`;
        })
        .join('');
      return `<tr><td class="c">${esc(c)}</td>${cells}</tr>`;
    })
    .join('');

  return `<table class="mx"><thead><tr><th>색상 \\ 사이즈</th>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/** 스타일코드가 겹치면 갈라 그린다 (Coach 처럼 한 페이지에 여러 스타일이 섞이는 경우) */
function productBody(rows: StockRow[]): string {
  const cellKey = (r: StockRow) => `${r.colour ?? ''}|${r.size.label}`;
  const collides = new Set(rows.map(cellKey)).size !== rows.length;
  const styles = [...new Set(rows.map((r) => r.styleCode).filter((c): c is string => Boolean(c)))];

  if (!collides || styles.length <= 1) return matrixTable(rows);

  return styles
    .sort()
    .map((style) => {
      const g = rows.filter((r) => r.styleCode === style);
      const prices = g.map((r) => r.priceCents).filter((x): x is number => x !== null);
      const v = verifiedRows(g);
      const inStock = v.filter((r) => r.availability === 'in_stock').length;
      return `<div class="style">
        <div class="style-h"><code>${esc(style)}</code> · ${prices.length ? cad(Math.min(...prices)) : '—'} · 재고 ${inStock}/${v.length}</div>
        ${matrixTable(g)}
      </div>`;
    })
    .join('');
}

/**
 * 확인된 variant 만 남긴다.
 *
 * 사이즈 축이 있는 상품에서 사이즈가 안 붙은 행은 "색상만 알고 재고는 모르는" 상태다.
 * 랄프로렌은 이런 행에도 availability 를 InStock 으로 적어 보내므로, 그대로 세면
 * 사이즈를 하나도 못 받은 상품이 "재고 24/24" 로 표시된다 — 실측 사고(638616).
 * 모르는 것을 재고로 세지 않는다.
 */
function verifiedRows(rows: StockRow[]): StockRow[] {
  const hasSizeAxis = rows.some((r) => r.size.label !== '-');
  if (!hasSizeAxis) return rows; // 가방처럼 사이즈가 원래 없는 품목
  return rows.filter((r) => r.size.label !== '-');
}

/** 사이즈 정보를 하나도 못 받은 색상 수. 요약 숫자가 실제보다 좋아 보이지 않게 한다. */
function unknownColours(rows: StockRow[]): number {
  const byColour = new Map<string, boolean>();
  for (const r of rows) {
    const c = r.colour ?? '(색상 없음)';
    byColour.set(c, (byColour.get(c) ?? false) || r.size.label !== '-');
  }
  // 사이즈 축이 아예 없는 상품(가방)은 해당 없음
  if ([...byColour.values()].every((v) => !v)) return 0;
  return [...byColour.values()].filter((v) => !v).length;
}

function priceLabel(rows: StockRow[]): string {
  const prices = rows.map((r) => r.priceCents).filter((p): p is number => p !== null);
  if (prices.length === 0) return '—';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const sale = rows.find((r) => r.onSale);
  if (min !== max) return `${cad(min)} ~ ${cad(max)}`;
  return sale
    ? `${cad(min)} <span class="sale">세일 · 정가 ${cad(sale.listPriceCents)}</span>`
    : cad(min);
}

// ---------------------------------------------------------------------------

export type MissingProduct = {
  brand: string;
  name: string;
  codes: string[];
  /** 이름으로 여러 건이 걸려 자동으로 고르지 못한 URL 들 */
  candidates?: string[];
};

/** 왜 못 받았는지. 다음 행동이 각각 다르다. */
function missReason(m: MissingProduct): string {
  if (m.candidates?.length) {
    return (
      `이름 후보 ${m.candidates.length}건 중 고르지 못함 — 아래에서 하나를 골라 ` +
      `<code>data/supplier-urls.json</code> 에 <code>"via":"manual"</code> 로 적어 넣어라<br>` +
      m.candidates.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`).join('<br>')
    );
  }
  if (m.codes.length === 0) {
    return '상품코드 없음 — 원본 폴더 <code>details.txt</code> 에 <code>Style Number</code> 를 넣고 카탈로그를 다시 만들어라';
  }
  return '북마클릿으로 이 상품 페이지에서 받아오면 된다';
}

export function renderStockHtml(
  results: ProductStock[],
  events: StockEvent[],
  meta: {
    startedAt: string;
    durationMs: number;
    comparedWith: string | null;
    /** 카탈로그에 있는데 이번에 못 받은 상품. 다음에 무엇을 할지 알려 준다. */
    missing?: MissingProduct[];
  },
): string {
  const ok = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const total = summarize(ok.flatMap((r) => verifiedRows(r.rows)));
  const brands = [...new Set(ok.map((r) => r.brand))];

  const date = new Date(meta.startedAt).toISOString().slice(0, 16).replace('T', ' ');

  const productCards = ok
    .map((p) => {
      const s = summarize(verifiedRows(p.rows));
      const unknown = unknownColours(p.rows);
      const hasOut = s.outOfStock > 0;
      const manual = p.rows.some((r) => r.source === 'manual');
      const searchText = [p.productName, p.productCode, ...p.rows.map((r) => r.colour)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return `<details class="card" open
        data-brand="${esc(p.brand)}"
        data-out="${hasOut ? '1' : '0'}"
        data-search="${esc(searchText)}">
        <summary>
          <span class="pname">${esc(p.productName)}</span>
          <span class="badges">
            <span class="badge b-brand">${esc(BRANDS[p.brand].labelKo)}</span>
            ${manual ? '<span class="badge b-manual" title="북마클릿으로 직접 수집">수동</span>' : ''}
            <span class="badge ${hasOut ? 'b-out' : 'b-ok'}">재고 ${s.inStock}/${s.totalVariants}</span>
            ${unknown > 0 ? `<span class="badge b-unk" title="사이즈를 못 받아 재고를 확인하지 못한 색상">미확인 ${unknown}색</span>` : ''}
          </span>
        </summary>
        <div class="meta">
          <code>${esc(p.productCode ?? '-')}</code>
          <span>${priceLabel(p.rows)}</span>
          <span>색상 ${summarize(p.rows).colours} × 사이즈 ${s.sizes || 1}</span>
          ${unknown > 0 ? `<span class="unk-note">사이즈 미확인 ${unknown}색</span>` : ''}
          <a href="${esc(p.productUrl)}" target="_blank" rel="noopener">상품 페이지 ↗</a>
        </div>
        ${productBody(p.rows)}
      </details>`;
    })
    .join('');

  const eventRows = sortEvents(events)
    .map((e) => {
      const change =
        e.deltaCents !== undefined
          ? `${cad(Number(e.before))} → ${cad(Number(e.after))} <b>(${e.deltaCents > 0 ? '+' : ''}${(e.deltaCents / 100).toFixed(2)})</b>`
          : `${esc(e.before ?? '—')} → ${esc(e.after ?? '—')}`;
      return `<tr>
        <td><span class="ev ${EVENT_CLASS[e.type]}">${EVENT_LABEL[e.type]}</span></td>
        <td>${esc(BRANDS[e.brand].labelKo)}</td>
        <td><a href="${esc(e.productUrl)}" target="_blank" rel="noopener">${esc(e.productName)}</a></td>
        <td>${esc(e.colour ?? '—')}</td>
        <td class="ctr">${esc(e.size)}</td>
        <td>${change}</td>
      </tr>`;
    })
    .join('');

  const eventSection = events.length
    ? `<section>
        <h2>변화 <span class="dim">${meta.comparedWith ? `이전 스냅샷 ${esc(meta.comparedWith)} 대비` : '최초 실행'}</span></h2>
        <table class="ev-table"><thead><tr>
          <th>유형</th><th>브랜드</th><th>상품</th><th>색상</th><th>사이즈</th><th>변화</th>
        </tr></thead><tbody>${eventRows}</tbody></table>
      </section>`
    : meta.comparedWith
      ? `<section><h2>변화</h2><p class="dim">이전 스냅샷(${esc(meta.comparedWith)}) 대비 변화 없음.</p></section>`
      : '';

  /*
   * 미수집 목록.
   * "몇 건 받았다"보다 "무엇이 비었다"가 다음 행동을 정한다.
   * 봇 차단 브랜드는 여기 뜬 상품을 북마클릿으로 받아오면 된다.
   */
  const miss = meta.missing ?? [];
  const missSection = miss.length
    ? `<section>
        <h2>아직 못 받은 상품 <span class="warn-pill">${miss.length}</span></h2>
        <p class="dim" style="margin:0 0 12px">
          카탈로그에 등록돼 있는데 이번 수집에 없다. 봇 차단 브랜드는 해당 상품 페이지에서
          북마클릿을 눌러 받아오면 다음 실행부터 자동으로 대조된다.
        </p>
        <table class="ev-table"><thead><tr>
          <th>브랜드</th><th>상품</th><th>상품코드</th><th>사유 · 할 일</th>
        </tr></thead><tbody>
        ${miss
          .map(
            (m) =>
              `<tr><td>${esc(BRANDS[m.brand as keyof typeof BRANDS]?.labelKo ?? m.brand)}</td>` +
              `<td>${esc(m.name)}</td>` +
              `<td class="url">${esc(m.codes.join(', ') || '—')}</td>` +
              `<td class="url">${missReason(m)}</td></tr>`,
          )
          .join('')}
        </tbody></table>
      </section>`
    : '';

  const failSection = failed.length
    ? `<section>
        <h2>수집 실패 <span class="warn-pill">${failed.length}</span></h2>
        <p class="warn">수집 실패는 품절이 아니다. 마지막 성공값으로 판매를 지속하면 안 된다 (PROJECT.md §6.3 5번).</p>
        <table class="ev-table"><thead><tr><th>브랜드</th><th>URL</th><th>사유</th></tr></thead><tbody>
        ${failed
          .map(
            (f) =>
              `<tr><td>${esc(BRANDS[f.brand].labelKo)}</td><td class="url">${esc(f.productUrl)}</td><td>${esc(f.error)}</td></tr>`,
          )
          .join('')}
        </tbody></table>
      </section>`
    : '';

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>재고 조회 ${esc(date)}</title>
<style>
:root{
  --bg:#fff; --fg:#16181d; --dim:#6b7280; --line:#e5e7eb; --card:#fff;
  --ok:#059669; --out:#dc2626; --low:#d97706; --accent:#111827; --chip:#f3f4f6;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#0f1115; --fg:#e6e8ec; --dim:#9aa1ad; --line:#252a33; --card:#161a20;
  --ok:#34d399; --out:#f87171; --low:#fbbf24; --accent:#e6e8ec; --chip:#1e232b;
}}
*{box-sizing:border-box}
body{margin:0;padding:32px 24px 80px;background:var(--bg);color:var(--fg);
  font:15px/1.6 -apple-system,"Segoe UI","Malgun Gothic",sans-serif}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:20px;margin:0 0 4px}
h2{font-size:16px;margin:36px 0 12px;display:flex;align-items:center;gap:8px}
.dim{color:var(--dim);font-weight:400;font-size:13px}
.sub{color:var(--dim);font-size:13px;margin:0 0 24px}

.stats{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 8px}
.stat{background:var(--chip);border-radius:10px;padding:10px 16px;min-width:96px}
.stat b{display:block;font-size:20px;line-height:1.2}
.stat span{font-size:12px;color:var(--dim)}
.stat.bad b{color:var(--out)}

.bar{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);
  padding:12px 0;margin:20px 0 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bar input[type=search]{flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--line);
  border-radius:8px;background:var(--card);color:var(--fg);font-size:14px}
.chip{border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:999px;
  padding:6px 14px;font-size:13px;cursor:pointer;user-select:none}
.chip[aria-pressed=true]{background:var(--accent);color:var(--bg);border-color:var(--accent)}

.card{border:1px solid var(--line);border-radius:12px;background:var(--card);
  margin:12px 0;padding:0 18px 4px}
.card[hidden]{display:none}
summary{cursor:pointer;padding:14px 0;display:flex;justify-content:space-between;
  align-items:center;gap:12px;flex-wrap:wrap}
summary::-webkit-details-marker{display:none}
.pname{font-weight:600}
.badges{display:flex;gap:6px;align-items:center}
.badge{font-size:12px;padding:3px 9px;border-radius:999px;background:var(--chip);color:var(--dim)}
.b-ok{color:var(--ok)} .b-out{color:var(--out)}
.b-manual{border:1px dashed var(--line)}
.b-unk{color:var(--low);border-color:var(--low)}
.meta{display:flex;gap:14px;flex-wrap:wrap;align-items:center;font-size:13px;
  color:var(--dim);padding:0 0 12px;border-top:1px solid var(--line);padding-top:12px}
.meta code{background:var(--chip);padding:2px 7px;border-radius:5px;color:var(--fg)}
.meta a{color:inherit}
.sale{color:var(--out);font-size:12px}

table{border-collapse:collapse;width:100%;font-size:13px}
.mx{margin:0 0 16px;display:block;overflow-x:auto;white-space:nowrap}
.mx th,.mx td{border:1px solid var(--line);padding:7px 10px;text-align:center}
.mx th{background:var(--chip);font-weight:600;font-size:12px}
.mx td.c{text-align:left;white-space:nowrap;font-weight:500}
.mx td.sku{text-align:left;font-family:ui-monospace,monospace;font-size:12px;color:var(--dim)}
.mx td.p{text-align:right;white-space:nowrap}
td.m{font-size:15px;cursor:help}
td.m.ok{color:var(--ok)} td.m.out{color:var(--out)}
td.m.low{color:var(--low)} td.m.none{color:var(--line)} td.m.unk{color:var(--dim)}
.style{margin:0 0 8px}
.style-h{font-size:12px;color:var(--dim);margin:10px 0 6px}
.style-h code{background:var(--chip);padding:2px 6px;border-radius:4px;color:var(--fg)}

.ev-table{margin:0 0 8px}
.ev-table th,.ev-table td{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left}
.ev-table th{font-size:12px;color:var(--dim);font-weight:600}
.ev-table td.ctr{text-align:center}
.ev-table a{color:inherit}
.ev-table .url{font-family:ui-monospace,monospace;font-size:11px;word-break:break-all}
.ev{font-size:12px;padding:3px 9px;border-radius:999px;white-space:nowrap}
.ev-oos{background:#fee2e2;color:#991b1b} .ev-restock{background:#d1fae5;color:#065f46}
.ev-up{background:#ffedd5;color:#9a3412} .ev-down{background:#e0f2fe;color:#075985}
.ev-low{background:#fef3c7;color:#92400e} .ev-add{background:var(--chip);color:var(--dim)}
.ev-rm{background:var(--chip);color:var(--dim)}
@media (prefers-color-scheme:dark){
  .ev-oos{background:#4c1d1d;color:#fca5a5} .ev-restock{background:#0f3d2e;color:#6ee7b7}
  .ev-up{background:#4a2410;color:#fdba74} .ev-down{background:#0c3346;color:#7dd3fc}
  .ev-low{background:#422c06;color:#fcd34d}
}
.warn{background:#fffbeb;border-left:3px solid var(--low);padding:12px 14px;
  border-radius:0 8px 8px 0;font-size:13px;color:#92400e}
@media (prefers-color-scheme:dark){.warn{background:#2a2109;color:#fcd34d}}
.warn-pill{background:var(--out);color:#fff;font-size:12px;padding:2px 9px;border-radius:999px}
.legend{font-size:12px;color:var(--dim);margin:6px 0 0}
.unk-note{color:var(--low)}
.empty{color:var(--dim);padding:40px 0;text-align:center}
footer{margin:48px 0 0;padding-top:20px;border-top:1px solid var(--line);
  font-size:12px;color:var(--dim)}
</style></head><body><div class="wrap">

<h1>캐나다 공식몰 재고 조회</h1>
<p class="sub">${esc(date)} UTC · 소요 ${(meta.durationMs / 1000).toFixed(0)}초</p>

<div class="stats">
  <div class="stat"><b>${ok.length}</b><span>상품</span></div>
  <div class="stat"><b>${total.totalVariants}</b><span>variant</span></div>
  <div class="stat"><b>${total.inStock}</b><span>재고</span></div>
  <div class="stat${total.outOfStock ? ' bad' : ''}"><b>${total.outOfStock}</b><span>품절</span></div>
  ${failed.length ? `<div class="stat bad"><b>${failed.length}</b><span>수집 실패</span></div>` : ''}
  ${miss.length ? `<div class="stat bad"><b>${miss.length}</b><span>미수집</span></div>` : ''}
</div>
<p class="legend">● 재고 · ◐ 임박 · ○ 품절 · ✕ 단종 · <b>? 미확인</b> · · 미편성
&nbsp;|&nbsp; 칸에 마우스를 올리면 SKU·가격이 보입니다</p>
<p class="legend"><b>?</b> 는 그 색상의 사이즈별 재고를 못 받았다는 뜻입니다 — 재고가 없다는 뜻이 아닙니다.
사이트가 선택된 색상의 사이즈만 보여 주기 때문이며, 해당 색상을 고른 뒤 <b>재고수집</b>을 누르면 채워집니다.</p>

${eventSection}

<h2>상품별 재고</h2>
<div class="bar">
  <input type="search" id="q" placeholder="상품명 · 상품코드 · 색상 검색">
  ${brands.map((b) => `<button class="chip" data-filter-brand="${esc(b)}" aria-pressed="true">${esc(BRANDS[b].labelKo)}</button>`).join('')}
  <button class="chip" id="onlyOut" aria-pressed="false">품절 있는 상품만</button>
  <button class="chip" id="toggleAll" aria-pressed="true">모두 펼치기</button>
</div>

<div id="list">${productCards || '<p class="empty">표시할 상품이 없습니다.</p>'}</div>
<p class="empty" id="noHit" hidden>조건에 맞는 상품이 없습니다.</p>

${missSection}

${failSection}

<footer>
재고는 이 시각 기준 스냅샷입니다. 주문매입 상품 판매는 신선도 게이트(기본 6시간)를 통과해야 합니다.<br>
원자료는 같은 폴더의 <code>.csv</code> / <code>.json</code> 을 참고하세요.
</footer>
</div>

<script>
(function(){
  var cards = [].slice.call(document.querySelectorAll('.card'));
  var q = document.getElementById('q');
  var onlyOut = document.getElementById('onlyOut');
  var toggleAll = document.getElementById('toggleAll');
  var noHit = document.getElementById('noHit');
  var brandBtns = [].slice.call(document.querySelectorAll('[data-filter-brand]'));

  function pressed(el){ return el.getAttribute('aria-pressed') === 'true'; }

  function apply(){
    var term = (q.value || '').trim().toLowerCase();
    var wantOut = pressed(onlyOut);
    var active = brandBtns.filter(pressed).map(function(b){ return b.dataset.filterBrand; });
    var hits = 0;

    cards.forEach(function(c){
      var show = active.indexOf(c.dataset.brand) !== -1
        && (!wantOut || c.dataset.out === '1')
        && (!term || c.dataset.search.indexOf(term) !== -1);
      c.hidden = !show;
      if (show) hits++;
    });
    noHit.hidden = hits > 0;
  }

  function toggle(el){ el.setAttribute('aria-pressed', pressed(el) ? 'false' : 'true'); apply(); }

  q.addEventListener('input', apply);
  onlyOut.addEventListener('click', function(){ toggle(onlyOut); });
  brandBtns.forEach(function(b){ b.addEventListener('click', function(){ toggle(b); }); });

  toggleAll.addEventListener('click', function(){
    var open = !pressed(toggleAll);
    toggleAll.setAttribute('aria-pressed', open ? 'true' : 'false');
    toggleAll.textContent = open ? '모두 펼치기' : '모두 접기';
    cards.forEach(function(c){ c.open = open; });
  });
})();
</script>
</body></html>`;
}
