/**
 * 스크래핑 프로젝트가 모은 아크테릭스 상품 상세를 카탈로그에 실을 모양으로 바꾼다.
 *
 * 원본: `스크래핑/data/제품상세-<태그>.json` (스크래핑/src/details/run.ts 산출물)
 *
 * 여기서 하는 일은 셋이다.
 *   1. 국가명 → 2자리 코드. **표에 없으면 null이다.** 원산지는 관세를 가르는 값이라
 *      추정해서 채우면 세액이 통째로 틀린다 (CLAUDE.md 규칙 5).
 *   2. 한국어로 옮긴다 — 라벨·값·설명·핏·취급 문구까지. 번역은 `arcteryx-ko.mjs` 의
 *      **문장 사전**이 한다. 사전에 없으면 원문을 그대로 두고 경고한다 (지어내지 않는다).
 *   3. 값이 없는 그룹은 버린다. 사이즈·활동처럼 `<p>`가 아닌 형태로 그려지는 항목이다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { koCare, koDescription, koFit, koMaterial, koTip, koValue } from './arcteryx-ko.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA_DIR = join(ROOT, '스크래핑/data');

/**
 * 공식몰이 쓰는 국가명 → ISO 3166-1 alpha-2.
 * 아크테릭스가 실제로 쓰는 것만 넣는다. 새 나라가 나오면 경고하고 null로 둔다.
 */
const COUNTRY = {
  CANADA: 'CA', CHINA: 'CN', VIETNAM: 'VN', INDONESIA: 'ID', BANGLADESH: 'BD',
  CAMBODIA: 'KH', MYANMAR: 'MM', PHILIPPINES: 'PH', 'SRI LANKA': 'LK', INDIA: 'IN',
  THAILAND: 'TH', TURKEY: 'TR', 'EL SALVADOR': 'SV', HONDURAS: 'HN', MEXICO: 'MX',
  ITALY: 'IT', PORTUGAL: 'PT', ROMANIA: 'RO', BULGARIA: 'BG', LAOS: 'LA',
  'UNITED STATES': 'US', TAIWAN: 'TW', KOREA: 'KR', JAPAN: 'JP',
};

/** Features & Specs 그룹 라벨 → 한국어. 없으면 원문을 그대로 쓰고 경고한다. */
const GROUP_KO = {
  'Technical features': '주요 특성',
  Construction: '구조',
  'Design & Fit': '디자인과 핏',
  'Fabric treatment': '원단 처리',
  'Hem configuration': '밑단',
  'Hood configuration': '후드',
  'Collar configuration': '칼라',
  'Cuff configuration': '소매단',
  'Cuff & Sleeves configuration': '소매',
  'Integrated features': '내장 기능',
  'Logos & Label configuration': '로고와 라벨',
  'UPF rating': 'UPF 자외선 차단',
  Patterning: '패턴',
  'Pocket configuration': '포켓',
  'Snowsport features': '스노스포츠 기능',
  'Climbing features': '클라이밍 기능',
  Sustainability: '지속가능성',
  'Zippers & Fly configuration': '지퍼',
  Insulation: '충전재',
  Ventilation: '통풍',
  Weight: '무게',
  Fit: '핏',
  Size: '사이즈',
  Activity: '활동',
  Model: '모델',
  'Sizing chart': '사이즈 가이드',
  'Manufacturing facility': '생산 공장',
  'Care instructions': '취급 시 주의사항',
};

/**
 * 카탈로그에 실을 필요가 없는 그룹.
 * 무게·모델·사이즈는 이미 다른 필드로 들어가 있어 두 번 보여줄 이유가 없다.
 */
const DROP = new Set(['Weight', 'Model', 'Size', 'Sizing chart', 'Fit']);

/**
 * 수집 파일들을 오래된 것부터 겹쳐 읽는다. 같은 상품은 **최근 값이 이긴다.**
 *
 * 예전엔 가장 최근 파일 하나만 읽었다. 그러면 이번 회차에 한 건이 실패했을 때
 * 그 상품의 소재·취급주의·원산지가 통째로 사라진다 — 그리고 고시 항목이 비면
 * 게시가 막히므로, 상품이 조용히 화면에서 내려간다.
 * (실측 2026-09-01: 31건 중 Atom SL Hoody 하나가 렌더 중 이동으로 실패했다.)
 *
 * 파일이 하나도 없으면 빈 객체다 — 상세 없이도 임포트는 돌아야 한다.
 */
export async function loadArcteryxDetails(warn = () => {}) {
  let files;
  try {
    files = (await readdir(DATA_DIR)).filter((f) => f.startsWith('제품상세-') && f.endsWith('.json')).sort();
  } catch {
    return {};
  }
  if (files.length === 0) return {};

  const products = {};
  for (const f of files) {
    const parsed = JSON.parse(await readFile(join(DATA_DIR, f), 'utf8'));
    Object.assign(products, parsed.products ?? {});
  }

  const out = {};

  for (const [slug, d] of Object.entries(products)) {
    const rawCountry = d.originOfManufacture?.trim().toUpperCase() ?? null;
    const originCountry = rawCountry ? (COUNTRY[rawCountry] ?? null) : null;
    if (rawCountry && !originCountry) warn(`아크테릭스 ${slug}: 국가 코드 미등록 "${rawCountry}"`);

    const groups = (d.groups ?? [])
      .filter((g) => g.values.length > 0 && !DROP.has(g.label))
      .map((g) => {
        const label = GROUP_KO[g.label];
        if (!label) warn(`아크테릭스 그룹 라벨 미등록: "${g.label}"`);
        return { label: label ?? g.label, values: g.values.map((v) => koValue(v, warn)) };
      });

    out[slug] = {
      originCountry,
      weightG: d.weightG ?? null,
      description: koDescription(slug, d.description, warn),
      productTip: koTip(d.productTip ?? null, warn),
      fit: koFit(d.fit?.label ? d.fit : null, warn),
      groups,
      // `null` 을 돌려준 줄은 버린다 — 고시 표의 `제조국` 행과 겹치는 원산지 줄이다.
      materials: (d.materials ?? []).map((m) => koMaterial(m, warn)).filter(Boolean),
      care: (d.care ?? []).map((c) => koCare(c, warn)),
      sourceUrl: d.url ?? null,
      checkedAt: d.checkedAt ?? null,
    };
  }

  return out;
}
