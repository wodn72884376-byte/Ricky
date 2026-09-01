/**
 * 재고 수집 관리 콘솔 — `스마일리키/재고관리.html`
 *
 * 상품을 새로 등록할 때 **공식몰 URL 을 어디에 어떻게 넣는지**가 이 프로젝트에서
 * 가장 자주 막히는 지점이다. URL 이 없으면 확장이 갈 곳을 몰라 그 상품 재고는
 * 조용히 빠지는데, 오류가 나지 않으니 알아채기까지 오래 걸린다(캐나다구스 8건이
 * 그럴 뻔했다). 그래서 **빠진 것이 맨 위에 오도록** 만든다.
 *
 * 파일(`file://`)로 열리므로 이 페이지는 아무것도 쓰지 못한다. 대신 편집 결과를
 * `scripts/official-urls.json` 에 그대로 붙여 넣을 수 있는 모양으로 만들어 준다 —
 * 그 파일이 카탈로그보다 우선하는 원본이기 때문이다.
 */
import { BRANDS, toBrandKey } from '../config/brands.ts';
import { catalogTargets } from './catalog.ts';
import { CATALOG } from '@app/lib/catalog.generated.ts';

export type ConsoleVariant = { color: string; colorKo: string; url: string | null };

export type ConsoleProduct = {
  slug: string;
  brandKo: string;
  brandKey: string;
  name: string;
  gender: string;
  codes: string[];
  /** 실제로 열게 될 페이지들(경로가 같으면 접힌 뒤) */
  pages: string[];
  /** 색상마다 URL 이 따로인 브랜드에서만 채워진다 */
  variants: ConsoleVariant[];
  /** 이 브랜드를 확장이 맡는가 */
  viaExtension: boolean;
  checkedAt: string | null;
  inStock: number;
  totalSizes: number;
};

export type ConsoleData = {
  generatedAt: string;
  snapshot: string | null;
  products: ConsoleProduct[];
};

/** 연동 파일에서 slug 별 최신 관측을 뽑는다. */
export function observationsOf(
  variants: { slug: string; sizes: { availability: string }[] }[],
  checkedAt: string | null,
): Map<string, { inStock: number; total: number; checkedAt: string | null }> {
  const out = new Map<string, { inStock: number; total: number; checkedAt: string | null }>();
  for (const v of variants) {
    const cur = out.get(v.slug) ?? { inStock: 0, total: 0, checkedAt };
    for (const s of v.sizes) {
      cur.total += 1;
      if (s.availability === 'in_stock') cur.inStock += 1;
    }
    out.set(v.slug, cur);
  }
  return out;
}

export function buildConsoleData(opts: {
  observations: Map<string, { inStock: number; total: number; checkedAt: string | null }>;
  snapshot: string | null;
}): ConsoleData {
  const targets = new Map(catalogTargets().map((t) => [t.slug, t]));

  const products: ConsoleProduct[] = [];
  for (const p of CATALOG) {
    const key = toBrandKey(p.brandSlug);
    if (!key) continue;
    const t = targets.get(p.slug);
    const obs = opts.observations.get(p.slug);

    /*
     * 색상별 URL 을 쓰는 브랜드만 색상 행을 편다. 전부 펴면 표가 700줄이 되고,
     * 정작 봐야 할 "URL 없는 상품"이 묻힌다.
     */
    const colourUrls = p.variants.some((v) => v.officialUrl);

    products.push({
      slug: p.slug,
      brandKo: BRANDS[key].labelKo,
      brandKey: key,
      name: p.name,
      gender: p.gender,
      codes: t?.codes ?? [],
      pages: t?.officialUrls ?? [],
      variants: colourUrls
        ? p.variants.map((v) => ({ color: v.color, colorKo: v.colorKo, url: v.officialUrl ?? null }))
        : [],
      viaExtension: BRANDS[key].ca.automation === 'bookmarklet',
      checkedAt: obs?.checkedAt ?? null,
      inStock: obs?.inStock ?? 0,
      totalSizes: obs?.total ?? 0,
    });
  }

  // URL 이 없는 것이 맨 위. 이 페이지의 존재 이유다.
  products.sort((a, b) => {
    const miss = Number(a.pages.length === 0) - Number(b.pages.length === 0);
    if (miss !== 0) return -miss;
    return a.brandKo.localeCompare(b.brandKo, 'ko') || a.name.localeCompare(b.name, 'ko');
  });

  return { generatedAt: new Date().toISOString(), snapshot: opts.snapshot, products };
}

/*
 * DESIGN.md 를 따른다 — 순백 지면, 순흑 잉크, 그림자·그라디언트·장식 아이콘 없음.
 * 운영 경보는 색을 새로 만들지 않고 반전 칩 / #e8005d 텍스트 / #5d5d5d 로만 가른다(§14).
 */
const STYLE = `
:root{
  --ink:#000000; --paper:#ffffff;
  --muted:#5d5d5d;                 /* 읽혀야 하는 보조 텍스트 */
  --decor:rgba(93,93,93,0.64);     /* 놓쳐도 되는 것 — 정보를 싣지 않는다 */
  --line:#c4c4c4;                  /* 라벨이 함께 있는 컨트롤 */
  --line-strong:#949494;           /* 보더가 없으면 컨트롤인지 알 수 없는 곳 */
  --alert:#e8005d;
}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);margin:0;
  font-family:"Pretendard Variable",Pretendard,ui-sans-serif,system-ui,sans-serif;
  font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:48px 24px 96px}
h1{font-size:clamp(30px,2.6vw,48px);font-weight:700;line-height:1.13;margin:0 0 8px}
h2{font-size:clamp(22px,1.5vw,28px);font-weight:700;line-height:1.36;margin:56px 0 4px}
.sub{color:var(--muted);font-size:14px;margin:0 0 4px}
.hint{color:var(--muted);font-size:13px;line-height:1.4;margin:0 0 20px}

/* 요약 — 숫자는 tabular-nums 로 자리를 고정한다 */
.stats{display:flex;flex-wrap:wrap;gap:40px;margin:32px 0 8px;
  border-top:1px solid var(--line);padding-top:24px}
.stat b{display:block;font-size:30px;font-weight:700;line-height:1.13;
  font-variant-numeric:tabular-nums}
.stat span{font-size:13px;color:var(--muted)}
.stat.alarm b{color:var(--alert)}

/* 반전 칩 — 색이 아니라 반전으로 주의를 끈다 */
.chip{display:inline-block;background:var(--ink);color:var(--paper);
  font-size:12px;font-weight:700;border-radius:2px;padding:2px 7px;
  font-variant-numeric:tabular-nums}
.chip.quiet{background:transparent;color:var(--muted);border:1px solid var(--line);font-weight:400}

/* 주소 칸이 가장 넓어야 한다 — 이 표에서 사람이 고치는 건 주소뿐이다 */
table{border-collapse:collapse;width:100%;font-size:14px;margin-top:16px;table-layout:fixed}
col.c-brand{width:118px} col.c-name{width:26%} col.c-when{width:96px} col.c-stock{width:64px}
th{text-align:left;font-size:13px;font-weight:400;color:var(--muted);
  border-bottom:1px solid var(--ink);padding:0 10px 8px}
td{border-bottom:1px solid #ebebeb;padding:11px 10px;vertical-align:top}
tbody tr.miss td{border-bottom-color:var(--line)}
.name{font-weight:700}
.meta{color:var(--muted);font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.warn{color:var(--alert);font-weight:700;font-size:12px}

input[type=url]{width:100%;font:inherit;font-size:13px;padding:7px 9px;
  border:1px solid var(--line-strong);border-radius:0;background:var(--paper);color:var(--ink)}
input[type=url]:focus{outline:2px solid var(--ink);outline-offset:-1px}
input.dirty{border-color:var(--ink);border-width:2px}

button{font:inherit;cursor:pointer}
/* 요소에 묶는다 — 클래스만으로 두면 칩 같은 다른 요소가 조용히 물려받는다(실측) */
button.ghost{font-size:15px;font-weight:700;background:var(--paper);color:var(--ink);
  border:1px solid var(--line);border-radius:4px;padding:11px 22px}
button.solid{font-size:15px;font-weight:400;background:var(--ink);color:var(--paper);
  border:1px solid var(--ink);border-radius:2px;padding:12px 22px}
button:disabled{opacity:0.4;cursor:default}   /* 보더 색은 바꾸지 않는다 */

.drag{display:inline-block;background:var(--ink);color:var(--paper);text-decoration:none;
  font-size:15px;font-weight:400;border-radius:2px;padding:12px 22px;cursor:grab}
.drag:active{cursor:grabbing}

pre{background:var(--paper);border:1px solid var(--line);border-radius:0;
  padding:16px;font-size:13px;line-height:1.5;overflow:auto;max-height:340px;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;
  word-break:break-all;margin:12px 0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:16px 0}
details{margin-top:8px}
summary{cursor:pointer;font-size:13px;color:var(--muted)}
details[open] summary{margin-bottom:8px}
.colour{display:grid;grid-template-columns:190px 1fr;gap:8px;align-items:center;margin:6px 0}
.colour span{font-size:13px;color:var(--muted)}
.steps{padding-left:20px;margin:8px 0 0}
.steps li{margin:8px 0;font-size:14px}
@media(max-width:820px){
  colgroup{display:none}
  .wrap{padding:32px 20px 72px}
  .stats{gap:24px}
  table,thead,tbody,th,td,tr{display:block}
  thead{display:none}
  td{border:none;padding:3px 0}
  tbody tr{border-bottom:1px solid var(--line);padding:14px 0}
  .colour{grid-template-columns:1fr}
}
`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 사람이 읽는 상대 시각. 절대 시각은 title 로 함께 남긴다. */
export function agoKo(iso: string | null, now = Date.now()): string {
  if (!iso) return '수집 전';
  const ms = now - Date.parse(iso);
  if (!Number.isFinite(ms)) return '수집 전';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return '방금';
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

/**
 * 재고 신선도. PROJECT.md §6 — 주문매입은 임계치(기본 6h) 안이고 in_stock 일 때만 판다.
 * 판매 가부를 정하는 값이라 페이지에서도 같은 기준으로 보여 준다.
 */
export const FRESH_HOURS = 6;

export function isStale(iso: string | null, now = Date.now()): boolean {
  if (!iso) return true;
  const ms = now - Date.parse(iso);
  return !Number.isFinite(ms) || ms > FRESH_HOURS * 3_600_000;
}

export function consolePage(
  data: ConsoleData,
  bookmarklets: { batch: string; single: string },
): string {
  const now = Date.parse(data.generatedAt);
  const missing = data.products.filter((p) => p.pages.length === 0);
  const stale = data.products.filter((p) => isStale(p.checkedAt, now));
  const pages = data.products.reduce((n, p) => n + p.pages.length, 0);

  const rows = data.products
    .map((p) => {
      const miss = p.pages.length === 0;
      const url0 = p.pages[0] ?? '';
      const colours = p.variants.length
        ? `<details><summary>색상별 주소 ${p.variants.length}개</summary>${p.variants
            .map(
              (v) =>
                `<div class="colour"><span>${esc(v.colorKo || v.color)}</span>` +
                `<input type="url" data-slug="${esc(p.slug)}" data-color="${esc(v.color)}" ` +
                `value="${esc(v.url ?? '')}" placeholder="https://…"></div>`,
            )
            .join('')}</details>`
        : '';

      return `<tr class="${miss ? 'miss' : ''}">
  <td class="meta">${esc(p.brandKo)}${p.viaExtension ? ' <span class="chip quiet">확장</span>' : ''}</td>
  <td><div class="name">${esc(p.name)}</div>
      <div class="meta">${esc(p.slug)}${p.codes.length ? ` · ${esc(p.codes.join(' '))}` : ''}</div></td>
  <td>${
    miss
      ? '<div class="warn">공식몰 주소 없음 — 이 상품은 수집되지 않는다</div>'
      : `<div class="meta">${p.pages.length}개 페이지</div>`
  }
      <input type="url" data-slug="${esc(p.slug)}" value="${esc(url0)}" placeholder="https://…">
      ${colours}</td>
  <td class="num meta" title="${esc(p.checkedAt ?? '')}">${esc(agoKo(p.checkedAt, now))}</td>
  <td class="num">${
    p.totalSizes === 0
      ? '<span class="meta">—</span>'
      : `${p.inStock}/${p.totalSizes}`
  }</td>
</tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RICKY 재고 수집 관리</title>
<style>${STYLE}</style></head><body><div class="wrap">

<h1>재고 수집 관리</h1>
<p class="sub">공식몰 주소를 넣고, 무엇이 수집되고 무엇이 빠지는지 본다.</p>
<p class="hint">${esc(new Date(data.generatedAt).toLocaleString('ko-KR'))} 기준${
    data.snapshot ? ` · 수집 ${esc(data.snapshot)}` : ''
  } · 카탈로그가 바뀌면 <code>npm run manage</code> 로 다시 만든다</p>

<div class="stats">
  <div class="stat"><b>${data.products.length}</b><span>등록 상품</span></div>
  <div class="stat"><b>${pages}</b><span>수집 페이지</span></div>
  <div class="stat${missing.length ? ' alarm' : ''}"><b>${missing.length}</b><span>주소 없음</span></div>
  <div class="stat"><b>${stale.length}</b><span>${FRESH_HOURS}시간 지남</span></div>
</div>

<h2>상품</h2>
<p class="hint">주소가 없는 상품이 맨 위에 온다. 칸을 고치면 아래에 붙여 넣을 JSON 이 만들어진다.</p>
<table>
  <colgroup><col class="c-brand"><col class="c-name"><col><col class="c-when"><col class="c-stock"></colgroup>
  <thead><tr>
    <th>브랜드</th><th>상품</th><th>공식몰 주소</th><th>마지막 확인</th><th>재고</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<h2>고친 주소 저장하기</h2>
<p class="hint">이 페이지는 파일이라 스스로 저장하지 못한다.
아래를 <code>스마일리키/scripts/official-urls.json</code> 에 붙여 넣고
<code>npm run catalog:import</code> 를 돌리면 반영된다.</p>
<div class="row">
  <button class="solid" id="copy" disabled>JSON 복사</button>
  <span class="meta" id="status">고친 것 없음</span>
</div>
<pre id="out">{}</pre>

<h2>북마클릿</h2>
<p class="hint">확장이 못 가는 곳이나, 새 상품 주소를 학습시킬 때 쓴다.
아래 두 개를 북마크바로 끌어다 놓는다 (안 보이면 <code>Ctrl+Shift+B</code>).</p>
<div class="row">
  <a class="drag" href="${esc(bookmarklets.batch)}">RICKY 목록수집</a>
  <a class="drag" href="${esc(bookmarklets.single)}">RICKY 재고수집</a>
</div>

<h2>새 상품을 넣을 때</h2>
<ol class="steps">
  <li>상품 폴더와 이미지를 넣고 <code>npm run catalog:import</code></li>
  <li>이 페이지를 <code>npm run manage</code> 로 다시 만든다 → 새 상품이 맨 위에 <b>주소 없음</b>으로 뜬다</li>
  <li>공식몰 상품 페이지 주소를 칸에 붙여 넣고, 위 JSON 을 <code>official-urls.json</code> 에 저장</li>
  <li><code>npm run catalog:import</code> 다시 → <code>npm run extension</code> → 크롬에서 확장 새로고침</li>
</ol>
<p class="hint">캐나다구스처럼 색상마다 페이지가 다른 브랜드는 색상별 칸을 쓴다.
경로가 같은 주소는 자동으로 하나로 접히므로 같은 페이지를 여러 번 열지 않는다.</p>

<script>
/*
 * 고친 칸만 모아 official-urls.json 모양으로 만든다.
 * 안 고친 것까지 내보내면 사람이 무엇을 바꿨는지 알 수 없고,
 * 카탈로그가 이미 아는 값을 손으로 관리하는 파일에 눌러 담게 된다.
 *
 * IIFE 로 감싼다. 최상위 var 는 window 의 속성이 되는데, window 에는 이미
 * status·name·length 같은 내장 속성이 있어 **조용히 덮어써진다** — 실측:
 * var status = document.getElementById(...) 는 window.status 가 문자열
 * 속성이라 엘리먼트가 문자열로 바뀌고, 이후 textContent 대입이 아무 일도 하지 않는다.
 */
(function () {
var out = document.getElementById('out');
var copy = document.getElementById('copy');
var note = document.getElementById('status');
var initial = new Map();

document.querySelectorAll('input[type=url]').forEach(function (el) {
  initial.set(el, el.value);
  el.addEventListener('input', rebuild);
});

function rebuild() {
  var byProduct = {};
  var byColor = {};
  var n = 0;

  document.querySelectorAll('input[type=url]').forEach(function (el) {
    var changed = el.value.trim() !== initial.get(el).trim();
    el.classList.toggle('dirty', changed);
    if (!changed || !el.value.trim()) return;
    n += 1;
    var slug = el.dataset.slug;
    if (el.dataset.color) {
      (byColor[slug] = byColor[slug] || {})[el.dataset.color] = el.value.trim();
    } else {
      byProduct[slug] = el.value.trim();
    }
  });

  var merged = {};
  Object.keys(byProduct).forEach(function (s) { merged[s] = { url: byProduct[s] }; });
  Object.keys(byColor).forEach(function (s) {
    merged[s] = Object.assign(merged[s] || {}, { byColor: byColor[s] });
  });

  out.textContent = JSON.stringify(merged, null, 2);
  copy.disabled = n === 0;
  note.textContent = n === 0 ? '고친 것 없음' : '고친 칸 ' + n + '개';
}

copy.addEventListener('click', function () {
  navigator.clipboard.writeText(out.textContent).then(
    function () { note.textContent = '복사했다'; },
    /* file:// 에서는 클립보드가 막힐 수 있다. 그때는 직접 고르게 둔다. */
    function () {
      note.textContent = '복사가 막혔다 — 아래 내용을 직접 선택해 복사해라';
      var r = document.createRange(); r.selectNodeContents(out);
      var s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  );
});
})();
</script>
</div></body></html>`;
}
