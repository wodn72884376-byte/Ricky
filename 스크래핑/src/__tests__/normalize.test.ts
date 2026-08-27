import { describe, expect, it } from 'vitest';
import {
  brandDropTokens,
  extractStyleCodes,
  jaccard,
  normalizeName,
  similarity,
  tokenize,
} from '../match/normalize.ts';

const ARC_ALIASES = { 베타: 'Beta', 아톰: 'Atom', 자켓: 'Jacket' };
const ARC_DROP = brandDropTokens("Arc'teryx", '아크테릭스');

describe('tokenize', () => {
  it('판촉 문구와 시즌 코드를 제거한다', () => {
    const t = tokenize('[해외배송] 아크테릭스 베타 LT 자켓 24FW 정품 무료배송', ARC_ALIASES);
    expect(t).toContain('beta');
    expect(t).toContain('lt');
    expect(t).not.toContain('무료배송');
    expect(t).not.toContain('정품');
    expect(t.join(' ')).not.toMatch(/24fw/);
  });

  it('색상어는 매칭을 막지 않도록 제거한다', () => {
    const black = tokenize("Arc'teryx Beta LT Jacket Black", ARC_ALIASES);
    const navy = tokenize("Arc'teryx Beta LT Jacket Navy", ARC_ALIASES);
    expect(black).toEqual(navy);
  });

  it('한글 별칭을 영문 정식명으로 치환한다', () => {
    expect(tokenize('아톰 후디', { 아톰: 'Atom' })).toContain('atom');
  });

  it('긴 별칭을 먼저 적용해 부분 치환 사고를 막는다', () => {
    const t = tokenize('필로우태비 26', { 태비: 'Tabby', 필로우태비: 'Pillow Tabby' });
    expect(t).toContain('pillow');
    expect(t).toContain('tabby');
  });

  it('변별력 없는 1글자 토큰을 버리되 숫자는 남긴다', () => {
    const t = tokenize('Alpha SL 30 Backpack');
    expect(t).toContain('30');
    expect(t).toContain('alpha');
  });
});

describe('extractStyleCodes', () => {
  it('TUMI 형태의 긴 숫자 스타일번호를 잡는다', () => {
    expect(extractStyleCodes('TUMI Alpha 3 Backpack 1171581041')).toContain('1171581041');
  });

  it('Coach 형태의 영문+숫자 코드를 잡는다', () => {
    expect(extractStyleCodes('Tabby Shoulder Bag 26 CH194')).toContain('CH194');
  });

  it("Arc'teryx productGroupID 형태를 잡는다", () => {
    expect(extractStyleCodes('X000009660')).toContain('X000009660');
  });
});

describe('similarity', () => {
  it('어순이 달라도 같은 상품이면 높게 나온다', () => {
    const ca = tokenize("Arc'teryx Beta LT Jacket", ARC_ALIASES, ARC_DROP);
    const kr = tokenize('아크테릭스 베타 LT 자켓 남성 고어텍스', ARC_ALIASES, ARC_DROP);
    expect(similarity(ca, kr)).toBeGreaterThan(0.6);
  });

  it('다른 라인은 임계값 아래로 떨어진다', () => {
    const beta = tokenize("Arc'teryx Beta LT Jacket", ARC_ALIASES, ARC_DROP);
    const atom = tokenize('아크테릭스 아톰 LT 후디', ARC_ALIASES, ARC_DROP);
    expect(similarity(beta, atom)).toBeLessThan(0.45);
  });

  it('한국 상품명의 토큰 과잉을 포함률로 보정한다', () => {
    const ca = tokenize('Expedition Parka');
    const krLong = tokenize(
      '캐나다구스 익스페디션 파카 남성 헤리티지 정품 국내배송 당일출고 방한 다운',
      { 익스페디션: 'Expedition', 파카: 'Parka' },
    );
    // 순수 자카드였다면 토큰 수 차이 때문에 0.3 미만이 된다.
    expect(jaccard(ca, krLong)).toBeLessThan(0.45);
    expect(similarity(ca, krLong)).toBeGreaterThan(0.55);
  });

  it('빈 입력은 0이다', () => {
    expect(similarity([], ['a'])).toBe(0);
    expect(similarity(['a'], [])).toBe(0);
  });
});

describe('normalizeName', () => {
  it('정규화 결과는 공백으로 이어진 토큰 문자열이다', () => {
    expect(normalizeName('  Beta   LT   Jacket  ')).toBe('beta lt jacket');
  });
});

describe('brandDropTokens', () => {
  it('브랜드명을 토큰으로 쪼개고 아포스트로피를 없앤다', () => {
    expect(brandDropTokens("Arc'teryx", '아크테릭스')).toEqual(['arcteryx', '아크테릭스']);
    expect(brandDropTokens('Polo Ralph Lauren')).toEqual(['polo', 'ralph', 'lauren']);
  });

  it('브랜드명을 빼야 같은 브랜드 안에서 변별력이 생긴다', () => {
    const drop = brandDropTokens("Arc'teryx", '아크테릭스');
    const beta = tokenize("Arc'teryx Beta LT Jacket", ARC_ALIASES, drop);
    const atom = tokenize("Arc'teryx Atom LT Hoody", ARC_ALIASES, drop);
    expect(beta).not.toContain('arcteryx');
    // 브랜드명을 남겨두면 서로 다른 라인끼리도 점수가 부풀려진다
    const withBrand = similarity(
      tokenize("Arc'teryx Beta LT Jacket", ARC_ALIASES),
      tokenize("Arc'teryx Atom LT Hoody", ARC_ALIASES),
    );
    expect(similarity(beta, atom)).toBeLessThan(withBrand);
  });
});
