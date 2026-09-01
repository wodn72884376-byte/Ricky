import { describe, expect, it } from 'vitest';
import { readDisclosure } from '../details/disclose.ts';

const S = (h: string, t: string) => ({ h, t });

describe('readDisclosure', () => {
  it('제목으로 소재와 취급주의를 가른다', () => {
    const d = readDisclosure([
      S('Materials', 'Shell: 100% nylon. Lining: 100% polyester.'),
      S('Care', 'Machine wash cold. Tumble dry low.'),
    ]);
    expect(d.material).toBe('Shell: 100% nylon. Lining: 100% polyester.');
    expect(d.care).toBe('Machine wash cold. Tumble dry low.');
  });

  it('한국어 표기도 읽는다', () => {
    const d = readDisclosure([S('소재', '겉감 나일론 100%'), S('취급 시 주의사항', '드라이클리닝')]);
    expect(d.material).toBe('겉감 나일론 100%');
    expect(d.care).toBe('드라이클리닝');
  });

  it('원산지는 본문 어디에 있어도 찾는다 — 대개 소재 문단 끝에 붙는다', () => {
    const d = readDisclosure([S('Materials', 'Recycled nylon. Made in Vietnam.')]);
    expect(d.origin).toBe('Vietnam');
  });

  it('나라 뒤 군더더기를 자른다', () => {
    const d = readDisclosure([S('Details', 'Made in Canada with imported fabric')]);
    expect(d.origin).toBe('Canada');
  });

  /*
   * 브랜드가 자기 페이지에 적어 둔 값이지 실물 라벨이 아니다. CKFTA 관세 판정이
   * 여기 걸리므로(규칙 5) 쓰는 쪽이 원문을 함께 보고 판단할 수 있어야 한다.
   */
  it('원문을 함께 남긴다 — 실물 라벨 확인 전이라는 걸 알 수 있게', () => {
    const d = readDisclosure([S('Materials', 'Made in Vietnam.')]);
    expect(d.originText).toContain('Made in Vietnam');
  });

  it('없으면 지어내지 않는다', () => {
    const d = readDisclosure([S('Shipping', 'Free returns within 30 days')]);
    expect(d).toMatchObject({ material: null, care: null, origin: null });
  });

  it('나라처럼 보이지 않는 짧은 값은 버린다', () => {
    expect(readDisclosure([S('x', 'Made in CA')]).origin).toBeNull();
  });

  it('첫 번째 값이 이긴다 — 페이지 아래쪽 추천 상품의 소재를 덮어쓰지 않는다', () => {
    const d = readDisclosure([S('Material', '진짜 소재'), S('Material', '추천 상품 소재')]);
    expect(d.material).toBe('진짜 소재');
  });
});

describe('사이즈 표기', () => {
  /*
   * 실측: 캐나다구스 화면은 2XL·3XL 로 쓰고 JSON-LD 는 XXL·XXXL 로 쓴다.
   * 맞추지 않으면 화면에서 읽은 값이 다른 줄로 들어가고, 화면이 재고 있다고 한
   * 사이즈가 품절로 남는다.
   */
  it('수집기가 2XL 을 XXL 로 맞춘다', async () => {
    const { collectorSource } = await import('../stock/bookmarklet.ts');
    const src = collectorSource();
    expect(src).toContain('function normSize(x)');
    const normSize = new Function(`${/function normSize[\s\S]*?\n  }/.exec(src)![0]}; return normSize;`)();
    expect(normSize('2XL')).toBe('XXL');
    expect(normSize('3XL')).toBe('XXXL');
    expect(normSize('XL')).toBe('XL');
    expect(normSize('M')).toBe('M');
  });

  it('사이즈 정규식이 2XL·3XL 을 받는다 — 안 받으면 그 버튼이 통째로 빠진다', async () => {
    const { collectorSource } = await import('../stock/bookmarklet.ts');
    expect(collectorSource()).toContain('[2-4]XL');
  });

  it('취소선이 자식에 걸려도 품절로 읽는다', async () => {
    const { collectorSource } = await import('../stock/bookmarklet.ts');
    const src = collectorSource();
    expect(src).toContain('querySelectorAll');
    expect(src).toContain('line-through');
  });

  it('스와치가 선택을 안 알려주면 화면 문구에서 색상을 읽는다', async () => {
    const { collectorSource } = await import('../stock/bookmarklet.ts');
    expect(collectorSource()).toMatch(/colou\?r\|색상/);
  });
});
