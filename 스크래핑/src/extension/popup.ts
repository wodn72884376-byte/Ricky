/**
 * 확장 팝업. 상태를 보여주고 수동 실행·주기 변경만 한다.
 *
 * 여기서 수집 규칙을 건드리지 않는다 — 화면은 배경 스크립트가 하는 일을 비출 뿐이다.
 */
export const POPUP_HTML = String.raw`<!doctype html>
<meta charset="utf-8">
<style>
  body{font:13px/1.6 -apple-system,"Segoe UI","Malgun Gothic",sans-serif;width:280px;margin:0;padding:14px;color:#16181d}
  h1{font-size:14px;margin:0 0 10px}
  .row{display:flex;justify-content:space-between;gap:8px;padding:3px 0}
  .dim{color:#6b7280}
  .warn{color:#d97706}
  button{width:100%;padding:8px;margin-top:10px;border:1px solid #d1d5db;border-radius:6px;background:#111;color:#fff;font:inherit;cursor:pointer}
  button:disabled{background:#9ca3af;cursor:default}
  select{font:inherit;padding:2px}
  .note{margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px}
</style>
<h1>RICKY 재고수집</h1>
<div class="row"><span class="dim">상태</span><b id="st">—</b></div>
<div class="row"><span class="dim">마지막 수집</span><span id="last">—</span></div>
<div class="row"><span class="dim">받은 상품</span><span id="got">—</span></div>
<div class="row" id="blockrow" hidden><span class="warn">robots 가 막음</span><span id="blocked"></span></div>
<div class="row" id="unkrow" hidden><span class="warn">robots 못 읽음</span><span id="unknown"></span></div>
<div class="row"><span class="dim">주기</span>
  <select id="hours">
    <option value="3">3시간</option><option value="6">6시간</option>
    <option value="12">12시간</option><option value="24">24시간</option>
  </select>
</div>
<button id="run">지금 수집</button>
<button id="stop" hidden>정지</button>
<button id="save" hidden>저장하지 못한 결과 내려받기</button>
<div class="note">받은 파일은 다운로드 폴더에 저장된다.<br>터미널에서 <code>npm run stock:all</code>.</div>
<script src="popup.js"></script>
`;

export const POPUP_JS = String.raw`
const $ = (id) => document.getElementById(id);
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('ko-KR', { hour12: false }) : '—');

async function paint() {
  const s = await chrome.runtime.sendMessage({ type: 'state' });
  $('st').textContent = s.running ? '수집 중 ' + (s.done || 0) + '/' + (s.total || 0)
    : s.lastError ? '실패' : s.stopped ? '정지됨' : '대기';
  $('last').textContent = fmt(s.finishedAt);
  $('got').textContent = s.collected == null ? '—' : s.collected + '건';
  /*
   * 둘을 합치면 안 된다 — 고치는 방법이 정반대다.
   *   막음     = 공식몰이 그 경로를 금지했다. 우리가 할 일은 없다.
   *   못 읽음  = robots 를 못 봤으니 안전하게 건너뛴 것. 다시 돌리면 될 수 있다.
   * 합쳐 놨더니 캐나다구스 14건이 '막힌' 것으로 읽혔는데 실제로는 못 읽은 것이었다.
   */
  $('blockrow').hidden = !s.skippedRobots;
  $('blocked').textContent = (s.skippedRobots || 0) + '건';
  $('unkrow').hidden = !s.skippedUnknown;
  $('unknown').textContent = (s.skippedUnknown || 0) + '건 · 건너뜀';
  /*
   * 정지는 도는 중에만 보인다. 늘 띄워 두면 눌러도 아무 일이 없어 고장으로 읽힌다.
   * 멈춘 회차는 '정지됨' 으로 적는다 — '완료' 로 적으면 덜 받은 걸 다 받은 줄 안다.
   */
  $('stop').hidden = !s.running;
  $('run').disabled = !!s.running;
  $('save').hidden = !s.pendingSave;
  if (s.hours) $('hours').value = String(s.hours);
}

/*
 * 서비스 워커에서 내려받기가 막힌 경우의 대비책.
 * 팝업에는 DOM 이 있어 blob 을 만들 수 있다 — 수집해 놓은 결과를 잃지 않는다.
 */
$('save').onclick = async () => {
  const p = await chrome.runtime.sendMessage({ type: 'pending' });
  if (!p) return;
  const url = URL.createObjectURL(new Blob([p.json], { type: 'application/json' }));
  await chrome.downloads.download({ url, filename: p.filename, saveAs: false });
  await chrome.runtime.sendMessage({ type: 'saved' });
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  paint();
};

$('run').onclick = async () => {
  await chrome.runtime.sendMessage({ type: 'run' });
  setTimeout(paint, 300);
};
$('stop').onclick = async () => {
  /*
   * 열려 있는 탭은 끝까지 읽고 멈춘다 — 이미 연 페이지를 버리면 남의 사이트만
   * 두드리고 얻는 게 없다. 그때까지 받은 것은 저장된다.
   */
  $('stop').disabled = true;
  $('stop').textContent = '멈추는 중…';
  await chrome.runtime.sendMessage({ type: 'stop' });
  setTimeout(() => {
    $('stop').disabled = false;
    $('stop').textContent = '정지';
    paint();
  }, 600);
};
$('hours').onchange = async (e) => {
  await chrome.runtime.sendMessage({ type: 'schedule', hours: Number(e.target.value) });
  paint();
};

paint();
setInterval(paint, 1500);
`;
