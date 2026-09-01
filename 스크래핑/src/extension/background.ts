/**
 * 확장의 배경 스크립트(서비스 워커) 소스.
 *
 * 문자열로 들고 있는 이유는 북마클릿과 같다 — 번들러를 하나 더 들이지 않고
 * 추출 코드(`collectorSource()`)를 그대로 이어 붙이기 위해서다.
 *
 * ## 정중함 (CLAUDE.md 규칙 8)
 * - 상품 사이에 지연을 둔다. 한 번에 여는 탭은 **하나**다.
 * - **robots.txt 를 브라우저 안에서 직접 읽어** 막힌 경로는 건너뛴다.
 *   서버에서는 캐나다구스 robots.txt 가 429 라 읽지 못했다 — 브라우저 세션에서는
 *   읽힌다. 못 읽으면 그 호스트는 **건드리지 않는다**(모르면 안 하는 쪽).
 * - 로그인·결제 영역은 어떤 경우에도 열지 않는다. 대상은 카탈로그가 준 상품 URL 뿐이다.
 *
 * ## 왜 배경 탭인가
 * iframe 은 X-Frame-Options 로 막히는 사이트가 많고, fetch 는 화면 상태(품절 버튼)를
 * 알 수 없다. 실제 탭에서 렌더된 화면을 읽어야 북마클릿과 같은 결과가 나온다.
 */
export const BACKGROUND_SOURCE = String.raw`
const ALARM = 'ricky-collect';

/** 기본 주기. 재고 신선도 임계(6시간)에 맞춘다 — 더 자주 돌 이유가 없다. */
const DEFAULT_HOURS = 6;
/** 상품 사이 간격(ms). 사람이 훑는 속도보다 느리게 둔다. */
const GAP_MS = 4000;
/** 페이지가 그려질 때까지 기다리는 시간(ms). */
const RENDER_MS = 7000;
/** 한 상품에 쓸 수 있는 최대 시간. 색상 순회 상한(45초)보다 넉넉히 크게 둔다. */
const READ_TIMEOUT_MS = 70000;
/** 한 회차에 여는 상품 수 상한. 사고가 나도 피해가 제한되도록. */
const MAX_PER_RUN = 80;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[RICKY]', ...a);

async function setState(patch) {
  const cur = (await chrome.storage.local.get('state')).state || {};
  await chrome.storage.local.set({ state: { ...cur, ...patch } });
}

// ── robots.txt ──────────────────────────────────────────────────
/*
 * 호스트마다 한 번 읽어 캐시한다. 못 읽으면 그 호스트는 통째로 건너뛴다 —
 * 무엇이 허용됐는지 모르는 채로 두드리지 않는다.
 */
const robotsCache = new Map();

function parseRobots(text) {
  const rules = [];
  let applies = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === 'user-agent') applies = value === '*';
    else if (applies && (field === 'disallow' || field === 'allow')) {
      if (value) rules.push({ allow: field === 'allow', path: value });
    }
  }
  return rules;
}

function pathMatches(pattern, path) {
  // robots 의 * 와 $ 만 다룬다. 나머지 문자는 그대로 맞춘다.
  const rx = new RegExp(
    '^' +
      pattern
        .replace(/[.+?^{}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\$$/, '$'),
  );
  return rx.test(path);
}

/**
 * robots.txt 를 탭으로 연다.
 *
 * 서비스워커의 fetch 는 **페이지 이동이 아니다.** 캐나다구스는 그 요청에
 * 429 + Kasada 챌린지를 주고, 그래서 대상 14건이 전부 '모름'으로 건너뛰어졌다.
 * 진짜 탭으로 이동하면 브라우저가 챌린지를 정상으로 처리한다.
 *
 * robots.txt 를 읽으려고 여는 것이므로 이 이동 자체는 robots 대상이 아니다.
 */
async function robotsViaTab(origin) {
  const tab = await chrome.tabs.create({ url: origin + '/robots.txt', active: false });
  try {
    await sleep(RENDER_MS);
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => document.body ? document.body.innerText : '',
    });
    const text = (res && res.result) || '';
    /*
     * 챌린지 페이지도 200 으로 온다. robots 처럼 생겼을 때만 믿는다 —
     * 아니면 '모름'으로 두고 건너뛴다. 잘못 읽고 여는 것보다 안 여는 게 낫다.
     */
    return /^\s*(user-agent|sitemap|allow|disallow)\s*:/im.test(text) ? text : null;
  } catch (e) {
    return null;
  } finally {
    try { await chrome.tabs.remove(tab.id); } catch (e) {}
  }
}

async function robotsAllows(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    try {
      const res = await fetch(u.origin + '/robots.txt', { credentials: 'omit' });
      // 404 는 "규칙 없음" 이다.
      if (res.status === 404) robotsCache.set(u.origin, []);
      else if (res.ok) robotsCache.set(u.origin, parseRobots(await res.text()));
      else {
        // 봇 방어가 서비스워커 fetch 를 막는 곳이 있다 — 탭으로 한 번 더 본다.
        const text = await robotsViaTab(u.origin);
        robotsCache.set(u.origin, text === null ? null : parseRobots(text));
      }
    } catch (e) {
      const text = await robotsViaTab(u.origin).catch(() => null);
      robotsCache.set(u.origin, text === null ? null : parseRobots(text));
    }
  }
  const rules = robotsCache.get(u.origin);
  if (rules === null) return null; // 모름
  // 가장 긴 규칙이 이긴다 (robots 표준)
  let best = null;
  for (const r of rules) {
    if (!pathMatches(r.path, u.pathname)) continue;
    if (!best || r.path.length > best.path.length) best = r;
  }
  return best ? best.allow : true;
}

// ── 한 상품 읽기 ────────────────────────────────────────────────
/**
 * 한 상품을 읽는다. **반드시 끝난다.**
 *
 * 사람이 수집 중인 탭을 닫으면 색상 순회 promise 가 영영 결말이 나지 않는다 —
 * 실측: 16/29 에서 회차가 통째로 붙잡혀 정지도 안 먹고 버튼도 안 풀렸다.
 * 한 상품이 회차 전체를 볼모로 잡게 두지 않는다.
 */
async function readOne(target) {
  const tab = await chrome.tabs.create({ url: target.url, active: false });
  const deadline = new Promise((resolve) =>
    setTimeout(() => resolve({ timedOut: true }), READ_TIMEOUT_MS));
  try {
    await sleep(RENDER_MS);

    /*
     * 두 번에 나눠 주입한다.
     *   1) collector.js 를 파일로 넣어 window.__rickyCollect 를 정의한다.
     *      추출 코드는 문자열이라 func 으로 못 넘기고, 페이지 CSP 가 eval 을 막는
     *      사이트가 많아 new Function 도 못 쓴다. 파일 주입은 둘 다 피한다.
     *   2) 그 함수를 불러 결과(Promise)를 받는다. func 이 돌려준 Promise 는
     *      executeScript 가 기다려 준다 — 색상 순회가 비동기라 이게 필요하다.
     * MAIN 세계에 넣어야 페이지의 JSON-LD·DOM 을 그대로 본다.
     */
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      files: ['collector.js'],
    });
    const raced = await Promise.race([
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: (want) => window.__rickyCollect(want),
        args: [target.needsDetails === true],
      }),
      deadline,
    ]);
    if (raced && raced.timedOut) {
      return { url: target.url, slug: target.slug, jsonld: [], error: '시간 초과 (탭이 닫혔거나 응답 없음)' };
    }

    const res = raced[0];
    const r = res && res.result;
    if (!r) return { url: target.url, slug: target.slug, jsonld: [], error: '읽기 실패' };
    return { url: target.url, slug: target.slug, title: r.title, jsonld: r.jsonld, dom: r.dom, sections: r.sections };
  } catch (e) {
    return { url: target.url, slug: target.slug, jsonld: [], error: String(e).slice(0, 120) };
  } finally {
    try { await chrome.tabs.remove(tab.id); } catch (e) {}
  }
}

// ── 회차 ────────────────────────────────────────────────────────
let running = false;
/*
 * 정지 요청. 회차 중간에 켜지면 **다음 상품부터** 열지 않는다.
 * 열려 있는 탭을 중간에 끊지는 않는다 — 그 페이지는 이미 열었으므로,
 * 읽던 것을 버리면 남의 사이트만 두드리고 얻는 게 없다.
 */
let cancelled = false;

async function runOnce(reason) {
  if (running) { log('이미 도는 중'); return; }
  running = true;
  cancelled = false;
  const startedAt = new Date().toISOString();
  await setState({ running: true, startedAt, reason, done: 0, total: TARGETS.length });

  const out = [];
  const skipped = { robots: 0, unknown: 0 };
  let done = 0;

  try {
    for (const t of TARGETS.slice(0, MAX_PER_RUN)) {
      if (cancelled) { log('정지 요청 — 여기까지'); break; }
      const allowed = await robotsAllows(t.url);
      if (allowed === null) { skipped.unknown += 1; continue; }
      if (allowed === false) { skipped.robots += 1; continue; }

      out.push(await readOne(t));
      done += 1;
      await setState({ done });
      if (cancelled) break;
      await sleep(GAP_MS);
    }

    /*
     * 멈췄어도 받은 것은 저장한다. 수집을 해놓고 결과를 잃는 것이 가장 나쁘다 —
     * 다음 회차에 어차피 다시 열 것이므로 버릴 이유가 없다.
     */
    if (out.length > 0) {
      const payload = {
        v: CAPTURE_VERSION,
        /*
         * catalogFp 는 싣지 않는다. 그건 '북마클릿에 심긴 상품 목록' 을 보는 값이고
         * CLI 는 전 브랜드로 계산하는데 확장은 막힌 브랜드만 담아 **영영 안 맞는다** —
         * 실측: 확장이 수집할 때마다 "북마클릿이 낡았다" 가 떴다. 확장의 검사는 targetsFp 다.
         */
        targetsFp: TARGETS_FP,
        source: 'extension',
        url: 'chrome-extension://ricky',
        title: 'RICKY 확장 수집',
        capturedAt: new Date().toISOString(),
        jsonld: [],
        batch: out,
      };
      await save(payload);
    }

    await setState({
      running: false,
      finishedAt: new Date().toISOString(),
      collected: out.length,
      skippedRobots: skipped.robots,
      skippedUnknown: skipped.unknown,
      stopped: cancelled,
      lastError: null,
    });
    log(cancelled ? '정지' : '완료', out.length, '건 · robots 제외', skipped.robots, '· robots 못읽음', skipped.unknown);
  } catch (e) {
    await setState({ running: false, lastError: String(e).slice(0, 200) });
    log('실패', e);
  } finally {
    running = false;
  }
}

// ── 저장 ────────────────────────────────────────────────────────
/*
 * 서비스 워커에는 URL.createObjectURL 이 없어 data: URL 로 내려받는다.
 * 그런데 이 경로는 크롬 버전·정책에 따라 막힐 수 있고, **막히면 조용히 아무것도
 * 남지 않는다** — 수집을 다 해놓고 결과를 잃는 것이 가장 나쁘다.
 *
 * 그래서 항상 storage 에 먼저 담아 두고, 내려받기가 실패하면 팝업이 저장 버튼을
 * 띄운다(팝업에는 DOM 이 있어 blob 을 만들 수 있다).
 */
async function save(payload) {
  const filename = 'ricky-stock-' + Date.now() + '.json';
  const json = JSON.stringify(payload);
  await chrome.storage.local.set({ pending: { filename, json } });

  try {
    await chrome.downloads.download({
      url: 'data:application/json;charset=utf-8,' + encodeURIComponent(json),
      filename,
      saveAs: false,
    });
    await chrome.storage.local.remove('pending');
    await setState({ pendingSave: false });
  } catch (e) {
    log('내려받기 실패 — 팝업에서 저장할 수 있게 남긴다', e);
    await setState({ pendingSave: true });
  }
}

// ── 타이머 ──────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  const { hours } = await chrome.storage.local.get('hours');
  await schedule(hours || DEFAULT_HOURS);
});
chrome.runtime.onStartup.addListener(async () => {
  const { hours } = await chrome.storage.local.get('hours');
  await schedule(hours || DEFAULT_HOURS);
});

async function schedule(hours) {
  await chrome.storage.local.set({ hours });
  await chrome.alarms.clear(ALARM);
  chrome.alarms.create(ALARM, { periodInMinutes: hours * 60 });
  await setState({ hours });
  log('주기', hours, '시간');
}

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) runOnce('타이머');
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === 'run') { runOnce('수동'); reply({ ok: true }); }
  else if (msg.type === 'stop') {
    /*
     * 돌고 있으면 다음 상품부터 멈춘다. 돌지 않는데 저장된 상태만 "도는 중"이면
     * 죽은 회차이므로 **여기서 풀어 준다** — 그러지 않으면 정지 버튼이 유일한
     * 탈출구인데 아무 일도 하지 않는 상태가 된다.
     */
    if (running) { cancelled = true; log('정지 요청'); reply({ ok: true }); }
    else {
      setState({ running: false, stopped: true }).then(() => reply({ ok: true, recovered: true }));
      return true;
    }
  }
  else if (msg.type === 'schedule') { schedule(msg.hours).then(() => reply({ ok: true })); return true; }
  else if (msg.type === 'state') {
    /*
     * 저장된 상태와 메모리를 맞춘다.
     *
     * MV3 서비스워커는 쉬면 종료된다. 그러면 running 은 초기화되는데 저장된
     * 상태에는 running: true 가 남아 **버튼이 영영 안 풀린다** — 실측:
     * 수집 중 탭을 닫았더니 16/29 에서 멈춘 채 정지도 수집도 안 됐다.
     * 저장된 값이 "도는 중"인데 실제로 도는 게 없으면 그 회차는 죽은 것이다.
     */
    chrome.storage.local.get('state').then(async (s) => {
      const st = s.state || {};
      if (st.running && !running) {
        const dead = { running: false, stopped: true, lastError: '회차가 중단됐다 (탭이 닫혔거나 확장이 재시작됨)' };
        await setState(dead);
        reply({ ...st, ...dead });
        return;
      }
      reply(st);
    });
    return true;
  }
  else if (msg.type === 'pending') {
    chrome.storage.local.get('pending').then((s) => reply(s.pending || null));
    return true;
  }
  else if (msg.type === 'saved') {
    chrome.storage.local.remove('pending').then(() => setState({ pendingSave: false })).then(() => reply({ ok: true }));
    return true;
  }
});
`;
