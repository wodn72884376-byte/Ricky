/**
 * 리포트 목록 대시보드.
 *
 * 실행할 때마다 타임스탬프가 붙은 파일이 쌓인다. 어느 게 최신인지 매번
 * 폴더를 뒤지게 하지 않으려고, 고정 주소 하나(`data/index.html`)에서
 * 최신 리포트로 바로 들어가고 지난 이력도 훑을 수 있게 한다.
 *
 * 이 파일 주소는 바뀌지 않으므로 브라우저 즐겨찾기에 걸어 두면 된다.
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export type ReportEntry = {
  tag: string;
  html: string;
  csv: string | null;
  json: string | null;
  when: Date;
  /** 요약 — 스냅샷에서 읽는다. 못 읽으면 null. */
  summary: { products: number; variants: number; inStock: number; outOfStock: number } | null;
  events: number;
};

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** data/ 에 쌓인 재고 리포트를 최신순으로 모은다. */
export async function collectReports(dir: string): Promise<ReportEntry[]> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  const tags = [
    ...new Set(
      files
        .filter((f) => f.startsWith('재고-') && f.endsWith('.html'))
        .map((f) => f.replace(/^재고-|\.html$/g, '')),
    ),
  ].sort((a, b) => b.localeCompare(a));

  const out: ReportEntry[] = [];
  for (const tag of tags) {
    const html = `재고-${tag}.html`;
    const csv = files.includes(`재고-${tag}.csv`) ? `재고-${tag}.csv` : null;
    const jsonName = files.includes(`재고-${tag}.json`) ? `재고-${tag}.json` : null;

    let when = parseTag(tag);
    if (!when) {
      try {
        when = (await stat(join(dir, html))).mtime;
      } catch {
        when = new Date(0);
      }
    }

    let summary: ReportEntry['summary'] = null;
    let events = 0;
    if (jsonName) {
      try {
        const { readFile } = await import('node:fs/promises');
        const raw = JSON.parse(await readFile(join(dir, jsonName), 'utf8')) as {
          rows?: Array<{ availability: string; productUrl: string }>;
          events?: unknown[];
        };
        const rows = raw.rows ?? [];
        summary = {
          products: new Set(rows.map((r) => r.productUrl)).size,
          variants: rows.length,
          inStock: rows.filter((r) => r.availability === 'in_stock').length,
          outOfStock: rows.filter((r) => r.availability === 'out_of_stock').length,
        };
        events = raw.events?.length ?? 0;
      } catch {
        // 요약을 못 읽어도 목록에는 남긴다
      }
    }

    out.push({ tag, html, csv, json: jsonName, when, summary, events });
  }
  return out;
}

/** 20260828084747 → Date */
function parseTag(tag: string): Date | null {
  const m = tag.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, sec] = m;
  const t = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${sec}Z`);
  return Number.isFinite(t) ? new Date(t) : null;
}

const fmt = (d: Date) =>
  d.getTime() === 0 ? '—' : d.toISOString().slice(0, 16).replace('T', ' ');

export function renderDashboard(reports: ReportEntry[]): string {
  const latest = reports[0];

  const rows = reports
    .map((r) => {
      const s = r.summary;
      return `<tr>
        <td><a href="${esc(r.html)}">${esc(fmt(r.when))}</a></td>
        <td class="n">${s ? s.products : '—'}</td>
        <td class="n">${s ? s.variants : '—'}</td>
        <td class="n ok">${s ? s.inStock : '—'}</td>
        <td class="n ${s && s.outOfStock ? 'out' : ''}">${s ? s.outOfStock : '—'}</td>
        <td class="n">${r.events || '—'}</td>
        <td class="files">
          <a href="${esc(r.html)}">리포트</a>
          ${r.csv ? `<a href="${esc(r.csv)}">CSV</a>` : ''}
          ${r.json ? `<a href="${esc(r.json)}">JSON</a>` : ''}
        </td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RICKY 재고 리포트</title>
<style>
:root{--bg:#fff;--fg:#16181d;--dim:#6b7280;--line:#e5e7eb;--card:#fff;
  --ok:#059669;--out:#dc2626;--accent:#111827;--chip:#f3f4f6}
@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e6e8ec;--dim:#9aa1ad;
  --line:#252a33;--card:#161a20;--ok:#34d399;--out:#f87171;--accent:#e6e8ec;--chip:#1e232b}}
*{box-sizing:border-box}
body{margin:0;padding:40px 24px 80px;background:var(--bg);color:var(--fg);
  font:15px/1.6 -apple-system,"Segoe UI","Malgun Gothic",sans-serif}
.wrap{max-width:960px;margin:0 auto}
h1{font-size:20px;margin:0 0 4px}
.sub{color:var(--dim);font-size:13px;margin:0 0 28px}
h2{font-size:15px;margin:32px 0 12px}
.latest{display:block;border:1px solid var(--line);border-radius:14px;background:var(--card);
  padding:22px 24px;text-decoration:none;color:inherit;margin:0 0 8px}
.latest:hover{border-color:var(--accent)}
.latest .t{font-size:13px;color:var(--dim)}
.latest .big{font-size:22px;font-weight:600;margin:4px 0 12px}
.stats{display:flex;gap:22px;flex-wrap:wrap;font-size:13px;color:var(--dim)}
.stats b{color:var(--fg);font-size:16px;margin-right:4px}
.stats .ok b{color:var(--ok)} .stats .out b{color:var(--out)}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left}
th{font-size:12px;color:var(--dim);font-weight:600}
td.n{text-align:right;font-variant-numeric:tabular-nums}
td.n.ok{color:var(--ok)} td.n.out{color:var(--out)}
td.files a{margin-right:10px;font-size:12px;color:var(--dim)}
a{color:inherit}
.cmd{background:var(--chip);border-radius:10px;padding:16px 18px;margin:8px 0 0;font-size:13px}
.cmd code{display:block;font-family:ui-monospace,monospace;margin:6px 0;color:var(--fg)}
.cmd .c{color:var(--dim);font-size:12px}
.empty{color:var(--dim);padding:40px 0;text-align:center}
</style></head><body><div class="wrap">

<h1>RICKY 재고 리포트</h1>
<p class="sub">이 페이지를 즐겨찾기에 등록해 두면 항상 최신 리포트로 들어갈 수 있습니다.</p>

${
  latest
    ? `<a class="latest" href="${esc(latest.html)}">
    <div class="t">최신 리포트</div>
    <div class="big">${esc(fmt(latest.when))}</div>
    <div class="stats">
      <span><b>${latest.summary?.products ?? '—'}</b>상품</span>
      <span><b>${latest.summary?.variants ?? '—'}</b>variant</span>
      <span class="ok"><b>${latest.summary?.inStock ?? '—'}</b>재고</span>
      <span class="out"><b>${latest.summary?.outOfStock ?? '—'}</b>품절</span>
      <span><b>${latest.events}</b>변화</span>
    </div>
  </a>`
    : '<p class="empty">아직 리포트가 없습니다. 아래 명령으로 수집을 실행하세요.</p>'
}

<div class="cmd">
  <div class="c">수집 실행 — 자동(아크테릭스·코치) + 북마클릿(폴로·룰루레몬·캐나다구스)을 한 번에</div>
  <code>npm run stock:all</code>
  <div class="c">북마클릿 설치 안내</div>
  <code>npm run bookmarklet</code>
</div>

${
  reports.length
    ? `<h2>지난 리포트 <span style="color:var(--dim);font-weight:400">${reports.length}건</span></h2>
<table><thead><tr>
  <th>시각</th><th style="text-align:right">상품</th><th style="text-align:right">variant</th>
  <th style="text-align:right">재고</th><th style="text-align:right">품절</th>
  <th style="text-align:right">변화</th><th>파일</th>
</tr></thead><tbody>${rows}</tbody></table>`
    : ''
}

</div></body></html>`;
}
