import { describe, expect, it } from 'vitest';
import { __test__ } from '../core/politeness.ts';

const { parseRobots, pathMatches } = __test__;

describe('pathMatches', () => {
  it('접두 일치', () => {
    expect(pathMatches('/cart', '/cart/items')).toBe(true);
    expect(pathMatches('/cart', '/carts')).toBe(true);
    expect(pathMatches('/cart', '/shop/cart')).toBe(false);
  });

  it('와일드카드', () => {
    expect(pathMatches('/*/cart', '/ca/cart')).toBe(true);
    expect(pathMatches('/*/*/cart', '/ca/en/cart')).toBe(true);
  });

  it('$ 종결자', () => {
    expect(pathMatches('/search$', '/search')).toBe(true);
    expect(pathMatches('/search$', '/search?q=1')).toBe(false);
  });

  it('정규식 메타문자를 문자 그대로 다룬다', () => {
    expect(pathMatches('/a.b', '/axb')).toBe(false);
    expect(pathMatches('/a.b', '/a.b')).toBe(true);
  });
});

describe('parseRobots', () => {
  it('* 그룹의 Disallow 만 채택한다', () => {
    // arcteryx.com/robots.txt 의 실제 구조를 축약한 것
    const txt = `
User-agent: *
Disallow: /cart
Disallow: /*/checkout/payment

User-agent: Googlebot
Disallow: /private
`;
    const r = parseRobots(txt);
    expect(r.disallow).toEqual(['/cart', '/*/checkout/payment']);
    expect(r.disallow).not.toContain('/private');
  });

  it('연속된 User-agent 는 같은 그룹이다', () => {
    const txt = `
User-agent: *
User-agent: Yeti
Disallow: /admin
`;
    expect(parseRobots(txt).disallow).toContain('/admin');
  });

  it('* 가 없는 연속 그룹은 채택하지 않는다', () => {
    // arcteryx.co.kr 의 실제 구조: Googlebot/NaverBot 등에만 걸린 규칙
    const txt = `
User-agent: *
Allow: /

User-agent: Googlebot
User-agent: NaverBot
User-agent: Yeti
Disallow: /admin/
Disallow: /data/
`;
    expect(parseRobots(txt).disallow).toEqual([]);
  });

  it('주석과 빈 줄을 무시한다', () => {
    const txt = `# comment
User-agent: *   # trailing
Disallow: /x
`;
    expect(parseRobots(txt).disallow).toEqual(['/x']);
  });

  it('crawl-delay 를 초 단위로 읽어 ms 로 바꾼다', () => {
    expect(parseRobots('User-agent: *\nCrawl-delay: 5').crawlDelayMs).toBe(5000);
  });

  it('빈 Disallow 는 전체 허용이므로 규칙에 넣지 않는다', () => {
    expect(parseRobots('User-agent: *\nDisallow:').disallow).toEqual([]);
  });
});
