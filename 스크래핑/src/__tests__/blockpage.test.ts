import { describe, expect, it } from 'vitest';
import { blockLabel, detectBlockPage, looksUsable } from '../extract/blockpage.ts';

/** 실측한 ralphlauren.ca 307 응답 본문의 앞부분 */
const PX_CAPTCHA = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="description" content="px-captcha"><title>Access to this page has been denied</title>
</head><body><script>/* PerimeterX assignments */ window._pxVid = '';
window._pxUuid = '9eedf82a-a15b-11f1-a892-c200c0';</script></body></html>`;

/** 실측한 arcteryx.com 429 응답 본문 */
const KASADA = `<!DOCTYPE html><html><head></head><body><script>window.KPSDK
</script></body></html>`;

const filler = (n: number) => 'x'.repeat(n);

describe('detectBlockPage', () => {
  it('PerimeterX 캡차를 잡는다', () => {
    expect(detectBlockPage(PX_CAPTCHA)).toBe('perimeterx');
  });

  it('Kasada 를 잡는다', () => {
    expect(detectBlockPage(KASADA)).toBe('kasada');
  });

  it('Cloudflare 대기 페이지를 잡는다', () => {
    expect(detectBlockPage('<html><title>Just a moment...</title></html>')).toBe('cloudflare');
  });

  it('DataDome 을 잡는다', () => {
    expect(detectBlockPage('<html><body>geo.captcha-delivery.com</body></html>')).toBe('datadome');
  });

  it('벤더 지문 없는 일반 거부 문구도 잡는다', () => {
    expect(detectBlockPage('<html><body>Are you a robot?</body></html>')).toBe('generic');
  });

  it('정상 페이지는 null', () => {
    const pdp = `<html><body>${filler(30_000)}<script type="application/ld+json">
      {"@type":"Product","name":"Beta LT"}</script></body></html>`;
    expect(detectBlockPage(pdp)).toBeNull();
  });

  it('큰 페이지는 지문이 있어도 차단으로 보지 않는다', () => {
    /*
     * 정상 상품 페이지가 본문에 "captcha" 같은 단어를 담을 수 있다.
     * 크기 조건이 없으면 멀쩡한 수집분을 통째로 버리게 된다.
     */
    const big = `<html><body>Are you a robot?${filler(70_000)}</body></html>`;
    expect(detectBlockPage(big)).toBeNull();
  });
});

describe('looksUsable', () => {
  it('차단 페이지는 쓸 수 없다', () => {
    expect(looksUsable(PX_CAPTCHA)).toBe(false);
    expect(looksUsable(KASADA)).toBe(false);
  });

  it('너무 짧은 응답도 쓸 수 없다', () => {
    expect(looksUsable('<html></html>')).toBe(false);
  });

  it('정상 크기의 페이지는 쓸 수 있다', () => {
    expect(looksUsable(`<html><body>${filler(30_000)}</body></html>`)).toBe(true);
  });
});

describe('blockLabel', () => {
  it('벤더별 한국어 라벨을 준다', () => {
    expect(blockLabel('perimeterx')).toBe('차단(PerimeterX)');
    expect(blockLabel('kasada')).toBe('차단(Kasada)');
    expect(blockLabel(null)).toBe('정상');
  });
});
