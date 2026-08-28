import { describe, expect, it } from 'vitest';
import {
  compareSizes,
  extractColourCode,
  normalizeColour,
  normalizeSize,
  parseCoachSku,
} from '../stock/normalize.ts';

describe('parseCoachSku', () => {
  it('신발 SKU 를 style/colour/치수/폭 으로 쪼갠다', () => {
    // 실측: ca.coach.com Reagan Penny Loafer
    expect(parseCoachSku('CCN27 CBD  9.5 D')).toEqual({
      style: 'CCN27',
      colourCode: 'CBD',
      rest: ['9.5', 'D'],
    });
  });

  it('공백 개수가 달라도 같게 파싱한다', () => {
    // 실측 SKU 는 정렬 때문에 공백이 1~3개로 들쭉날쭉하다
    expect(parseCoachSku('CAE94 BLK  10  D').rest).toEqual(['10', 'D']);
    expect(parseCoachSku('CAF03 CAH  8   B').rest).toEqual(['8', 'B']);
  });

  it('의류 SKU 는 사이즈 토큰 하나만 남는다', () => {
    expect(parseCoachSku('CAF56 KHA  M').rest).toEqual(['M']);
  });

  it('가방 SKU 는 사이즈 토큰이 없다', () => {
    expect(parseCoachSku('CW380 CQ/BK').rest).toEqual([]);
  });

  it('null 이면 빈 결과', () => {
    expect(parseCoachSku(null)).toEqual({ style: null, colourCode: null, rest: [] });
  });
});

describe('normalizeSize — Coach', () => {
  it('신발: size 필드가 폭 라벨이어도 SKU 에서 실제 치수를 되찾는다', () => {
    /*
     * 이게 이 파일의 존재 이유다.
     * size 필드만 믿으면 9.5 와 10 이 똑같이 "extra wide" 로 뭉개져
     * 사이즈별 재고 조회가 성립하지 않는다.
     */
    const s = normalizeSize('coach', 'extra wide', 'CCN27 CBD  9.5 D');
    expect(s.code).toBe('9.5');
    expect(s.width).toBe('D');
    expect(s.label).toBe('9.5 D');
    expect(s.declared).toBe('extra wide');
  });

  it('신발: 치수가 다르면 라벨도 달라진다', () => {
    const a = normalizeSize('coach', 'extra wide', 'CCN27 CBD  9.5 D');
    const b = normalizeSize('coach', 'extra wide', 'CCN27 CBD  10  D');
    expect(a.label).not.toBe(b.label);
    expect(b.label).toBe('10 D');
  });

  it('의류: SKU 토큰을 사이즈로 쓴다', () => {
    const s = normalizeSize('coach', 'M', 'CAF56 KHA  M');
    expect(s.label).toBe('M');
    expect(s.width).toBeNull();
  });

  it('가방: 분류 라벨을 사이즈로 착각하지 않는다', () => {
    // "large wristlet" 은 사이즈가 아니라 품목 분류다
    const s = normalizeSize('coach', 'large wristlet', 'CW380 CQ/BK');
    expect(s.label).toBe('-');
    expect(s.code).toBeNull();
    expect(s.declared).toBe('large wristlet');
  });
});

describe('normalizeSize — Arc\'teryx', () => {
  it('size 필드를 그대로 정본으로 쓴다', () => {
    const s = normalizeSize('arcteryx', 'XXL', 'X000010868013');
    expect(s.label).toBe('XXL');
    expect(s.code).toBe('XXL');
  });

  it('NA 는 사이즈 없음으로 본다', () => {
    // 배낭 등은 size 가 "NA" 로 온다
    expect(normalizeSize('arcteryx', 'NA', 'X000009660001').label).toBe('-');
  });

  it('빈 값도 사이즈 없음', () => {
    expect(normalizeSize('arcteryx', null, null).label).toBe('-');
  });
});

describe('extractColourCode', () => {
  it('Coach 는 SKU 두 번째 토큰이 색상 코드다', () => {
    expect(extractColourCode('coach', 'CW380 CQ/BK')).toBe('CQ/BK');
    expect(extractColourCode('coach', 'CCN27 CBD  9.5 D')).toBe('CBD');
  });

  it('색상 코드 체계가 없는 브랜드는 null', () => {
    expect(extractColourCode('arcteryx', 'X000010868013')).toBeNull();
  });
});

describe('normalizeColour', () => {
  it('공백만 정리하고 브랜드 표기는 보존한다', () => {
    expect(normalizeColour('  Black   Sapphire ')).toBe('Black Sapphire');
    expect(normalizeColour('Brass/Poppy')).toBe('Brass/Poppy');
  });

  it('빈 값은 null', () => {
    expect(normalizeColour('   ')).toBeNull();
    expect(normalizeColour(null)).toBeNull();
  });
});

describe('compareSizes', () => {
  it('의류 사이즈를 사람이 기대하는 순서로 정렬한다', () => {
    const sorted = ['XL', 'XS', 'M', 'XXL', 'S', 'L'].sort(compareSizes);
    expect(sorted).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  it('신발 치수는 숫자 크기 순이다 — 문자열 정렬이면 10 이 9 앞에 온다', () => {
    const sorted = ['10 D', '9.5 D', '11 D', '8 D'].sort(compareSizes);
    expect(sorted).toEqual(['8 D', '9.5 D', '10 D', '11 D']);
  });

  it('사이즈 없음은 뒤로 보낸다', () => {
    const sorted = ['-', 'M', 'S'].sort(compareSizes);
    expect(sorted).toEqual(['S', 'M', '-']);
  });
});
