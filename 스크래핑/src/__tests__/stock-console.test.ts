import { describe, expect, it } from 'vitest';

import {
  agoKo,
  buildConsoleData,
  consolePage,
  isStale,
  observationsOf,
  FRESH_HOURS,
} from '../stock/console.ts';

const NOW = Date.parse('2026-08-30T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

describe('agoKo', () => {
  it('한 시간 안이면 방금', () => expect(agoKo(hoursAgo(0.5), NOW)).toBe('방금'));
  it('시간 단위', () => expect(agoKo(hoursAgo(7), NOW)).toBe('7시간 전'));
  it('하루가 넘으면 날짜 단위', () => expect(agoKo(hoursAgo(50), NOW)).toBe('2일 전'));
  it('없으면 수집 전 — 0시간 전이라고 하지 않는다', () => expect(agoKo(null, NOW)).toBe('수집 전'));
});

describe('isStale — 판매 가부를 정하는 값이다 (PROJECT.md §6)', () => {
  it(`${FRESH_HOURS}시간 안은 신선`, () => expect(isStale(hoursAgo(FRESH_HOURS - 1), NOW)).toBe(false));
  it(`${FRESH_HOURS}시간을 넘기면 만료`, () => expect(isStale(hoursAgo(FRESH_HOURS + 1), NOW)).toBe(true));
  it('수집한 적 없으면 만료다 — 모르는 것을 신선하다고 하지 않는다', () =>
    expect(isStale(null, NOW)).toBe(true));
});

describe('observationsOf', () => {
  it('한 상품의 색상들을 합쳐 센다', () => {
    const obs = observationsOf(
      [
        { slug: 'a', sizes: [{ availability: 'in_stock' }, { availability: 'out_of_stock' }] },
        { slug: 'a', sizes: [{ availability: 'in_stock' }] },
        { slug: 'b', sizes: [{ availability: 'out_of_stock' }] },
      ],
      hoursAgo(2),
    );
    expect(obs.get('a')).toMatchObject({ inStock: 2, total: 3 });
    expect(obs.get('b')).toMatchObject({ inStock: 0, total: 1 });
  });
});

describe('buildConsoleData', () => {
  const data = buildConsoleData({ observations: new Map(), snapshot: null });

  it('등록 상품을 모두 싣는다', () => {
    expect(data.products.length).toBeGreaterThan(0);
  });

  it('주소 없는 상품이 맨 위에 온다 — 이 페이지의 존재 이유다', () => {
    const firstWithUrl = data.products.findIndex((p) => p.pages.length > 0);
    const lastWithout = data.products.map((p) => p.pages.length === 0).lastIndexOf(true);
    if (lastWithout >= 0) expect(lastWithout).toBeLessThan(firstWithUrl);
  });

  it('확장이 맡는 브랜드를 표시한다', () => {
    const polo = data.products.find((p) => p.brandKey === 'polo');
    const arc = data.products.find((p) => p.brandKey === 'arcteryx');
    expect(polo?.viaExtension).toBe(true);
    expect(arc?.viaExtension).toBe(false);
  });

  it('색상별 주소를 쓰는 브랜드만 색상 행을 편다 — 전부 펴면 표가 못 읽힌다', () => {
    const cg = data.products.find((p) => p.brandKey === 'canadagoose' && p.pages.length > 0);
    const arc = data.products.find((p) => p.brandKey === 'arcteryx');
    expect(cg!.variants.length).toBeGreaterThan(0);
    expect(arc!.variants).toEqual([]);
  });
});

describe('consolePage', () => {
  const html = consolePage(buildConsoleData({ observations: new Map(), snapshot: null }), {
    batch: 'javascript:void(0)',
    single: 'javascript:void(0)',
  });

  /*
   * 실측 사고 둘. 둘 다 조용히 깨졌다.
   *   - 최상위 `var status` 가 내장 window.status 에 먹혀 상태 문구가 안 바뀌었다
   *   - 칩의 `.ghost` 수식어가 버튼용 `.ghost` 를 물려받아 칩이 버튼만 해졌다
   */
  it('스크립트를 IIFE 로 감싼다 — 최상위 var 는 window 속성을 덮어쓴다', () => {
    expect(html).toContain('(function () {');
    expect(html).not.toMatch(/\nvar status =/);
  });

  it('버튼 스타일을 요소에 묶는다 — 클래스만 두면 칩이 물려받는다', () => {
    expect(html).toContain('button.ghost{');
    expect(html).not.toMatch(/\n\.ghost\{/);
  });

  it('DESIGN.md 색만 쓴다 — 새 semantic 색을 들이지 않는다', () => {
    const hex = [...html.matchAll(/#[0-9a-f]{3,6}\b/gi)].map((m) => m[0].toLowerCase());
    const allowed = new Set(['#000000', '#ffffff', '#5d5d5d', '#c4c4c4', '#949494', '#e8005d', '#ebebeb']);
    expect([...new Set(hex)].filter((h) => !allowed.has(h))).toEqual([]);
  });

  it('HTML 을 이스케이프한다', () => {
    const evil = consolePage(
      {
        generatedAt: new Date(NOW).toISOString(),
        snapshot: null,
        products: [
          {
            slug: 's', brandKo: '<img src=x>', brandKey: 'polo', name: '"><script>alert(1)</script>',
            gender: 'men', codes: [], pages: [], variants: [], viaExtension: true,
            checkedAt: null, inStock: 0, totalSizes: 0,
          },
        ],
      },
      { batch: 'javascript:void(0)', single: 'javascript:void(0)' },
    );
    expect(evil).not.toContain('<script>alert(1)</script>');
    expect(evil).toContain('&lt;img src=x&gt;');
  });
});
