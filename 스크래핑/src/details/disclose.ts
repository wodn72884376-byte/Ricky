/**
 * 화면에서 걷어 온 구획(`DocSection`)을 전자상거래 고시 항목으로 옮긴다.
 *
 * 해석은 **서버에서만** 한다. 브라우저 쪽은 제목·본문을 원문 그대로 담아 오고,
 * 무엇이 소재이고 무엇이 취급주의인지는 여기서 정한다 — 규칙을 양쪽에 두면
 * 조용히 갈린다(북마클릿이 해석하지 않는 것과 같은 이유).
 *
 * ## 원산지는 참고값이다
 * 여기서 캐는 원산지는 **브랜드가 자기 페이지에 적어 둔 값**이지 실물 라벨이 아니다.
 * CLAUDE.md 규칙 5 는 원산지를 실물 라벨 기준으로만 입력하라고 하고, 그 이유는
 * CKFTA 관세 판정이 여기에 걸리기 때문이다. 그래서 `origin` 은 따로 담고
 * 확인 여부를 함께 남긴다 — 쓰는 쪽이 알고 쓰게 한다.
 */
import type { DocSection } from '../stock/bookmarklet.ts';

export type Disclosure = {
  material: string | null;
  care: string | null;
  /** 브랜드 페이지가 말한 원산지. 실물 라벨 확인 전이다. */
  origin: string | null;
  originText: string | null;
};

/** 제목이 이 낱말을 담고 있으면 그 구획으로 본다. 한국·영문 표기를 함께 본다. */
const HEADS = {
  material: /^(소재|재질|material|materials|fabric|composition|what'?s it made of)/i,
  care: /^(취급|세탁|관리|care|care\s*(and|&)\s*cleaning|cleaning|garment care|product care)/i,
} as const;

/** `Made in Vietnam` · `Imported from Canada` · `원산지: 베트남` */
const ORIGIN_RE =
  /(?:made\s+in|manufactured\s+in|country\s+of\s+origin\s*:?|원산지\s*:?)\s*([A-Za-z가-힣][A-Za-z가-힣 .'-]{1,28})/i;

/** 나라 이름 뒤에 붙어 오는 군더더기를 자른다. */
const TIDY = /\s*(?:\.|,|;|\||and\b|with\b|using\b).*$/i;

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * 제목이 없거나 애매한 구획도 본문에 `Made in …` 이 있으면 원산지를 준다.
 * 원산지는 대개 소재 문단 끝에 한 줄로 붙어 있다.
 */
export function readDisclosure(sections: DocSection[]): Disclosure {
  let material: string | null = null;
  let care: string | null = null;
  let originText: string | null = null;

  for (const s of sections) {
    const head = clean(s.h);
    const body = clean(s.t);
    if (!body) continue;

    if (!material && HEADS.material.test(head)) material = body;
    if (!care && HEADS.care.test(head)) care = body;

    if (!originText) {
      const m = ORIGIN_RE.exec(`${head} ${body}`);
      if (m?.[1]) originText = clean(m[0]);
    }
  }

  const country = originText ? clean(ORIGIN_RE.exec(originText)?.[1] ?? '').replace(TIDY, '') : null;

  return {
    material,
    care,
    origin: country && country.length >= 3 ? country : null,
    originText,
  };
}
