/**
 * 브랜드 레지스트리 — 사이트별 엔드포인트·셀렉터를 이 파일 한 곳에 모은다 (CLAUDE.md 규칙 8).
 * 마크업이 바뀌면 여기만 고친다. 어댑터 로직에는 URL 을 하드코딩하지 않는다.
 *
 * 아래 값은 2026-08-26 실측 결과다.
 *   transport: http    — 일반 요청으로 200 이 떨어진다
 *   transport: browser — 봇 차단(Kasada/Akamai/PerimeterX) 또는 SPA. Playwright 필요
 *
 * 사이트 방어 정책과 도메인은 수시로 바뀐다. 본 실행 전 `npm run doctor` 로 재확인할 것.
 */
import type { BrandKey } from '../core/types.ts';

export type Transport = 'http' | 'browser';

export type SiteConfig = {
  origin: string;
  /** 홈 또는 지역 진입 경로. doctor 가 살아있는지 확인하는 대상. */
  entry: string;
  transport: Transport;
  /** robots.txt 가 사이트맵을 선언하지 않는 사이트를 위한 직접 지정. */
  sitemapUrls: string[];
  /** 상품 상세(PDP) URL 판별. 사이트맵에서 상품만 골라낸다. */
  isProductUrl: (url: string) => boolean;
  /** 대형 사이트맵 인덱스에서 따라갈 하위 사이트맵 선별. */
  followSitemap?: (url: string) => boolean;
  /**
   * 검색 URL 템플릿. KR 공식가 조회에 쓴다.
   * robots.txt 가 검색 경로를 막는 사이트(랄프로렌)는 비워 둔다 — 규칙을 어기지 않는다.
   */
  searchUrl?: (query: string) => string;
  /** PDP 렌더 완료 판정 셀렉터. 지연 로딩되는 가격 위젯 대응. */
  pdpWaitSelector?: string;
  /** URL 에서 브랜드 상품코드를 뽑는다. 있으면 CA↔KR 매칭 1순위 키가 된다. */
  productCodeFromUrl?: (url: string) => string | null;
  /** 이 사이트에서 상품 목록을 사이트맵으로 얻을 수 없는 이유. doctor 가 그대로 보여준다. */
  discoveryNote?: string;
  /**
   * 자동 수집이 되는 사이트인가.
   *
   * `'bookmarklet'` 이면 **네트워크로 시도조차 하지 않는다.** URL 을 알아도 소용없다 —
   * 봇 방어가 앞문까지 막고 있어 어차피 차단 페이지를 받는다(캐나다구스는 robots.txt 도
   * 429 다). 그런데 북마클릿으로 한 번 수집하면 `learnUrls` 가 URL 을 학습하므로,
   * 표시가 없으면 그 뒤로 **매 회차 헛되이 두드리게 된다** — 정중하지도 않고
   * 리포트는 '수집 실패'로 채워진다.
   *
   * 기본값은 `'auto'`. 막힌 것만 표시한다.
   */
  automation?: 'auto' | 'bookmarklet';

  /**
   * 같은 브랜드로 인정하는 **추가 호스트**.
   *
   * `origin` 하나로는 부족하다 — 아크테릭스는 정가몰(arcteryx.com)과 아울렛
   * (outlet.arcteryx.com)이 호스트가 다르고, 마크업·JSON-LD·robots 규칙은 같다.
   * 여기 없으면 그 주소는 **어느 브랜드도 아닌 것**이 되어 조회 대상에서 조용히
   * 빠진다 (실측: 아울렛 8건이 카탈로그엔 있는데 재고 조회가 0건이었다).
   *
   * 접두어로 넓히지 않고 호스트를 하나씩 적는다. 도메인 규칙으로 뭉개면
   * 언젠가 남의 사이트를 이 브랜드로 착각한다.
   */
  extraHosts?: string[];

  /**
   * 품절 항목을 **아예 싣지 않는** 사이트인가.
   *
   * 켜면 같은 상품의 다른 색상에서 본 사이즈를 축으로 삼아 빠진 칸을 품절로 채운다.
   *
   * **캐나다구스에는 켜지 않는다.** offer 가 전부 `InStock` 인 건 맞지만, 빠진 것이
   * 품절이라는 전제가 틀렸다 — 실측(2026-08-31): Garson Vest 의 Black S · Volcano S 는
   * 공식몰 화면에 멀쩡히 있는데 offer 목록에는 없었다. 즉 **빠진 것은 모르는 것**이다.
   * 모르는 것을 품절이라고 적으면 파는 물건이 안 팔린다. 화면(DOM)이 답이다.
   */
  omitsSoldOut?: boolean;
};

export type BrandConfig = {
  key: BrandKey;
  label: string;
  labelKo: string;
  ca: SiteConfig;
  kr: SiteConfig | null;
  /**
   * 네이버 검색·데이터랩에 던질 한국어 시드 키워드.
   * 브랜드명 단독은 노이즈가 크므로 대표 카테고리를 붙여 인기 라인을 잡는다.
   */
  naverSeeds: string[];
  /**
   * 한국에서 통용되는 제품 라인 별칭 → 영문 정식명.
   * 매칭 단계에서 한글 상품명을 CA 카탈로그에 연결하는 사전이다.
   */
  aliases: Record<string, string>;
  /** 통관 분류 참고용 기본 카테고리. 실제 HS 코드는 상품별로 확정한다. */
  defaultCategory: string;
  notes?: string;
};

const anyOf =
  (...fragments: string[]) =>
  (url: string) =>
    fragments.some((f) => url.includes(f));

/** 이 사이트가 담당하는 호스트들. `origin` + `extraHosts`. */
export function siteHosts(site: SiteConfig): string[] {
  return [new URL(site.origin).host, ...(site.extraHosts ?? [])];
}

/** 이 주소가 이 사이트의 것인가. 호스트가 정확히 같아야 한다. */
export function belongsToSite(site: SiteConfig, url: string): boolean {
  try {
    return siteHosts(site).includes(new URL(url).host);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------

export const BRANDS: Record<BrandKey, BrandConfig> = {
  // -------------------------------------------------------------------------
  arcteryx: {
    key: 'arcteryx',
    label: "Arc'teryx",
    labelKo: '아크테릭스',
    defaultCategory: '아웃도어 의류',
    ca: {
      origin: 'https://arcteryx.com',
      entry: 'https://arcteryx.com/ca/en',
      // Kasada(KPSDK). 사이트맵(정적 XML)은 HTTP 로 열리지만 PDP 는 곧 429 로 잠긴다.
      transport: 'browser',
      /*
       * 아울렛은 호스트만 다르고 플랫폼은 같다 — 같은 `/ca/en/shop/` 경로에
       * 같은 JSON-LD 를 싣고 robots 도 같은 것을 막는다(실측 2026-09-01).
       * 정가몰에서 단종된 이월 상품이 여기 남아 있어 별도 상품으로 판다.
       */
      extraHosts: ['outlet.arcteryx.com'],
      sitemapUrls: ['https://arcteryx.com/sitemap.xml'],
      isProductUrl: (u) => u.includes('/ca/en/shop/'),
      searchUrl: (q) => `https://arcteryx.com/ca/en/search?q=${encodeURIComponent(q)}`,
      // /ca/en/shop/alpha-sl-30-backpack-9660 → X000009660 (JSON-LD productGroupID 와 일치)
      productCodeFromUrl: (u) => {
        const m = u.match(/-(\d{4})(?:[/?#]|$)/);
        return m?.[1] ? `X00000${m[1]}` : null;
      },
      pdpWaitSelector: 'script[type="application/ld+json"]',
    },
    kr: {
      // 영원아웃도어가 운영하는 국내 공식몰. CA 본사몰과 플랫폼이 완전히 다르다.
      origin: 'https://arcteryx.co.kr',
      entry: 'https://arcteryx.co.kr/',
      // 상품 목록이 클라이언트에서 그려지는 SPA 다. 정적 HTML 에는 상품 링크가 없다.
      transport: 'browser',
      sitemapUrls: [],
      isProductUrl: anyOf('/products/', '/goods/'),
      searchUrl: (q) => `https://arcteryx.co.kr/search?keyword=${encodeURIComponent(q)}`,
      discoveryNote:
        '사이트맵에 내비게이션 26개만 있고 상품이 없다. SPA 라 국내 공식가는 검색 렌더링으로만 얻는다.',
    },
    naverSeeds: ['아크테릭스 자켓', '아크테릭스 베타', '아크테릭스 아톰', '아크테릭스 감마'],
    aliases: {
      베타: 'Beta',
      알파: 'Alpha',
      아톰: 'Atom',
      감마: 'Gamma',
      제타: 'Zeta',
      코버트: 'Covert',
      델타: 'Delta',
      세리움: 'Cerium',
      프로톤: 'Proton',
      스콰미시: 'Squamish',
      노듐: 'Nodin',
      맨티스: 'Mantis',
      그란빌: 'Granville',
      자켓: 'Jacket',
      후디: 'Hoody',
      팬츠: 'Pant',
      베스트: 'Vest',
    },
    notes:
      'CA 사이트맵 45,036 URL · 전 항목 lastmod 제공. ProductGroup JSON-LD 로 variant 단위 재고·GTIN 까지 확보된다. ' +
      'PDP 는 Kasada 로 보호되므로 브라우저 경로 필수. 국내 공식가는 네이버쇼핑 신호로 보완한다.',
  },

  // -------------------------------------------------------------------------
  lululemon: {
    key: 'lululemon',
    label: 'lululemon',
    labelKo: '룰루레몬',
    defaultCategory: '애슬레저 의류',
    ca: {
      origin: 'https://shop.lululemon.com',
      entry: 'https://shop.lululemon.com/en-ca',
      transport: 'browser',
      // Akamai 가 목록·상세를 모두 막는다.
      automation: 'bookmarklet',
      sitemapUrls: [
        'https://shop.lululemon.com/sitemap_index.xml',
        'https://shop.lululemon.com/sitemap.xml',
      ],
      isProductUrl: (u) => u.includes('/p/'),
      followSitemap: (u) => !/blog|article|store/i.test(u),
      searchUrl: (q) => `https://shop.lululemon.com/search?Ntt=${encodeURIComponent(q)}`,
      pdpWaitSelector: 'script[type="application/ld+json"]',
      productCodeFromUrl: (u) => u.match(/\/prod(\d+)/)?.[1] ?? null,
    },
    kr: {
      origin: 'https://www.lululemon.co.kr',
      entry: 'https://www.lululemon.co.kr/ko-kr/home',
      transport: 'browser',
      sitemapUrls: ['https://www.lululemon.co.kr/sitemap.xml'],
      isProductUrl: (u) => u.includes('/p/'),
      searchUrl: (q) => `https://www.lululemon.co.kr/ko-kr/search?Ntt=${encodeURIComponent(q)}`,
      productCodeFromUrl: (u) => u.match(/\/prod(\d+)/)?.[1] ?? null,
    },
    naverSeeds: ['룰루레몬 레깅스', '룰루레몬 정의', '룰루레몬 스쿠버', '룰루레몬 얼라인'],
    aliases: {
      얼라인: 'Align',
      정의: 'Define',
      스쿠버: 'Scuba',
      원더트레인: 'Wunder Train',
      스위프트리: 'Swiftly',
      에버웨어: 'Everywhere',
      인바운드: 'Inbound',
      레깅스: 'Tight',
      자켓: 'Jacket',
      후디: 'Hoodie',
    },
    notes:
      'CA/KR 모두 Akamai 봇 차단이라 브라우저 필수. WMTM(We Made Too Much) 세일 라인은 별도 추적이 필요하다 (PROJECT.md §6.1).',
  },

  // -------------------------------------------------------------------------
  coach: {
    key: 'coach',
    label: 'Coach',
    labelKo: '코치',
    defaultCategory: '가죽 잡화',
    ca: {
      // canada.coach.com 은 DNS 가 없다. ca.coach.com 이 정본이며 HTTP 로 열린다.
      origin: 'https://ca.coach.com',
      entry: 'https://ca.coach.com/',
      transport: 'http',
      sitemapUrls: ['https://ca.coach.com/sitemap_index.xml'],
      // /en/products/{slug}/{ID}.html — /fr/ 은 같은 상품의 프랑스어 중복이라 제외한다.
      isProductUrl: (u) => u.includes('/en/products/') && u.endsWith('.html'),
      searchUrl: (q) => `https://ca.coach.com/en/search?q=${encodeURIComponent(q)}`,
      pdpWaitSelector: 'script[type="application/ld+json"]',
      // /916.html, /C1231.html, /CAA58.html — 순수 숫자와 영숫자가 섞여 있다.
      // 이 코드가 한국몰과 동일하다 → 정확 매칭의 근거 (실측 교집합 230건).
      productCodeFromUrl: (u) => u.match(/\/([A-Z0-9]{2,12})\.html$/)?.[1] ?? null,
    },
    kr: {
      origin: 'https://korea.coach.com',
      entry: 'https://korea.coach.com/',
      transport: 'http',
      sitemapUrls: ['https://korea.coach.com/sitemap_index.xml'],
      // /products/outlet/... 은 아울렛 전용 가격 체계다. 본몰 가격과 섞으면 비교가 무너진다.
      isProductUrl: (u) =>
        u.includes('/products/') && u.endsWith('.html') && !u.includes('/products/outlet/'),
      searchUrl: (q) => `https://korea.coach.com/search?q=${encodeURIComponent(q)}`,
      productCodeFromUrl: (u) => u.match(/\/([A-Z0-9]{2,12})\.html$/)?.[1] ?? null,
    },
    naverSeeds: ['코치 가방', '코치 태비', '코치 백팩', '코치 지갑'],
    aliases: {
      태비: 'Tabby',
      윌로우: 'Willow',
      필로우: 'Pillow',
      스윙어: 'Swinger',
      로그: 'Rogue',
      브루클린: 'Brooklyn',
      시티: 'City',
      가방: 'Bag',
      지갑: 'Wallet',
      백팩: 'Backpack',
      숄더백: 'Shoulder Bag',
      크로스백: 'Crossbody',
      토트백: 'Tote',
    },
    notes:
      '★ CA·KR 이 동일한 상품 코드를 쓴다(C1231.html 등). 실측: CA 1,748건 · KR 559건 · 교집합 230건 정확 매칭. ' +
      '7개 브랜드 중 가격 비교 신뢰도가 가장 높다. Coach Outlet 은 별도 가격 체계라 KR 수집에서 제외했다.',
  },

  // -------------------------------------------------------------------------
  canadagoose: {
    key: 'canadagoose',
    label: 'Canada Goose',
    labelKo: '캐나다구스',
    defaultCategory: '다운 아우터',
    ca: {
      origin: 'https://www.canadagoose.com',
      entry: 'https://www.canadagoose.com/ca/en/',
      /*
       * Kasada 가 **앞문까지** 걸려 있다 — robots.txt 조차 429 다(2026-08-29 실측).
       * 아크테릭스는 같은 Kasada 라도 사이트맵·robots 를 정적 파일로 내주기 때문에
       * 목록을 HTTP 로 확보하고 PDP 만 브라우저로 여는 게 통한다. 여기는 그 문이 없다.
       * robots.txt 를 못 읽으면 거기서 멈춘다 — 수집은 북마클릿으로만 한다.
       */
      transport: 'browser',
      // Kasada 가 robots.txt 까지 429 다(2026-08-29 실측). 뚫을 문이 없다.
      automation: 'bookmarklet',
      sitemapUrls: [
        'https://www.canadagoose.com/sitemap_index.xml',
        'https://www.canadagoose.com/ca/en/sitemap.xml',
      ],
      // 스타일 코드는 숫자 4자리 + 성별/디스크 접미 1~2자다 — 2080M(Classic) · 2080MB(Black) · 2052MT(Tonal)
      isProductUrl: (u) => /\/ca\/en\/.+-\d{4}[A-Z]{0,2}\.html/.test(u) || u.includes('/ca/en/p/'),
      followSitemap: (u) => u.includes('/ca/en') || u.includes('ca_en'),
      searchUrl: (q) => `https://www.canadagoose.com/ca/en/search?q=${encodeURIComponent(q)}`,
      pdpWaitSelector: 'script[type="application/ld+json"]',
      /*
       * Expedition Parka 4660M 처럼 4자리 + 접미가 스타일번호다.
       * 접미가 두 글자인 경우가 있다 — 로고 디스크 마감마다 코드가 따로다
       * (MacMillan Parka: 2080M Classic · 2080MB Black, Langford: 2052MT Tonal).
       * 한 글자만 잡으면 2080MB 를 2080M 으로 읽어 다른 상품의 재고를 가져온다.
       */
      productCodeFromUrl: (u) => u.match(/-(\d{4}[A-Z]{0,2})(?=\.html|$)/i)?.[1] ?? null,
    },
    kr: {
      // canadagoose.kr 은 응답이 없다. 국내 공식몰은 canadagoose.co.kr 이다.
      origin: 'https://www.canadagoose.co.kr',
      entry: 'https://www.canadagoose.co.kr/main/today',
      transport: 'browser',
      sitemapUrls: [],
      isProductUrl: anyOf('/product/', '/goods/'),
      searchUrl: (q) => `https://www.canadagoose.co.kr/search?keyword=${encodeURIComponent(q)}`,
      discoveryNote: '사이트맵에 홈 URL 1건뿐이다(lastmod 2022). SPA 라 검색 렌더링으로만 접근한다.',
    },
    naverSeeds: [
      '캐나다구스 패딩',
      '캐나다구스 익스페디션',
      '캐나다구스 랭포드',
      '캐나다구스 셀커크',
    ],
    aliases: {
      익스페디션: 'Expedition',
      랭포드: 'Langford',
      셀커크: 'Selkirk',
      섀도우: 'Shadow',
      칠리왁: 'Chilliwack',
      트릴리엄: 'Trillium',
      로시클레어: 'Rossclair',
      맥밀란: 'Macmillan',
      크로프턴: 'Crofton',
      주노: 'Juno',
      파카: 'Parka',
      패딩: 'Parka',
      다운: 'Down',
    },
    notes:
      '2026-08-26 실측: Kasada 차단으로 CA 수집 불가(브라우저 포함). KR 은 SPA 라 사이트맵이 없다. ' +
      'Made in Canada 비중이 높아 CKFTA 관세 0% 후보지만, 부가세 10% 는 부과되며 ' +
      '원산지는 반드시 실물 라벨로 확인한다 — 브랜드 국적 추정 금지 (CLAUDE.md 규칙 5).',
  },

  // -------------------------------------------------------------------------
  tommy: {
    key: 'tommy',
    label: 'Tommy Hilfiger',
    labelKo: '타미힐피거',
    defaultCategory: '캐주얼 의류',
    ca: {
      origin: 'https://ca.tommy.com',
      entry: 'https://ca.tommy.com/',
      transport: 'http',
      sitemapUrls: ['https://ca.tommy.com/sitemap_index.xml'],
      // /en/{slug}/{STYLECODE}.html — 예: /en/suede-moccasin/FM05501.html
      isProductUrl: (u) => /\/en\/[^/]+\/[A-Z0-9]{6,12}\.html$/.test(u),
      followSitemap: (u) => u.includes('products'),
      searchUrl: (q) => `https://ca.tommy.com/en/search?q=${encodeURIComponent(q)}`,
      pdpWaitSelector: 'script[type="application/ld+json"]',
      productCodeFromUrl: (u) => u.match(/\/([A-Z0-9]{6,12})\.html$/)?.[1] ?? null,
    },
    kr: {
      // kr.tommy.com 은 DNS 가 없다. tommy.co.kr 은 DNS 는 살아있으나 해외 IP 를 막는다.
      // 국내 정가는 네이버쇼핑 신호로 대체된다.
      origin: 'https://www.tommy.co.kr',
      entry: 'https://www.tommy.co.kr/',
      transport: 'browser',
      sitemapUrls: [],
      isProductUrl: anyOf('/product/', '/goods/', '/p/'),
      searchUrl: (q) => `https://www.tommy.co.kr/search?q=${encodeURIComponent(q)}`,
      discoveryNote:
        '해외 IP 차단으로 연결 자체가 되지 않는다. 국내 가격은 네이버쇼핑 최저가로만 얻는다.',
    },
    naverSeeds: ['타미힐피거 맨투맨', '타미힐피거 니트', '타미힐피거 패딩', '타미힐피거 셔츠'],
    aliases: {
      플래그: 'Flag',
      모노그램: 'Monogram',
      바시티: 'Varsity',
      아이코닉: 'Iconic',
      맨투맨: 'Sweatshirt',
      니트: 'Sweater',
      셔츠: 'Shirt',
      자켓: 'Jacket',
      패딩: 'Puffer',
    },
    notes:
      'CA 사이트맵에 상품 8,957건. 국내 판권이 별도 법인에 있어 상품 구성이 CA 와 크게 다르므로 ' +
      '동일 스타일 매칭률이 낮을 수 있다.',
  },

  // -------------------------------------------------------------------------
  polo: {
    key: 'polo',
    label: 'Polo Ralph Lauren',
    labelKo: '폴로 랄프로렌',
    defaultCategory: '캐주얼 의류',
    ca: {
      origin: 'https://www.ralphlauren.ca',
      entry: 'https://www.ralphlauren.ca/',
      // PerimeterX 캡차(307 px-captcha). 선언된 사이트맵(/index)도 같은 벽에 막힌다.
      transport: 'browser',
      // PerimeterX 가 PDP 를 막는다. 사이트맵은 열리지만 상세를 못 읽는다.
      automation: 'bookmarklet',
      sitemapUrls: ['https://www.ralphlauren.ca/index'],
      // 실측 URL: /men-clothing-sweaters/cable-knit-cotton-sweater/515061.html
      // 슬러그와 코드 사이가 대시가 아니라 슬래시인 경우가 있다.
      isProductUrl: (u) => /[-/]\d{3,12}\.html/.test(u) || /-prod\d+\.html/.test(u),
      // robots.txt 가 `*/search*` 를 금지한다 → 검색 경로를 쓰지 않는다.
      searchUrl: undefined,
      pdpWaitSelector: 'script[type="application/ld+json"]',
      productCodeFromUrl: (u) => u.match(/[-/](\d{3,12})\.html/)?.[1] ?? null,
      discoveryNote: 'PerimeterX 캡차. robots.txt 가 검색 경로도 금지한다.',
    },
    kr: {
      origin: 'https://www.ralphlauren.co.kr',
      entry: 'https://www.ralphlauren.co.kr/',
      transport: 'http',
      sitemapUrls: ['https://www.ralphlauren.co.kr/sitemap_index.xml'],
      // /{slug}-{ID}.html — 예: /custom-slim-fit-pique-polo-shirt-82432.html
      isProductUrl: (u) => /[-/]\d{3,12}\.html/.test(u),
      searchUrl: undefined, // CA 와 같은 robots 규칙
      productCodeFromUrl: (u) => u.match(/[-/](\d{3,12})\.html/)?.[1] ?? null,
    },
    naverSeeds: [
      '폴로 랄프로렌 셔츠',
      '폴로 랄프로렌 니트',
      '폴로 케이블 니트',
      '폴로 옥스포드 셔츠',
    ],
    aliases: {
      케이블니트: 'Cable Knit',
      옥스포드: 'Oxford',
      치노: 'Chino',
      베어: 'Polo Bear',
      커스텀핏: 'Custom Fit',
      클래식핏: 'Classic Fit',
      슬림핏: 'Slim Fit',
      셔츠: 'Shirt',
      니트: 'Sweater',
      맨투맨: 'Sweatshirt',
      피케: 'Pique',
    },
    notes:
      'KR 사이트맵에 상품 4,531건(HTTP 접근 가능). CA 는 PerimeterX 캡차로 브라우저에서도 실패한다 ' +
      '(2026-08-26 실측: 홈 렌더 9.7KB 캡차 페이지, 사이트맵 /index 는 307). ' +
      '양국이 같은 -{숫자}.html 체계를 쓰므로 CA 수집만 뚫리면 정확 매칭이 가능하다.',
  },

  // -------------------------------------------------------------------------
  tumi: {
    key: 'tumi',
    label: 'TUMI',
    labelKo: '투미',
    defaultCategory: '여행 가방',
    ca: {
      origin: 'https://www.tumi.ca',
      entry: 'https://www.tumi.ca/',
      transport: 'browser',
      // 일반 요청은 연결 자체가 끊긴다 — 자동 수집 경로가 없다.
      automation: 'bookmarklet',
      sitemapUrls: ['https://www.tumi.ca/sitemap_index.xml', 'https://www.tumi.ca/sitemap.xml'],
      isProductUrl: (u) => /\/p\//.test(u) || /-\d{9,}\.html/.test(u),
      searchUrl: (q) => `https://www.tumi.ca/search?q=${encodeURIComponent(q)}`,
      pdpWaitSelector: 'script[type="application/ld+json"]',
      // TUMI 는 전 세계 공통 스타일번호(예: 1171581041)를 쓴다 → 매칭 키로 최적
      productCodeFromUrl: (u) => u.match(/(\d{9,12})/)?.[1] ?? null,
    },
    kr: {
      origin: 'https://www.tumi.co.kr',
      entry: 'https://www.tumi.co.kr/',
      transport: 'http',
      sitemapUrls: [],
      isProductUrl: (u) => /\/p\//.test(u) || /-\d{9,}\.html/.test(u) || u.includes('/product/'),
      searchUrl: (q) => `https://www.tumi.co.kr/search?q=${encodeURIComponent(q)}`,
      productCodeFromUrl: (u) => u.match(/(\d{9,12})/)?.[1] ?? null,
      discoveryNote: '사이트맵이 없다. 국내 가격은 검색 또는 네이버쇼핑으로 얻는다.',
    },
    naverSeeds: ['투미 백팩', '투미 알파', '투미 캐리어', '투미 볼트'],
    aliases: {
      알파: 'Alpha',
      볼트: 'Voyageur',
      해리슨: 'Harrison',
      나비게이션: 'Navigation',
      백팩: 'Backpack',
      캐리어: 'Luggage',
      토트: 'Tote',
      슬리브: 'Sleeve',
    },
    notes:
      '2026-08-26 실측: CA 는 연결 자체가 차단된다(HTTP·브라우저 모두 타임아웃). KR 은 열리지만 사이트맵이 없다. ' +
      '전 세계 공통 스타일번호 덕에 CA 만 뚫리면 정확 매칭이 가능하다.',
  },
};

export const ALL_BRAND_KEYS = Object.keys(BRANDS) as BrandKey[];

/**
 * 상위 프로젝트 카탈로그의 `brandSlug` → 수집기 `BrandKey`.
 *
 * 두 이름이 갈린 것이 있다. 카탈로그와 DB 는 상품명을 슬러그로 만들어 `canada-goose`
 * 이고(마이그레이션 `20260828000004_brands_expansion.sql` 에 이미 시드돼 있다),
 * 수집기 레지스트리 키는 `canadagoose` 다.
 *
 * **DB 쪽이 정본이다** — 이미 적재된 식별자를 바꾸면 조인이 깨지고 마이그레이션이 하나 더 든다.
 * 그래서 수집기가 맞춘다. 이 표가 없으면 캐나다구스 상품이 조회 대상에서 통째로 빠지는데,
 * 오류 없이 조용히 빠지므로 아무도 눈치채지 못한다.
 */
const BRAND_SLUG_ALIAS: Record<string, BrandKey> = {
  'canada-goose': 'canadagoose',
  'tommy-hilfiger': 'tommy',
};

/** 카탈로그 brandSlug 를 수집기 키로 바꾼다. 모르는 브랜드면 null. */
export function toBrandKey(brandSlug: string): BrandKey | null {
  const aliased = BRAND_SLUG_ALIAS[brandSlug] ?? brandSlug;
  return aliased in BRANDS ? (aliased as BrandKey) : null;
}

export function resolveBrands(input: string | undefined): BrandKey[] {
  if (!input || input === 'all') return ALL_BRAND_KEYS;
  const wanted = input
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const unknown = wanted.filter((w) => !(w in BRANDS));
  if (unknown.length > 0) {
    throw new Error(
      `알 수 없는 브랜드: ${unknown.join(', ')}\n사용 가능: ${ALL_BRAND_KEYS.join(', ')}`,
    );
  }
  return wanted as BrandKey[];
}
