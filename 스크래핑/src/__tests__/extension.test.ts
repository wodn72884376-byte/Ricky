import { describe, expect, it } from 'vitest';
import { BACKGROUND_SOURCE } from '../extension/background.ts';
import { COLLECTOR_TAIL } from '../extension/collector.ts';
import { collectorSource } from '../stock/bookmarklet.ts';
import { manifest } from '../extension/manifest.ts';
import { POPUP_JS } from '../extension/popup.ts';
import { splitByAutomation } from '../extension/build.ts';
import { targetsFingerprint } from '../stock/bookmarklet.ts';
import { BRANDS } from '../config/brands.ts';

/** 배경 스크립트에 심긴 함수를 그대로 꺼내 돌린다 — 사본을 만들면 시험한 게 아니다. */
function extract<T>(name: string): T {
  const src = BACKGROUND_SOURCE;
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`${name} 을 찾지 못했다`);
  // 함수 하나를 통째로 잘라 낸다 (다음 최상위 선언 직전까지)
  const after = src.slice(start);
  const end = after.search(/\n(?:function |const |async function |\/\/ ──)/);
  const body = end === -1 ? after : after.slice(0, end);
  return new Function(`${body}; return ${name};`)() as T;
}

describe('robots.txt 파싱 — 무엇을 열어도 되는지 정하는 자리', () => {
  const parseRobots = extract<(t: string) => { allow: boolean; path: string }[]>('parseRobots');
  const pathMatches = extract<(p: string, path: string) => boolean>('pathMatches');

  it('User-agent: * 그룹만 읽는다', () => {
    const rules = parseRobots(
      ['User-agent: Googlebot', 'Disallow: /only-google', 'User-agent: *', 'Disallow: /search'].join('\n'),
    );
    expect(rules).toEqual([{ allow: false, path: '/search' }]);
  });

  it('Allow 와 Disallow 를 구분해 담는다', () => {
    const rules = parseRobots(['User-agent: *', 'Disallow: /p/', 'Allow: /p/public'].join('\n'));
    expect(rules).toEqual([
      { allow: false, path: '/p/' },
      { allow: true, path: '/p/public' },
    ]);
  });

  it('주석과 빈 줄을 무시한다', () => {
    expect(parseRobots(['# 주석', '', 'User-agent: *', 'Disallow: /x # 꼬리주석'].join('\n'))).toEqual([
      { allow: false, path: '/x' },
    ]);
  });

  it('빈 Disallow 는 규칙이 아니다 — 전체 허용을 뜻한다', () => {
    expect(parseRobots(['User-agent: *', 'Disallow:'].join('\n'))).toEqual([]);
  });

  it('* 와 $ 를 robots 규칙대로 해석한다', () => {
    expect(pathMatches('/*/search', '/en/search')).toBe(true);
    expect(pathMatches('/a$', '/a')).toBe(true);
    expect(pathMatches('/a$', '/ab')).toBe(false);
  });

  it('정규식 특수문자가 든 경로를 문자 그대로 맞춘다', () => {
    // `/p/equipment/...` 처럼 점·괄호가 든 실제 경로에서 오작동하면 안 된다
    expect(pathMatches('/a.b', '/a.b')).toBe(true);
    expect(pathMatches('/a.b', '/axb')).toBe(false);
  });

  it('실제 룰루레몬 상품 경로를 막지 않는다', () => {
    const rules = parseRobots(['User-agent: *', 'Disallow: /*/cart', 'Disallow: /*/checkout'].join('\n'));
    const path = '/en-ca/p/equipment/Mens-Fast-and-Free-Trail-Running-Vest/_/prod11890040';
    expect(rules.some((r) => pathMatches(r.path, path))).toBe(false);
  });
});

describe('확장 산출물', () => {
  it('추출 규칙은 북마클릿과 같은 소스에서 온다', () => {
    /*
     * 두 벌로 두면 결과가 조용히 갈리고 사고 났을 때 한쪽만 고치게 된다.
     * 이 프로젝트에서 잡은 사고는 전부 추출 규칙에 있었다.
     */
    const js = `${collectorSource()}\n${COLLECTOR_TAIL}`;
    expect(js).toContain('function readDoc(');
    expect(js).toContain('function readColours(');
    expect(js).toContain('window.__rickyCollect');
  });

  it('생성된 collector 가 실행 가능한 JS 다', () => {
    expect(() => new Function(`${collectorSource()}\n${COLLECTOR_TAIL}`)).not.toThrow();
  });

  it('배경 스크립트가 실행 가능한 JS 다', () => {
    const js = ['const TARGETS=[];', 'const CAPTURE_VERSION=2;', 'const CATALOG_FP="x";', BACKGROUND_SOURCE].join('\n');
    expect(() => new Function(js)).not.toThrow();
  });

  it('호스트 권한은 준 것만 적는다 — <all_urls> 를 요구하지 않는다', () => {
    const m = JSON.parse(manifest({ hosts: ['https://arcteryx.com/*'], version: '1.0.0.0' }));
    expect(m.host_permissions).toEqual(['https://arcteryx.com/*']);
    expect(JSON.stringify(m)).not.toContain('<all_urls>');
  });

  it('로그인·결제에 필요한 권한을 요구하지 않는다', () => {
    const m = JSON.parse(manifest({ hosts: [], version: '1.0.0.0' }));
    for (const forbidden of ['cookies', 'webRequest', 'history', 'browsingData']) {
      expect(m.permissions).not.toContain(forbidden);
    }
  });
});

describe('splitByAutomation', () => {
  /*
   * 확장은 사용자의 진짜 브라우저로 남의 사이트를 연다. 서버에서 이미 받아지는
   * 아크테릭스·코치를 또 여는 건 같은 페이지를 두 번 긁는 것일 뿐이다.
   */
  const all = [
    { brand: 'arcteryx' as const },
    { brand: 'coach' as const },
    { brand: 'polo' as const },
    { brand: 'lululemon' as const },
    { brand: 'canadagoose' as const },
  ];

  it('서버에서 받아지는 브랜드는 확장에 넣지 않는다', () => {
    const { kept } = splitByAutomation(all, false);
    expect(kept.map((t) => t.brand)).toEqual(['polo', 'lululemon', 'canadagoose']);
  });

  it('뺀 브랜드를 이름으로 알려 준다 — 조용히 사라지면 안 된다', () => {
    const { skipped } = splitByAutomation(all, false);
    expect(skipped).toEqual([BRANDS.arcteryx.labelKo, BRANDS.coach.labelKo].sort());
  });

  it('--all-brands 는 전부 넣는다', () => {
    const { kept, skipped } = splitByAutomation(all, true);
    expect(kept).toHaveLength(all.length);
    expect(skipped).toEqual([]);
  });

  it('막힌 브랜드는 automation 표시가 있어야 한다 — 없으면 확장에서 빠진다', () => {
    for (const key of ['polo', 'lululemon', 'canadagoose', 'tumi'] as const) {
      expect(BRANDS[key].ca.automation).toBe('bookmarklet');
    }
  });
});

describe('확장이 낡았는지 — 대상 목록 지문', () => {
  /*
   * 실측 사고: 캐나다구스 URL 을 카탈로그에 채워 확장 대상이 15 → 29페이지가 됐는데,
   * 등록 상품 목록은 그대로라 카탈로그 지문이 변하지 않았다. 크롬에 옛 확장이 얹힌
   * 채로 캐나다구스 8건이 통째로 빠졌고 아무 경고도 뜨지 않았다.
   */
  it('대상이 늘면 지문이 달라진다 — 카탈로그 지문만으로는 못 잡는다', () => {
    const before = ['https://a.com/1', 'https://a.com/2'];
    const after = [...before, 'https://www.canadagoose.com/ca/en/pr/langford-parka-2052M.html'];
    expect(targetsFingerprint(after)).not.toBe(targetsFingerprint(before));
  });

  it('순서가 달라도 같은 목록이면 같은 지문 — 빌드 순서로 늑대소년이 되지 않는다', () => {
    expect(targetsFingerprint(['https://a/1', 'https://a/2'])).toBe(
      targetsFingerprint(['https://a/2', 'https://a/1']),
    );
  });

  it('확장이 지문을 캡처에 싣는다', () => {
    expect(BACKGROUND_SOURCE).toContain('targetsFp: TARGETS_FP');
    expect(BACKGROUND_SOURCE).toContain("source: 'extension'");
  });
});

describe('robots 를 못 읽을 때', () => {
  /*
   * 실측: 캐나다구스는 서비스워커 fetch 에 429 + Kasada 챌린지를 준다.
   * 그래서 대상 14건이 전부 '모름'으로 건너뛰어졌는데, 팝업은 그것을
   * "robots 로 제외" 한 줄로 보여 줘 막힌 것처럼 읽혔다.
   */
  it('fetch 가 실패하면 탭으로 한 번 더 읽는다', () => {
    expect(BACKGROUND_SOURCE).toContain('robotsViaTab');
    expect(BACKGROUND_SOURCE).toContain("'/robots.txt'");
  });

  it('robots 처럼 생겼을 때만 믿는다 — 챌린지 페이지도 200 으로 온다', () => {
    expect(BACKGROUND_SOURCE).toMatch(/user-agent\|sitemap\|allow\|disallow/i);
  });

  it('읽은 뒤에도 모르면 건너뛴다 — 모르는 채로 열지 않는다', () => {
    expect(BACKGROUND_SOURCE).toContain('text === null ? null : parseRobots(text)');
  });

  it('팝업이 막힌 것과 못 읽은 것을 나눠 센다 — 고치는 방법이 정반대다', () => {
    expect(POPUP_JS).toContain("$('blocked')");
    expect(POPUP_JS).toContain("$('unknown')");
    expect(POPUP_JS).not.toContain('skippedRobots || 0) + (s.skippedUnknown');
  });
});

describe('확장 캡처는 북마클릿 경고를 울리지 않는다', () => {
  /*
   * 실측: 확장이 수집할 때마다 "북마클릿이 낡았다" 가 떴다. 확장은 막힌 브랜드만
   * 담는데 CLI 는 전 브랜드로 카탈로그 지문을 계산하니 **영영 안 맞는다.**
   * 늘 뜨는 경고는 아무도 안 읽는다.
   */
  it('확장은 catalogFp 를 싣지 않는다', () => {
    expect(BACKGROUND_SOURCE).not.toContain('catalogFp:');
  });

  it('확장이 보는 값은 대상 목록 지문이다', () => {
    expect(BACKGROUND_SOURCE).toContain('targetsFp: TARGETS_FP');
  });
});

describe('고시 항목은 한 번만 걷는다', () => {
  /*
   * 재고는 6시간마다 바뀌지만 소재·취급주의는 안 바뀐다. 매 회차 구획을 걷으면
   * 캡처 파일만 커지고 같은 값을 다시 읽는다.
   */
  it('필요한 대상에만 플래그를 켠다', () => {
    const all = [
      { brand: 'polo' as const, slug: 'a', needsDetails: true as const },
      { brand: 'polo' as const, slug: 'b' },
    ];
    expect(all.filter((t) => t.needsDetails)).toHaveLength(1);
  });

  it('확장이 그 플래그를 수집기에 넘긴다', () => {
    expect(BACKGROUND_SOURCE).toContain('window.__rickyCollect(want)');
    expect(BACKGROUND_SOURCE).toContain('args: [target.needsDetails === true]');
  });

  it('플래그가 꺼져 있으면 구획을 걷지 않는다', () => {
    expect(COLLECTOR_TAIL).toContain('want && typeof readSections');
  });

  it('수집기는 해석하지 않는다 — 제목·본문을 원문 그대로 담는다', () => {
    expect(collectorSource()).toContain('function readSections(doc)');
    // 무엇이 소재이고 취급주의인지는 서버가 정한다
    expect(collectorSource()).not.toMatch(/material\s*[:=]/i);
  });
});

describe('정지', () => {
  it('돌지 않을 때 누르면 아무 일도 하지 않는다 — 다음 회차를 미리 죽이지 않는다', () => {
    expect(BACKGROUND_SOURCE).toContain("if (running) { cancelled = true;");
  });

  it('회차를 시작할 때 정지 요청을 지운다', () => {
    const run = BACKGROUND_SOURCE.slice(BACKGROUND_SOURCE.indexOf('async function runOnce'));
    expect(run.slice(0, 300)).toContain('cancelled = false');
  });

  /*
   * 멈춰도 받은 것은 저장한다. 수집을 해놓고 결과를 잃는 것이 가장 나쁘다.
   */
  it('멈춰도 그때까지 받은 것을 저장한다', () => {
    const run = BACKGROUND_SOURCE.slice(BACKGROUND_SOURCE.indexOf('async function runOnce'));
    const brk = run.indexOf("if (cancelled) { log('정지 요청");
    const save = run.indexOf('await save(payload)');
    expect(brk).toBeGreaterThan(0);
    expect(save).toBeGreaterThan(brk);
  });

  it('열어 둔 탭은 끝까지 읽는다 — 중간에 끊으면 헛되이 두드린 셈이다', () => {
    const run = BACKGROUND_SOURCE.slice(BACKGROUND_SOURCE.indexOf('async function runOnce'));
    const read = run.indexOf('out.push(await readOne(t))');
    const check = run.indexOf('if (cancelled) break;');
    expect(check).toBeGreaterThan(read);
  });

  it('멈춘 회차를 완료라고 적지 않는다', () => {
    expect(POPUP_JS).toContain("s.stopped ? '정지됨'");
  });

  it('정지 버튼은 도는 중에만 보인다', () => {
    expect(POPUP_JS).toContain("$('stop').hidden = !s.running");
  });
});

describe('회차가 붙잡히지 않게', () => {
  /*
   * 실측: 수집 중인 탭을 사람이 닫았더니 16/29 에서 회차가 통째로 멈췄다.
   * 정지도 안 먹고 '지금 수집' 도 안 풀렸다 — 나가는 문이 없었다.
   *
   * 원인이 둘이다.
   *   1) 닫힌 탭에서 색상 순회 promise 가 결말나지 않는다
   *   2) MV3 서비스워커가 종료되면 메모리의 running 은 사라지는데
   *      저장된 상태에는 running: true 가 남는다
   */
  it('한 상품에 시한을 건다 — 회차 전체를 볼모로 잡지 못하게', () => {
    expect(BACKGROUND_SOURCE).toContain('READ_TIMEOUT_MS');
    expect(BACKGROUND_SOURCE).toContain('Promise.race');
  });

  it('시한은 색상 순회 상한보다 넉넉해야 한다 — 정상 수집을 자르면 안 된다', () => {
    const cap = /READ_TIMEOUT_MS = (\d+)/.exec(BACKGROUND_SOURCE);
    expect(Number(cap![1])).toBeGreaterThan(45_000);
  });

  it('시간이 지나도 그 상품만 실패로 남기고 넘어간다', () => {
    expect(BACKGROUND_SOURCE).toContain('시간 초과');
  });

  it('저장된 상태가 도는 중인데 실제로 안 돌면 죽은 회차로 푼다', () => {
    expect(BACKGROUND_SOURCE).toContain('if (st.running && !running)');
  });

  it('정지는 죽은 회차도 푼다 — 유일한 탈출구가 아무 일도 안 하면 안 된다', () => {
    const stop = BACKGROUND_SOURCE.slice(BACKGROUND_SOURCE.indexOf("msg.type === 'stop'"));
    expect(stop.slice(0, 600)).toContain('recovered: true');
  });
});
