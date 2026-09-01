/**
 * 코치 `Details.txt` → 상품 상세에 띄울 스펙.
 *
 * 원문 구조는 정형적이다. 빈 줄로 나뉜 블록이고 각 블록의 첫 줄이 제목이다.
 *
 *   Product Details / Style Number / CDZ42 //  Measurements / Length: 11.5" … //
 *   Materials / Woven leather //  Handle / Handle with 10.5" drop //
 *   Features / Magnetic snap closure //  288CAD
 *
 * ## 색상마다 다르다
 * 코치는 한 상품 폴더에 스타일이 다른 제품을 묶어 둔다 — Brooklyn 28만 해도
 * `Brass,Maple`(11.5×8.75×2.75)과 `natural grain leather,Brass,Black`(11.0×11.0)이
 * 치수가 다르다. 그래서 스펙은 상품이 아니라 **색상(variant)에 붙인다.**
 *
 * ## 번역은 표로만 한다
 * 문장을 만들어 내지 않는다. 표에 없는 문구는 **원문 그대로 두고 경고를 남긴다** —
 * 그래야 새 문구가 들어왔을 때 조용히 영어로 나가는 대신 눈에 띈다.
 * 인치는 cm를 함께 적는다(기계적 환산이라 지어내는 것이 아니다).
 */

/** 무시할 블록 제목. 값이 따로 쓰이거나(스타일 번호) 껍데기다. */
const SKIP = new Set(['Product Details', 'Style Number']);

/** 블록 제목 → 한국어. 없는 제목이 오면 경고하고 건너뛴다. */
const SECTION_KO = {
  Measurements: '치수',
  Materials: '소재',
  Handle: '손잡이',
  Strap: '스트랩',
  Features: '특징',
  'Additional Details': '그 외',
};

/** 치수 축. 코치는 Length를 가로로, Width를 두께로 쓴다. */
const AXIS_KO = { Length: '가로', Height: '세로', Width: '폭' };

/** 손잡이·스트랩 문구의 앞부분. `with N" drop` 앞에 오는 말이다. */
const CARRY_KO = {
  Handle: '손잡이',
  Handles: '손잡이',
  'Detachable handle': '분리형 손잡이',
  'Detachable chain handle': '분리형 체인 손잡이',
  Strap: '스트랩',
  'Shoulder strap': '숄더 스트랩',
  'Adjustable strap': '조절형 스트랩',
  'Detachable strap': '분리형 스트랩',
  'Detachable chain strap': '분리형 체인 스트랩',
  'Detachable long strap': '분리형 롱 스트랩',
  'Detachable short strap': '분리형 숏 스트랩',
};

/** 손잡이·스트랩 문구의 뒷부분. */
const CARRY_SUFFIX_KO = {
  'for shoulder or crossbody wear': '숄더·크로스보디 겸용',
  '20" drop with extender': '익스텐더 사용 시 드롭 50.8cm',
};

/** 소재·특징 같은 단문. 표에 없으면 원문을 남긴다. */
const PHRASE_KO = {
  // 소재
  'Woven leather': '우븐 레더',
  'Polished pebble leather': '폴리시드 페블 레더',
  'Pebbled leather': '페블 레더',
  'Natural grain leather': '내추럴 그레인 레더',
  'Smooth leather': '스무스 레더',
  'Shiny smooth leather': '샤이니 스무스 레더',
  'Nappa leather': '나파 레더',
  'Crinkle leather': '크링클 레더',
  'Signature canvas': '시그니처 캔버스',
  Suede: '스웨이드',
  Straw: '스트로',
  'Fabric lining': '패브릭 안감',
  'Recycled polyester lining': '리사이클 폴리에스터 안감',
  'Cotton lining': '코튼 안감',
  'Suede lining': '스웨이드 안감',
  'Refined pebble leather': '리파인드 페블 레더',
  'Soft pebble leather': '소프트 페블 레더',
  'Smooth grain leather': '스무스 그레인 레더',
  'Soft refined calf leather': '소프트 리파인드 카프 레더',
  'Signature coated canvas': '시그니처 코티드 캔버스',
  'Signature coated canvas and smooth leather': '시그니처 코티드 캔버스 · 스무스 레더',
  'Suede and grain leather': '스웨이드 · 그레인 레더',
  'Suede and smooth leather': '스웨이드 · 스무스 레더',
  'Suede and natural grain nappa leather': '스웨이드 · 내추럴 그레인 나파 레더',
  'Straw and refined calf leather': '스트로 · 리파인드 카프 레더',
  // 특징
  'Zip closure': '지퍼 여밈',
  'Zip-top closure': '상단 지퍼 여밈',
  'Magnetic snap closure': '마그네틱 스냅 여밈',
  'Drawstring and magnetic snap closures': '드로스트링 · 마그네틱 스냅 여밈',
  'Pushlock closure': '푸시락 여밈',
  'Inside slip pocket': '내부 슬립 포켓',
  'Inside open pocket': '내부 오픈 포켓',
  'Inside zip pocket': '내부 지퍼 포켓',
  'Inside snap pocket': '내부 스냅 포켓',
  'Inside multifunction pocket': '내부 멀티 포켓',
  'Inside zip and multifunction pockets': '내부 지퍼 · 멀티 포켓',
  'Outside zip pockets': '외부 지퍼 포켓',
  'Center zip compartment': '가운데 지퍼 수납칸',
  'Two credit card slots': '카드 슬롯 2개',
  'Fits an 8" tablet': '8인치(20.3cm) 태블릿 수납',
  'Fits a 13" tablet': '13인치(33cm) 태블릿 수납',
  // 그 외
  'Coach (Re)Loved': '코치 (Re)Loved',
};

/** 인치 → cm. 소수 한 자리. */
export const inchToCm = (inch) => Math.round(inch * 2.54 * 10) / 10;

/** `Fits a 13" tablet` 처럼 문장 안에 인치가 있으면 cm를 덧붙인다. */
function withCm(text) {
  return text.replace(/([\d.]+)"/g, (_, n) => `${n}인치(${inchToCm(Number(n))}cm)`);
}

/**
 * 원문을 블록으로 나눈다. 각 블록 = [제목, ...값]. 가격 줄(`288CAD`)은 버린다.
 */
function blocks(text) {
  return text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0 && !/^[\d.]+CAD$/i.test(lines[0]));
}

/** `Handle with 10.5" drop` → `손잡이 · 드롭 26.7cm` */
function carryKo(value, warn) {
  const m = value.match(/^(.+?)\s+with\s+([\d.]+)"\s+drop(.*)$/i);
  if (!m) return null;

  const [, headRaw, inch, tailRaw] = m;
  const head = CARRY_KO[headRaw.trim()];
  if (!head) {
    warn(`손잡이·스트랩 표기 미등록: "${headRaw.trim()}"`);
    return null;
  }

  const parts = [`${head} · 드롭 ${inchToCm(Number(inch))}cm`];
  const tail = tailRaw.replace(/^[;,\s]+/, '').trim();
  if (tail) {
    const known = CARRY_SUFFIX_KO[tail];
    if (known) parts.push(known);
    else {
      warn(`손잡이·스트랩 부가 표기 미등록: "${tail}"`);
      parts.push(withCm(tail));
    }
  }
  return parts.join(' · ');
}

/**
 * `Details.txt` → `[{ label, values }]`. 표에 없는 문구는 원문을 남기고 `warn`으로 알린다.
 */
export function coachSpecs(detailsText, warn = () => {}) {
  if (!detailsText) return [];
  const out = [];

  for (const [heading, ...values] of blocks(detailsText)) {
    if (SKIP.has(heading)) continue;

    const label = SECTION_KO[heading];
    if (!label) {
      warn(`섹션 미등록: "${heading}"`);
      continue;
    }

    if (heading === 'Measurements') {
      const dims = values
        .map((v) => v.match(/^(Length|Height|Width):\s*([\d.]+)"$/i))
        .filter(Boolean)
        .map(([, axis, inch]) => {
          const key = axis[0].toUpperCase() + axis.slice(1).toLowerCase();
          return `${AXIS_KO[key]} ${inchToCm(Number(inch))}cm`;
        });
      if (dims.length > 0) out.push({ label, values: [dims.join(' · ')] });
      continue;
    }

    const ko = values.map((v) => {
      if (heading === 'Handle' || heading === 'Strap') {
        const carried = carryKo(v, warn);
        if (carried) return carried;
      }
      const known = PHRASE_KO[v];
      if (known) return known;
      warn(`문구 미등록: "${v}"`);
      return withCm(v);
    });

    if (ko.length > 0) out.push({ label, values: ko });
  }

  return out;
}
