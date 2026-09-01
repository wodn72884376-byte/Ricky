/**
 * 아크테릭스 PDP의 `Product details` 를 구조화해 가져온다.
 *
 * 재고(`src/stock/`)가 **variant 단위로 자주** 보는 값이라면, 여기는 **상품 단위로 드물게**
 * 보는 값이다 — 설명·소재·취급주의·원산지·무게. 바뀌는 주기가 달라 파이프라인을 나눈다.
 *
 * ## 왜 브라우저가 필요한가
 * arcteryx.com 은 Kasada 로 보호돼 일반 HTTP 요청에 429 + JS 챌린지를 준다.
 * 차단 회피가 아니라 **공개 페이지를 브라우저와 같은 조건으로 읽기 위해** 크로미움을 쓴다.
 * 로그인·결제 영역은 어떤 경우에도 건드리지 않는다 (CLAUDE.md 규칙 8).
 *
 * ## DOM 규칙
 * `Features & Specs` 아래는 `<p>` 두 종류가 번갈아 나온다 — 그룹 라벨과 값이다.
 * 클래스명이 빌드마다 바뀌는 해시(`body_body3__eufrn4d`)라 그대로 박아 두면 다음 배포에
 * 조용히 깨진다. 그래서 **섹션의 첫 `<p>` 클래스를 라벨 클래스로 삼아 자기 보정**한다 —
 * 첫 항목은 언제나 그룹 라벨(`Technical features`)이기 때문이다.
 *
 * 비교는 **첫 클래스 토큰만** 본다. 같은 라벨인데 정렬용 클래스가 하나 더 붙는 경우가 있어
 * 전체 문자열로 맞추면 꼬리(`Size`·`Weight`·`Model`)를 앞 그룹이 삼킨다.
 *
 * ## 여기서 값을 만들어 내지 않는다
 * 못 찾은 항목은 null 로 둔다. 특히 `originOfManufacture` 는 관세(CKFTA)를 가르는 값이라
 * 추정해서 채우면 세액이 통째로 틀린다 (CLAUDE.md 규칙 5).
 */
import type { Page } from 'playwright';

export type DetailGroup = { label: string; values: string[] };

export type ArcteryxDetails = {
  url: string;
  /** 상품 설명 본문 */
  description: string | null;
  /** `Product tip:` 로 시작하는 보조 문단. 없을 수 있다 */
  productTip: string | null;
  /** Features & Specs 의 그룹들 (Technical features · Construction · …) */
  groups: DetailGroup[];
  /** Fit & Sizing 의 핏 이름과 설명 */
  fit: { label: string | null; text: string | null } | null;
  materials: string[];
  care: string[];
  /** `Origin of Manufacture: INDONESIA` → 'INDONESIA'. 관세 판정의 근거가 된다 */
  originOfManufacture: string | null;
  /** `375g / 13.2 oz` → 375. 배송비 산정에 쓰인다 */
  weightG: number | null;
  /** `Model` 그룹의 값 — 브랜드 상품코드 (X000010868) */
  model: string | null;
  checkedAt: string;
};

/**
 * 브라우저에서 평가할 DOM 코드. 문자열인 이유는 `extractDetails` 주석 참고.
 *
 * 하는 일은 셋뿐이다 — 제목으로 섹션 찾기, 그 안의 잎 `<p>` 를 [클래스, 텍스트] 로 모으기,
 * 설명 문단 모으기. 라벨/값 구분은 타입이 있는 바깥 코드에서 한다.
 */
const DOM_SCRIPT = `(() => {
  const text = (e) => ((e && e.textContent) || '').replace(/\\s+/g, ' ').trim();

  const sectionOf = (title) => {
    const heads = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5'));
    const head = heads.find((e) => text(e) === title);
    if (!head) return null;
    let box = head;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      box = box.parentElement;
      if ((box.textContent || '').trim().length > title.length + 120) break;
    }
    return box;
  };

  const paras = (box) => !box ? [] : Array.from(box.querySelectorAll('p'))
    .filter((e) => e.children.length === 0 && text(e))
    .map((e) => [String(e.className).split(' ')[0] || '', text(e)]);

  const descBox = sectionOf('Description');
  const fitBox = sectionOf('Fit & Sizing');

  return {
    description: descBox ? Array.from(descBox.querySelectorAll('p')).map(text).filter(Boolean) : [],
    specs: paras(sectionOf('Features & Specs')),
    materialsCare: paras(sectionOf('Materials & Care')),
    fit: fitBox ? Array.from(fitBox.querySelectorAll('p,h3,h4')).map(text).filter(Boolean) : [],
  };
})()`;

/**
 * 페이지가 다 그려질 때까지. 아래 섹션은 스크롤해야 붙는다.
 *
 * 스크롤도 **문자열로 넘긴다** — DOM_SCRIPT 와 같은 이유이고, 덤으로 이 워크스페이스의
 * tsconfig 에 DOM 라이브러리가 없어(`lib: ["ES2023"]`) 화살표 함수로 쓰면
 * `window`·`document` 를 찾지 못해 타입 검사가 깨진다.
 */
async function settle(page: Page) {
  await page.waitForTimeout(5000);
  await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
  await page.waitForTimeout(2500);
}

/**
 * 열린 페이지에서 상세를 읽는다. 페이지 이동은 호출한 쪽이 한다 —
 * 그래야 정중함(지연·동시성·백오프)을 한 곳에서 관리할 수 있다.
 */
export async function extractDetails(page: Page, url: string): Promise<ArcteryxDetails> {
  await settle(page);

  /*
    DOM 코드는 **문자열로 넘긴다.** 함수로 넘기면 tsx(esbuild)가 트랜스파일하면서
    `__name` 헬퍼를 주입하는데, 그 헬퍼는 브라우저 쪽에 없어 `ReferenceError`가 난다.
    문자열은 그대로 평가되므로 이 문제를 지나간다.
  */
  const raw = (await page.evaluate(DOM_SCRIPT)) as {
    description: string[];
    specs: [string, string][];
    materialsCare: [string, string][];
    fit: string[];
  };

  // ── Description ────────────────────────────────────────────────
  const tipIndex = raw.description.findIndex((p) => /^Product tip:/i.test(p));
  const description = (tipIndex === -1 ? raw.description : raw.description.slice(0, tipIndex))
    .filter((p) => p !== 'Description')
    .join('\n\n') || null;
  const productTip = tipIndex === -1 ? null : raw.description[tipIndex]!.replace(/^Product tip:\s*/i, '');

  // ── Features & Specs ───────────────────────────────────────────
  // 첫 항목이 그룹 라벨이다. 그 클래스를 기준으로 나머지를 가른다.
  const labelClass = raw.specs[0]?.[0] ?? null;
  const groups: DetailGroup[] = [];
  for (const [cls, value] of raw.specs) {
    if (labelClass !== null && cls === labelClass) groups.push({ label: value, values: [] });
    else if (groups.length > 0) groups.at(-1)!.values.push(value);
  }

  // ── Materials & Care ───────────────────────────────────────────
  // 같은 방식으로 `Materials` / `Care` 두 그룹으로 갈린다.
  const mcLabelClass = raw.materialsCare[0]?.[0] ?? null;
  const mc: DetailGroup[] = [];
  for (const [cls, value] of raw.materialsCare) {
    if (mcLabelClass !== null && cls === mcLabelClass) mc.push({ label: value, values: [] });
    else if (mc.length > 0) mc.at(-1)!.values.push(value);
  }
  const materials = mc.find((g) => /^Materials$/i.test(g.label))?.values ?? [];
  const care = mc.find((g) => /^Care$/i.test(g.label))?.values ?? [];

  // ── 개별 값 ────────────────────────────────────────────────────
  const groupValue = (label: string) =>
    groups.find((g) => g.label.toLowerCase() === label.toLowerCase())?.values[0] ?? null;

  const originLine = materials.find((m) => /^Origin of Manufacture:/i.test(m));
  const originOfManufacture = originLine
    ? originLine.replace(/^Origin of Manufacture:\s*/i, '').trim() || null
    : null;

  // `375g / 13.2 oz` — 그램만 쓴다. oz 는 같은 값의 다른 표기다.
  const weightRaw = groupValue('Weight');
  const weightMatch = weightRaw?.match(/([\d.]+)\s*g\b/i);
  const weightG = weightMatch ? Math.round(Number(weightMatch[1])) : null;

  const fitLabel = raw.fit.find((t) => /^Fit:/i.test(t))?.replace(/^Fit:\s*/i, '') ?? null;
  const fitText = raw.fit.find((t) => t.length > 60 && !/^Fit:/i.test(t)) ?? null;

  return {
    url,
    description,
    productTip,
    groups,
    fit: fitLabel || fitText ? { label: fitLabel, text: fitText } : null,
    materials,
    care,
    originOfManufacture,
    weightG,
    model: groupValue('Model'),
    checkedAt: new Date().toISOString(),
  };
}
