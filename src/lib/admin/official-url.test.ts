import { describe, expect, it } from 'vitest';
import { shortUrl } from './official-url';

describe('shortUrl', () => {
  it('호스트와 마지막 조각을 남긴다 — 마지막 조각이 상품을 가리킨다', () => {
    expect(shortUrl('https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868')).toBe(
      'arcteryx.com/…/beta-jacket-0868',
    );
  });

  it('www 는 뗀다', () => {
    expect(shortUrl('https://www.canadagoose.com/ca/en')).toBe('canadagoose.com/…/en');
  });

  it('경로가 없으면 호스트만', () => {
    expect(shortUrl('https://arcteryx.com')).toBe('arcteryx.com');
    expect(shortUrl('https://arcteryx.com/')).toBe('arcteryx.com');
  });

  it('한 조각짜리 경로는 그대로 붙인다 — 줄일 것이 없다', () => {
    expect(shortUrl('https://shop.lululemon.com/p')).toBe('shop.lululemon.com/p');
  });

  // 잘라내면 뭐가 잘못됐는지 알 수 없다. 주소가 아니면 손대지 않는다.
  it('주소가 아니면 그대로 돌려준다', () => {
    expect(shortUrl('주소 아님')).toBe('주소 아님');
  });
});
