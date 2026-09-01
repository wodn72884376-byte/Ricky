import { describe, expect, it } from 'vitest';

import {
  candidateUrls,
  genderDirOf,
  imageBaseOf,
  priceFileText,
  targetFileName,
  VIEW_SUFFIXES,
} from '../details/intake.ts';

const CDN = 'https://images.arcteryx.com/details/1350x1710';

describe('genderDirOf', () => {
  it('URL 의 성별 경로를 폴더명으로 읽는다', () => {
    expect(genderDirOf('https://outlet.arcteryx.com/ca/en/shop/mens/beta-ar-jacket-9906')).toBe('남성');
    expect(genderDirOf('https://arcteryx.com/ca/en/shop/womens/atom-jacket-9855')).toBe('여성');
  });

  it('모르면 null 이다 — 이름으로 추측하지 않는다', () => {
    expect(genderDirOf('https://arcteryx.com/ca/en/shop/axios-10-backpack-0707')).toBeNull();
  });
});

describe('imageBaseOf', () => {
  it('아는 뷰 접미사를 떼어 낸다', () => {
    expect(imageBaseOf(`${CDN}/S26-X000009906-Beta-AR-Jacket-Stone-Red-Dk-Stone-Front-View.jpg`)).toEqual({
      base: `${CDN}/S26-X000009906-Beta-AR-Jacket-Stone-Red-Dk-Stone`,
      ext: '.jpg',
      known: true,
    });
  });

  it('접미사가 없으면 확장자만 뗀다', () => {
    expect(imageBaseOf(`${CDN}/F25-X000009910-Sabre-SV-Jacket-Black.jpg`)).toEqual({
      base: `${CDN}/F25-X000009910-Sabre-SV-Jacket-Black`,
      ext: '.jpg',
      known: false,
    });
  });
});

describe('candidateUrls', () => {
  it('뷰 접미사가 있으면 형제 뷰 전부를 후보로 삼는다', () => {
    const urls = candidateUrls(`${CDN}/S26-X000009906-Beta-AR-Jacket-Stone-Red-Dk-Stone-Front-View.jpg`);
    expect(urls).toHaveLength(VIEW_SUFFIXES.length);
    expect(urls[0]).toContain('-Front-View.jpg');
    expect(urls).toContain(`${CDN}/S26-X000009906-Beta-AR-Jacket-Stone-Red-Dk-Stone-Back-View.jpg`);
  });

  it('접미사가 없어도 형제 뷰를 붙여 본다 — 컷이 하나뿐이라는 뜻이 아니다', () => {
    const urls = candidateUrls(`${CDN}/F25-X000009910-Sabre-SV-Jacket-Black.jpg`);
    expect(urls[0]).toBe(`${CDN}/F25-X000009910-Sabre-SV-Jacket-Black.jpg`);
    expect(urls).toContain(`${CDN}/F25-X000009910-Sabre-SV-Jacket-Black-Hover.jpg`);
  });
});

describe('targetFileName', () => {
  /*
   * 실측: 아울렛 Alpha SV(X000009989)의 대표 이미지가 정가 상품 X000009899 의 컷이었다.
   * 파일명 SKU 로 재고를 붙이므로 그대로 두면 색상은 멀쩡한데 재고가 영영 안 붙는다.
   */
  it('CDN 파일명의 상품코드를 PDP 가 말한 코드로 바로잡는다', () => {
    expect(
      targetFileName(`${CDN}/S26-X000009899-Alpha-SV-Jacket-Mantis-Black-Front-View.jpg`, 'X000009989'),
    ).toBe('S26-X000009989-Alpha-SV-Jacket-Mantis-Black-Front-View.jpg');
  });

  it('코드를 모르면 CDN 이름을 그대로 둔다 — 지어내지 않는다', () => {
    expect(targetFileName(`${CDN}/S26-X000009899-Alpha-SV-Jacket-Mantis-Black-Hover.jpg`, null)).toBe(
      'S26-X000009899-Alpha-SV-Jacket-Mantis-Black-Hover.jpg',
    );
  });
});

describe('priceFileText', () => {
  it('색상 값이 모두 같으면 한 줄로 적는다', () => {
    const out = priceFileText([
      { label: 'Mars', cad: 630 },
      { label: 'Blaze', cad: 630 },
    ]);
    expect(out).toContain('630CAD');
    expect(out).not.toContain('Mars:');
  });

  it('색상마다 값이 다르면 색상별로 적는다', () => {
    const out = priceFileText([
      { label: 'Stone Red / Dk Stone', cad: 588 },
      { label: 'Olive Moss / Euphoria', cad: 420 },
    ]);
    expect(out).toContain('Stone Red / Dk Stone: 588CAD');
    expect(out).toContain('Olive Moss / Euphoria: 420CAD');
  });

  it('합치기면 값이 같아도 색상별로 적는다 — 기존 색상 값을 덮지 않기 위해서다', () => {
    const out = priceFileText([{ label: 'Stone Red', cad: 448 }], { perColour: true });
    expect(out).toContain('Stone Red: 448CAD');
  });

  it('이미 적힌 색상은 남긴다 — 손으로 고친 값이 조용히 사라지면 안 된다', () => {
    const out = priceFileText([{ label: 'Stone Red', cad: 448 }, { label: 'Vitality II', cad: 448 }], {
      perColour: true,
      existing: '# 머리말\nStone Red: 399CAD\n',
    });
    expect(out).toContain('Stone Red: 399CAD');
    expect(out).not.toContain('Stone Red: 448CAD');
    expect(out).toContain('Vitality II: 448CAD');
  });

  it('가격을 하나도 못 읽었으면 있던 파일을 그대로 둔다', () => {
    expect(priceFileText([{ label: 'Black', cad: null }], { existing: '448CAD\n' })).toBe('448CAD\n');
    expect(priceFileText([{ label: 'Black', cad: null }])).toBeNull();
  });
});

// ---------------------------------------------------------------------------

import { BRANDS, belongsToSite, siteHosts } from '../config/brands.ts';
import { brandFromUrl } from '../stock/import.ts';

describe('브랜드 호스트', () => {
  /*
   * 실측(2026-09-01): 아울렛 8건이 카탈로그에 있는데 재고 조회 대상이 0건이었다.
   * `startsWith(origin)` 으로 브랜드를 갈랐기 때문이다.
   */
  it('아크테릭스는 정가몰과 아울렛을 함께 담당한다', () => {
    expect(siteHosts(BRANDS.arcteryx.ca)).toEqual(['arcteryx.com', 'outlet.arcteryx.com']);
    expect(belongsToSite(BRANDS.arcteryx.ca, 'https://outlet.arcteryx.com/ca/en/shop/mens/sabre-sv-jacket-9910')).toBe(true);
    expect(brandFromUrl('https://outlet.arcteryx.com/ca/en/shop/mens/sabre-sv-jacket-9910')).toBe('arcteryx');
  });

  it('호스트가 정확히 같아야 한다 — 도메인이 겹친다고 넘겨주지 않는다', () => {
    expect(belongsToSite(BRANDS.arcteryx.ca, 'https://arcteryx.com.evil.example/x')).toBe(false);
    expect(belongsToSite(BRANDS.arcteryx.ca, 'not a url')).toBe(false);
    expect(brandFromUrl('https://example.com/x')).toBeNull();
  });
});
