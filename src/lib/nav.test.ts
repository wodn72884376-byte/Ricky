import { describe, expect, it } from 'vitest';
import { filterGender } from './catalog';
import { GENDER_LABEL, PRIMARY_NAV, parseGender, type Gender } from './nav';

/**
 * 쇼핑 축. `unisex` 와 `kids` 의 관계가 이 파일의 전부다 —
 * 둘 다 "남녀 어느 쪽도 아님"처럼 보이지만 정반대로 동작한다 (20260830000014).
 */

type Item = { gender: 'men' | 'women' | 'unisex' | 'kids' };

const ITEMS: Item[] = [
  { gender: 'men' },
  { gender: 'women' },
  { gender: 'unisex' },
  { gender: 'kids' },
];

const genders = (g: Gender | null) => filterGender(ITEMS, g).map((i) => i.gender).sort();

describe('filterGender', () => {
  it('unisex 는 남녀 양쪽 목록에 나온다', () => {
    expect(genders('men')).toEqual(['men', 'unisex']);
    expect(genders('women')).toEqual(['unisex', 'women']);
  });

  /*
   * 성인 프리 사이즈가 아동 목록에 섞이면 부모가 사이즈를 착각한다.
   * unisex 를 "성별 없음"으로 읽어 아동까지 넣고 싶은 유혹이 있는 자리라 못박아 둔다.
   */
  it('아동 목록에는 아동만 나온다 — unisex 도 안 나온다', () => {
    expect(genders('kids')).toEqual(['kids']);
  });

  it('아동 상품은 남녀 목록에 나오지 않는다', () => {
    expect(genders('men')).not.toContain('kids');
    expect(genders('women')).not.toContain('kids');
  });

  it('축을 안 고르면 전부 나온다', () => {
    expect(genders(null)).toHaveLength(4);
  });
});

describe('parseGender', () => {
  it('아는 값만 통과시킨다', () => {
    expect(parseGender('men')).toBe('men');
    expect(parseGender('women')).toBe('women');
    expect(parseGender('kids')).toBe('kids');
  });

  /* `unisex` 는 상품의 속성이지 고객이 고르는 축이 아니다 — URL 로 들어와도 전체로 본다 */
  it('unisex·쓰레기 값은 null(전체)이다', () => {
    for (const bad of ['unisex', 'MEN', '', undefined, null, 42, ['men']]) {
      expect(parseGender(bad)).toBeNull();
    }
  });
});

describe('PRIMARY_NAV', () => {
  /* 헤더가 `menus[entry.gender]` 로 메가 패널을 찾는다. 여기 빠지면 런타임에 undefined 다. */
  it('메뉴가 걸린 항목의 gender 는 전부 파싱 가능한 값이다', () => {
    for (const entry of PRIMARY_NAV) {
      if (!entry.hasMenu) continue;
      expect(parseGender(entry.gender)).toBe(entry.gender);
      expect(GENDER_LABEL[entry.gender]).toBeTruthy();
    }
  });

  it('Kids 가 2행에 있다', () => {
    expect(PRIMARY_NAV.map((n) => n.key)).toContain('kids');
  });
});
