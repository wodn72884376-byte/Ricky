/**
 * ⚠️ 생성 파일 — 직접 수정하지 말 것. `npm run catalog:import`로 재생성한다.
 *
 * 원본: 아크테릭스/(+가격표 비교.xlsx) · 코치/ · 폴로/ · 룰루레몬/
 * 생성: 2026-08-28
 *
 * 아직 채워야 하는 값:
 *   - originCountry: 전부 null이다. **실물 라벨을 보고** 채운다. 브랜드 국적으로 추정 금지.
 *     캐나다산이 아니면 CKFTA 관세 면제를 받을 수 없다 (PROJECT.md §3.3).
 *   - weightG: 배송비 산정에 필요하다. 실측하거나 공식몰 스펙에서 가져온다.
 *   - krRetailKrw: 아크테릭스만 있다. 나머지는 한국 정발가 확인 후 채운다.
 *   - shippingKrw: 전부 null이다. 관리자 상품 등록 화면에서 상품마다 입력한다.
 *   - smartstoreUrl: 전부 null이다. 스마트스토어 상품 URL을 넣어야 구매 버튼이 뜬다.
 */

export type CatalogVariant = {
  color: string;
  colorKo: string;
  sku: string;
  cardImage: string;
  detailImages: string[];
  /** 색상마다 값이 다른 경우에만 있다 (코치 — 소재가 다르면 가격이 다르다) */
  cadCents?: number;
  costKrw?: number;
  priceKrw?: number;
};

export type CatalogProduct = {
  slug: string;
  brand: string;
  brandSlug: string;
  name: string;
  gender: 'men' | 'women' | 'unisex';
  category: string;
  /** 실물 라벨 기준. 미확인이면 null */
  originCountry: string | null;
  /** 상품 정보 제공 고시 — 케어 라벨에서 옮긴 값. 없으면 null */
  material: string | null;
  care: string | null;
  manufacturer: string | null;
  cadCents: number;
  costKrw: number;
  /** 대표 판매가. 색상별로 다르면 variant.priceKrw가 우선한다 */
  priceKrw: number;
  /** 한국 정발가. 비교 표시용 */
  krRetailKrw: number | null;
  /**
   * 이 상품 한 점의 국제 배송비(원). 관리자 상품 등록 화면에서 직접 넣는다.
   * null이면 무게·부피 기반 계산값을 쓴다 — 0은 무료배송이므로 null과 다르다.
   */
  shippingKrw: number | null;
  /**
   * 네이버 스마트스토어 상품 URL. 결제는 전부 여기서 일어난다.
   * 없으면 살 수 있는 경로가 없으므로 PDP가 구매 버튼 대신 안내를 띄운다.
   */
  smartstoreUrl: string | null;
  sizes: string[];
  variants: CatalogVariant[];
};

export const CATALOG: CatalogProduct[] = [
  {
    "slug": "arcteryx-alpha-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Alpha Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 90000,
    "costKrw": 945000,
    "priceKrw": 981000,
    "krRetailKrw": 1090000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Graphite Black",
        "colorKo": "그래파이트 블랙",
        "sku": "X000010932-GRAPHITE-BLACK",
        "cardImage": "/images/products/arcteryx-alpha-jacket-men-graphite-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-alpha-jacket-men-graphite-black.webp",
          "/images/products/arcteryx-alpha-jacket-men-graphite-black-back-view.webp",
          "/images/products/arcteryx-alpha-jacket-men-graphite-black-fabric-detail.webp",
          "/images/products/arcteryx-alpha-jacket-men-graphite-black-hood.webp",
          "/images/products/arcteryx-alpha-jacket-men-graphite-black-hover.webp",
          "/images/products/arcteryx-alpha-jacket-men-graphite-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-alpha-sv-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Alpha SV Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 115000,
    "costKrw": 1207500,
    "priceKrw": 1305000,
    "krRetailKrw": 1450000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "24K Black",
        "colorKo": "24K 블랙",
        "sku": "X000009899-24K-BLACK",
        "cardImage": "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black.webp",
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-back-view.webp",
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-fabric-detail.webp",
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-hood.webp",
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-hover.webp",
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-atom-hoody-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Atom Hoody",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 38000,
    "costKrw": 399000,
    "priceKrw": 432000,
    "krRetailKrw": 480000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009556-BLACK",
        "cardImage": "/images/products/arcteryx-atom-hoody-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-hoody-men-black.webp",
          "/images/products/arcteryx-atom-hoody-men-black-back-view.webp",
          "/images/products/arcteryx-atom-hoody-men-black-fabric-detail.webp",
          "/images/products/arcteryx-atom-hoody-men-black-hood.webp",
          "/images/products/arcteryx-atom-hoody-men-black-hover.webp",
          "/images/products/arcteryx-atom-hoody-men-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-atom-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Atom Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009561-BLACK",
        "cardImage": "/images/products/arcteryx-atom-jacket-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-jacket-men-black.webp",
          "/images/products/arcteryx-atom-jacket-men-black-back-view.webp",
          "/images/products/arcteryx-atom-jacket-men-black-detail-1.webp",
          "/images/products/arcteryx-atom-jacket-men-black-fabric-detail.webp",
          "/images/products/arcteryx-atom-jacket-men-black-hover.webp",
          "/images/products/arcteryx-atom-jacket-men-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-beta-ar-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Beta AR Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 945000,
    "krRetailKrw": 1050000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000011062-BLACK",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-men-black.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-black-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-black-fabric-detail.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-black-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-black-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-black-side-view.webp"
        ]
      },
      {
        "color": "Cloud Void",
        "colorKo": "클라우드 보이드",
        "sku": "X000011062-CLOUD-VOID",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-fabric-detail.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-beta-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Beta Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 52000,
    "costKrw": 546000,
    "priceKrw": 585000,
    "krRetailKrw": 650000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010878-BLACK",
        "cardImage": "/images/products/arcteryx-beta-jacket-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-jacket-men-black.webp",
          "/images/products/arcteryx-beta-jacket-men-black-back-view.webp",
          "/images/products/arcteryx-beta-jacket-men-black-fabric-detail.webp",
          "/images/products/arcteryx-beta-jacket-men-black-hood.webp",
          "/images/products/arcteryx-beta-jacket-men-black-hover.webp",
          "/images/products/arcteryx-beta-jacket-men-black-side-view.webp"
        ]
      },
      {
        "color": "Sea Salt",
        "colorKo": "씨솔트",
        "sku": "X000010878-SEA-SALT",
        "cardImage": "/images/products/arcteryx-beta-jacket-men-sea-salt-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-jacket-men-sea-salt.webp",
          "/images/products/arcteryx-beta-jacket-men-sea-salt-back-view.webp",
          "/images/products/arcteryx-beta-jacket-men-sea-salt-fabric-detail.webp",
          "/images/products/arcteryx-beta-jacket-men-sea-salt-hood.webp",
          "/images/products/arcteryx-beta-jacket-men-sea-salt-hover.webp",
          "/images/products/arcteryx-beta-jacket-men-sea-salt-side-view.webp"
        ]
      },
      {
        "color": "Headwaters",
        "colorKo": "헤드워터스",
        "sku": "X000010878-HEADWATERS",
        "cardImage": "/images/products/arcteryx-beta-jacket-men-headwaters-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-jacket-men-headwaters.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-back-view.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-full-body.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-hood.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-hover.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-beta-sl-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Beta SL Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 64000,
    "costKrw": 672000,
    "priceKrw": 765000,
    "krRetailKrw": 850000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010854-BLACK",
        "cardImage": "/images/products/arcteryx-beta-sl-jacket-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-sl-jacket-men-black.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-black-back-view.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-black-fabric-detail.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-black-hood.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-black-hover.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-black-side-view.webp"
        ]
      },
      {
        "color": "Cloud",
        "colorKo": "클라우드",
        "sku": "X000010854-CLOUD",
        "cardImage": "/images/products/arcteryx-beta-sl-jacket-men-cloud-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-sl-jacket-men-cloud.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-cloud-back-view.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-cloud-fabric-detail.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-cloud-hood.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-cloud-hover.webp",
          "/images/products/arcteryx-beta-sl-jacket-men-cloud-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-gamma-lightweight-hoody-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Gamma Lightweight Hoody",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010606-BLACK",
        "cardImage": "/images/products/arcteryx-gamma-lightweight-hoody-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black-back-view.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black-full-body.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black-hood.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black-hover.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black-side-view.webp"
        ]
      },
      {
        "color": "Void",
        "colorKo": "보이드",
        "sku": "X000010606-VOID",
        "cardImage": "/images/products/arcteryx-gamma-lightweight-hoody-men-void-card.webp",
        "detailImages": [
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void-back-view.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void-full-body.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void-hood.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void-hover.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-proton-sl-hoody-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Proton SL Hoody",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 405000,
    "krRetailKrw": 450000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009557-BLACK",
        "cardImage": "/images/products/arcteryx-proton-sl-hoody-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-proton-sl-hoody-men-black.webp",
          "/images/products/arcteryx-proton-sl-hoody-men-black-back-view.webp",
          "/images/products/arcteryx-proton-sl-hoody-men-black-fabric-detail.webp",
          "/images/products/arcteryx-proton-sl-hoody-men-black-hood.webp",
          "/images/products/arcteryx-proton-sl-hoody-men-black-hover.webp",
          "/images/products/arcteryx-proton-sl-hoody-men-black-side-view.webp"
        ]
      },
      {
        "color": "Sea Salt",
        "colorKo": "씨솔트",
        "sku": "X000009557-SEA-SALT",
        "cardImage": "/images/products/arcteryx-proton-sl-hoody-men-sea-salt-card.webp",
        "detailImages": [
          "/images/products/arcteryx-proton-sl-hoody-men-sea-salt.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-serratus-hoody-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Serratus Hoody",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 44000,
    "costKrw": 462000,
    "priceKrw": 513000,
    "krRetailKrw": 570000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Void Cloud",
        "colorKo": "보이드 클라우드",
        "sku": "X000010941-VOID-CLOUD",
        "cardImage": "/images/products/arcteryx-serratus-hoody-men-void-cloud-card.webp",
        "detailImages": [
          "/images/products/arcteryx-serratus-hoody-men-void-cloud.webp",
          "/images/products/arcteryx-serratus-hoody-men-void-cloud-back-view.webp",
          "/images/products/arcteryx-serratus-hoody-men-void-cloud-fabric-detail.webp",
          "/images/products/arcteryx-serratus-hoody-men-void-cloud-hood.webp",
          "/images/products/arcteryx-serratus-hoody-men-void-cloud-hover.webp",
          "/images/products/arcteryx-serratus-hoody-men-void-cloud-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-squamish-hoody-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Squamish Hoody",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 26000,
    "costKrw": 273000,
    "priceKrw": 279000,
    "krRetailKrw": 310000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010276-BLACK",
        "cardImage": "/images/products/arcteryx-squamish-hoody-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-squamish-hoody-men-black.webp",
          "/images/products/arcteryx-squamish-hoody-men-black-back-view.webp",
          "/images/products/arcteryx-squamish-hoody-men-black-fabric-detail.webp",
          "/images/products/arcteryx-squamish-hoody-men-black-hood.webp",
          "/images/products/arcteryx-squamish-hoody-men-black-hover.webp",
          "/images/products/arcteryx-squamish-hoody-men-black-side-view.webp"
        ]
      },
      {
        "color": "Habitat",
        "colorKo": "해비탯",
        "sku": "X000010276-HABITAT",
        "cardImage": "/images/products/arcteryx-squamish-hoody-men-habitat-card.webp",
        "detailImages": [
          "/images/products/arcteryx-squamish-hoody-men-habitat.webp",
          "/images/products/arcteryx-squamish-hoody-men-habitat-back-view.webp",
          "/images/products/arcteryx-squamish-hoody-men-habitat-full-body.webp",
          "/images/products/arcteryx-squamish-hoody-men-habitat-hood.webp",
          "/images/products/arcteryx-squamish-hoody-men-habitat-hover.webp",
          "/images/products/arcteryx-squamish-hoody-men-habitat-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-altira-cropped-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Altira Cropped Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 1031940,
    "krRetailKrw": 1146600,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010094-BLACK",
        "cardImage": "/images/products/arcteryx-altira-cropped-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-altira-cropped-jacket-women-black.webp",
          "/images/products/arcteryx-altira-cropped-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-altira-cropped-jacket-women-black-fabric-detail.webp",
          "/images/products/arcteryx-altira-cropped-jacket-women-black-hood.webp",
          "/images/products/arcteryx-altira-cropped-jacket-women-black-hover.webp",
          "/images/products/arcteryx-altira-cropped-jacket-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-atom-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Atom Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Alpine Rose",
        "colorKo": "알파인 로즈",
        "sku": "X000009855-ALPINE-ROSE",
        "cardImage": "/images/products/arcteryx-atom-jacket-women-alpine-rose-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-jacket-women-alpine-rose.webp",
          "/images/products/arcteryx-atom-jacket-women-alpine-rose-back-view.webp",
          "/images/products/arcteryx-atom-jacket-women-alpine-rose-detail-1.webp",
          "/images/products/arcteryx-atom-jacket-women-alpine-rose-fabric-detail.webp",
          "/images/products/arcteryx-atom-jacket-women-alpine-rose-hover.webp",
          "/images/products/arcteryx-atom-jacket-women-alpine-rose-side-view.webp"
        ]
      },
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009855-BLACK",
        "cardImage": "/images/products/arcteryx-atom-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-jacket-women-black.webp",
          "/images/products/arcteryx-atom-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-atom-jacket-women-black-detail-1.webp",
          "/images/products/arcteryx-atom-jacket-women-black-fabric-detail.webp",
          "/images/products/arcteryx-atom-jacket-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-atom-sl-hoody-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Atom SL Hoody",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009511-BLACK",
        "cardImage": "/images/products/arcteryx-atom-sl-hoody-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-sl-hoody-women-black.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-black-back-view.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-black-fabric-detail.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-black-hood.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-black-hover.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-black-side-view.webp"
        ]
      },
      {
        "color": "Sea Salt",
        "colorKo": "씨솔트",
        "sku": "X000009511-SEA-SALT",
        "cardImage": "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-fabric-detail.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-hood.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-hover.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-hover.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-side-view.webp"
        ]
      },
      {
        "color": "Alpine Blue",
        "colorKo": "알파인 블루",
        "sku": "X000009511-ALPINE-BLUE",
        "cardImage": "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-back-view.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-full-body.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-hood.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-hover.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-side-view.webp"
        ]
      },
      {
        "color": "Arctic Silk",
        "colorKo": "아틱 실크",
        "sku": "X000009511-ARCTIC-SILK",
        "cardImage": "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-card.webp",
        "detailImages": [
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-back-view.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-full-body.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-hood.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-hover.webp",
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-beta-ar-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Beta AR Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 945000,
    "krRetailKrw": 1050000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009863-BLACK",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-women-black.webp",
          "/images/products/arcteryx-beta-ar-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-women-black-fabric-detail.webp",
          "/images/products/arcteryx-beta-ar-jacket-women-black-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-women-black-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-clarkia-ar-insulated-hoody-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Clarkia AR Insulated Hoody",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 44000,
    "costKrw": 462000,
    "priceKrw": 540540,
    "krRetailKrw": 600600,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010746-BLACK",
        "cardImage": "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-back-view.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-fabric-detail.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-hood.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-hover.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-side-view.webp"
        ]
      },
      {
        "color": "Lt Renegade",
        "colorKo": "라이트 레니게이드",
        "sku": "X000010746-LT-RENEGADE",
        "cardImage": "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-card.webp",
        "detailImages": [
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-back-view.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-fabric-detail.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-hood.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-hover.webp",
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-coelle-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Coelle Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 50000,
    "costKrw": 525000,
    "priceKrw": 585000,
    "krRetailKrw": 650000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Alpine Blue",
        "colorKo": "알파인 블루",
        "sku": "X000009466-ALPINE-BLUE",
        "cardImage": "/images/products/arcteryx-coelle-jacket-women-alpine-blue-card.webp",
        "detailImages": [
          "/images/products/arcteryx-coelle-jacket-women-alpine-blue.webp",
          "/images/products/arcteryx-coelle-jacket-women-alpine-blue-hover.webp"
        ]
      },
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009466-BLACK",
        "cardImage": "/images/products/arcteryx-coelle-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-coelle-jacket-women-black.webp",
          "/images/products/arcteryx-coelle-jacket-women-black-back-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-elec-insulated-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Elec Insulated Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 38000,
    "costKrw": 399000,
    "priceKrw": 466830,
    "krRetailKrw": 518700,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009512-BLACK",
        "cardImage": "/images/products/arcteryx-elec-insulated-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-elec-insulated-jacket-women-black.webp",
          "/images/products/arcteryx-elec-insulated-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-elec-insulated-jacket-women-black-detail-1.webp",
          "/images/products/arcteryx-elec-insulated-jacket-women-black-fabric-detail.webp",
          "/images/products/arcteryx-elec-insulated-jacket-women-black-hover.webp",
          "/images/products/arcteryx-elec-insulated-jacket-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-gamma-lightweight-hoody-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Gamma Lightweight Hoody",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Atmos Solitude",
        "colorKo": "아트모스 솔리튜드",
        "sku": "X000010924-ATMOS-SOLITUDE",
        "cardImage": "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-card.webp",
        "detailImages": [
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-back-view.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-fabric-detail.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-hood.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-hover.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-side-view.webp"
        ]
      },
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010924-BLACK",
        "cardImage": "/images/products/arcteryx-gamma-lightweight-hoody-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black-back-view.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black-fabric-detail.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black-hood.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black-hover.webp",
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-gamma-mx-hoody-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Gamma MX Hoody",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 52000,
    "costKrw": 546000,
    "priceKrw": 567000,
    "krRetailKrw": 630000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Arctic Silk",
        "colorKo": "아틱 실크",
        "sku": "X000009456-ARCTIC-SILK",
        "cardImage": "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-card.webp",
        "detailImages": [
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-back-view.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-fabric-detail.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-hood.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-hover.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-side-view.webp"
        ]
      },
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009456-BLACK",
        "cardImage": "/images/products/arcteryx-gamma-mx-hoody-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-gamma-mx-hoody-women-black.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-black-back-view.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-black-fabric-detail.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-black-hood.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-black-hover.webp",
          "/images/products/arcteryx-gamma-mx-hoody-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-naya-cropped-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Naya Cropped Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 64000,
    "costKrw": 672000,
    "priceKrw": 711000,
    "krRetailKrw": 790000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010327-BLACK",
        "cardImage": "/images/products/arcteryx-naya-cropped-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-naya-cropped-jacket-women-black.webp",
          "/images/products/arcteryx-naya-cropped-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-naya-cropped-jacket-women-black-full-body.webp",
          "/images/products/arcteryx-naya-cropped-jacket-women-black-hood.webp",
          "/images/products/arcteryx-naya-cropped-jacket-women-black-hover.webp",
          "/images/products/arcteryx-naya-cropped-jacket-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-naya-cropped-stowhood-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Naya Cropped Stowhood Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 30000,
    "costKrw": 315000,
    "priceKrw": 359100,
    "krRetailKrw": 399000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010263-BLACK",
        "cardImage": "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-full-body.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-hood.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-hover.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-side-view.webp"
        ]
      },
      {
        "color": "Habitat",
        "colorKo": "해비탯",
        "sku": "X000010263-HABITAT",
        "cardImage": "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-card.webp",
        "detailImages": [
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-back-view.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-full-body.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-hood.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-hover.webp",
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-sentinel-jacket-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Sentinel Jacket",
    "gender": "women",
    "category": "outerwear",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 90000,
    "costKrw": 945000,
    "priceKrw": 1105650,
    "krRetailKrw": 1228500,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010539-BLACK",
        "cardImage": "/images/products/arcteryx-sentinel-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-sentinel-jacket-women-black.webp",
          "/images/products/arcteryx-sentinel-jacket-women-black-back-view.webp",
          "/images/products/arcteryx-sentinel-jacket-women-black-full-body.webp",
          "/images/products/arcteryx-sentinel-jacket-women-black-hood.webp",
          "/images/products/arcteryx-sentinel-jacket-women-black-hover.webp",
          "/images/products/arcteryx-sentinel-jacket-women-black-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "arcteryx-squamish-hoody-women",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Squamish Hoody",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Arc'teryx Equipment",
    "cadCents": 26000,
    "costKrw": 273000,
    "priceKrw": 279000,
    "krRetailKrw": 310000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000010268-BLACK",
        "cardImage": "/images/products/arcteryx-squamish-hoody-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-squamish-hoody-women-black.webp",
          "/images/products/arcteryx-squamish-hoody-women-black-back-view.webp",
          "/images/products/arcteryx-squamish-hoody-women-black-fabric-detail.webp",
          "/images/products/arcteryx-squamish-hoody-women-black-hood.webp",
          "/images/products/arcteryx-squamish-hoody-women-black-hover.webp",
          "/images/products/arcteryx-squamish-hoody-women-black-side-view.webp"
        ]
      },
      {
        "color": "Mongoose",
        "colorKo": "몽구스",
        "sku": "X000010268-MONGOOSE",
        "cardImage": "/images/products/arcteryx-squamish-hoody-women-mongoose-card.webp",
        "detailImages": [
          "/images/products/arcteryx-squamish-hoody-women-mongoose.webp",
          "/images/products/arcteryx-squamish-hoody-women-mongoose-back-view.webp",
          "/images/products/arcteryx-squamish-hoody-women-mongoose-fabric-detail.webp",
          "/images/products/arcteryx-squamish-hoody-women-mongoose-hood.webp",
          "/images/products/arcteryx-squamish-hoody-women-mongoose-hover.webp",
          "/images/products/arcteryx-squamish-hoody-women-mongoose-side-view.webp"
        ]
      },
      {
        "color": "Alpine Blue",
        "colorKo": "알파인 블루",
        "sku": "X000010268-ALPINE-BLUE",
        "cardImage": "/images/products/arcteryx-squamish-hoody-women-alpine-blue-card.webp",
        "detailImages": [
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue.webp",
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue-back-view.webp",
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue-full-body.webp",
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue-hood.webp",
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue-hover.webp",
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue-side-view.webp"
        ]
      },
      {
        "color": "Arctic Silk Sea Salt",
        "colorKo": "아틱 실크 씨솔트",
        "sku": "X000010268-ARCTIC-SILK-SEA-SALT",
        "cardImage": "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-card.webp",
        "detailImages": [
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt.webp",
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-back-view.webp",
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-full-body.webp",
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-hood.webp",
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-hover.webp",
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-side-view.webp"
        ]
      }
    ]
  },
  {
    "slug": "coach-brooklyn-shoulder-bag-28-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Brooklyn Shoulder Bag 28",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "우븐 가죽",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 28800,
    "costKrw": 314568,
    "priceKrw": 402700,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Maple",
        "colorKo": "메이플",
        "sku": "CDZ42-BRASS-MAPLE",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-brass-maple-7.webp"
        ],
        "cadCents": 28800,
        "costKrw": 314568,
        "priceKrw": 402700
      },
      {
        "color": "natural grain leather Black",
        "colorKo": "내추럴 그레인 레더 블랙",
        "sku": "CU068-NATURAL-GRAIN-LEATHER-BRASS-BLACK",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-black-8.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      },
      {
        "color": "natural grain leather Maple",
        "colorKo": "내추럴 그레인 레더 메이플",
        "sku": "CU068-NATURAL-GRAIN-LEATHER-BRASS-MAPLE",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-natural-grain-leather-brass-maple-8.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      },
      {
        "color": "straw Dark Fuchsia",
        "colorKo": "스트로 다크 푸시아",
        "sku": "CDU75-STRAW-BRASS-DARK-FUCHSIA",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-straw-brass-dark-fuchsia-8.webp"
        ],
        "cadCents": 31000,
        "costKrw": 338130,
        "priceKrw": 432900
      },
      {
        "color": "suede Dark Chocolate",
        "colorKo": "스웨이드 다크 초콜릿",
        "sku": "CW637-SUEDE-BRASS-DARK-CHOCOLATE",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-dark-chocolate-8.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      },
      {
        "color": "suede Warm Brown",
        "colorKo": "스웨이드 웜 브라운",
        "sku": "CW637-SUEDE-BRASS-WARM-BROWN",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-8.webp",
          "/images/products/coach-brooklyn-shoulder-bag-28-women-suede-brass-warm-brown-9.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      }
    ]
  },
  {
    "slug": "coach-brooklyn-shoulder-bag-34-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Brooklyn Shoulder Bag 34",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "내추럴 그레인 가죽",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 48000,
    "costKrw": 520200,
    "priceKrw": 665900,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "natural grain leather Black",
        "colorKo": "내추럴 그레인 레더 블랙",
        "sku": "CCU00-NATURAL-GRAIN-LEATHER-BRASS-BLACK",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-8.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-black-9.webp"
        ],
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900
      },
      {
        "color": "natural grain leather Maple",
        "colorKo": "내추럴 그레인 레더 메이플",
        "sku": "CCU00-NATURAL-GRAIN-LEATHER-BRASS-MAPLE",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-8.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-natural-grain-leather-brass-maple-9.webp"
        ],
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900
      },
      {
        "color": "suede Dark Chocolate",
        "colorKo": "스웨이드 다크 초콜릿",
        "sku": "CCU01-SUEDE-BRASS-DARK-CHOCOLATE",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-8.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-dark-chocolate-9.webp"
        ],
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900
      },
      {
        "color": "suede Warm Brown",
        "colorKo": "스웨이드 웜 브라운",
        "sku": "CCU01-SUEDE-BRASS-WARM-BROWN",
        "cardImage": "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-card.webp",
        "detailImages": [
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-2.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-3.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-4.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-5.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-6.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-7.webp",
          "/images/products/coach-brooklyn-shoulder-bag-34-women-suede-brass-warm-brown-8.webp"
        ],
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900
      }
    ]
  },
  {
    "slug": "coach-chelsea-shoulder-bag-30-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Chelsea Shoulder Bag 30",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "내추럴 그레인 가죽, 스웨이드 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 40000,
    "costKrw": 434520,
    "priceKrw": 556200,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "CDS58-NATURAL-GRAIN-LEATHER-BRASS-BLACK",
        "cardImage": "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-card.webp",
        "detailImages": [
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-2.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-3.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-4.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-5.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-6.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-7.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-8.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-black-9.webp"
        ],
        "cadCents": 40000,
        "costKrw": 434520,
        "priceKrw": 556200
      },
      {
        "color": "Maple",
        "colorKo": "메이플",
        "sku": "CDS58-NATURAL-GRAIN-LEATHER-BRASS-MAPLE",
        "cardImage": "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-card.webp",
        "detailImages": [
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-2.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-3.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-4.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-5.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-6.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-7.webp",
          "/images/products/coach-chelsea-shoulder-bag-30-women-natural-grain-leather-brass-maple-8.webp"
        ],
        "cadCents": 40000,
        "costKrw": 434520,
        "priceKrw": 556200
      }
    ]
  },
  {
    "slug": "coach-ella-shoulder-bag-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Ella Shoulder Bag",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "소프트 페블 가죽, 리사이클 폴리에스터 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 24900,
    "costKrw": 272799,
    "priceKrw": 349200,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "pebbled leather Black",
        "colorKo": "페블 레더 블랙",
        "sku": "CCE47-PEBBLED-LEATHER-GUNMETAL-BLACK",
        "cardImage": "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-card.webp",
        "detailImages": [
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black.webp",
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-2.webp",
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-3.webp",
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-4.webp",
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-5.webp",
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-6.webp",
          "/images/products/coach-ella-shoulder-bag-women-pebbled-leather-gunmetal-black-7.webp"
        ],
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200
      },
      {
        "color": "suede Blush Pink",
        "colorKo": "스웨이드 블러쉬 핑크",
        "sku": "CET38-SUEDE-GOLD-BLUSH-PINK",
        "cardImage": "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-card.webp",
        "detailImages": [
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-2.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-3.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-4.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-5.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-6.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-7.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-8.webp",
          "/images/products/coach-ella-shoulder-bag-women-suede-gold-blush-pink-9.webp"
        ],
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200
      }
    ]
  },
  {
    "slug": "coach-jade-drawstring-bag-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Jade Drawstring Bag",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "스웨이드 및 내추럴 그레인 나파 가죽, 면 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 27000,
    "costKrw": 295290,
    "priceKrw": 378000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Dark Chocolate",
        "colorKo": "다크 초콜릿",
        "sku": "CER86-SUEDE-BRASS-DARK-CHOCOLATE",
        "cardImage": "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-card.webp",
        "detailImages": [
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-2.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-3.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-4.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-5.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-6.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-7.webp",
          "/images/products/coach-jade-drawstring-bag-women-suede-brass-dark-chocolate-8.webp"
        ],
        "cadCents": 27000,
        "costKrw": 295290,
        "priceKrw": 378000
      }
    ]
  },
  {
    "slug": "coach-lana-shoulder-bag-19-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Lana Shoulder Bag 19",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "폴리시드 페블 가죽, 패브릭 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 36000,
    "costKrw": 391680,
    "priceKrw": 501400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "CCY32-POLISHED-PEBBLE-LEATHER-BRASS-BLACK",
        "cardImage": "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-card.webp",
        "detailImages": [
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-2.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-3.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-4.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-5.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-6.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-7.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-black-8.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      },
      {
        "color": "Chalk",
        "colorKo": "초크",
        "sku": "CCY32-POLISHED-PEBBLE-LEATHER-BRASS-CHALK",
        "cardImage": "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-card.webp",
        "detailImages": [
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-2.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-3.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-4.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-5.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-6.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-7.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-chalk-8.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      },
      {
        "color": "Maple",
        "colorKo": "메이플",
        "sku": "CCY32-POLISHED-PEBBLE-LEATHER-BRASS-MAPLE",
        "cardImage": "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-card.webp",
        "detailImages": [
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-2.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-3.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-4.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-5.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-6.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-7.webp",
          "/images/products/coach-lana-shoulder-bag-19-women-polished-pebble-leather-brass-maple-8.webp"
        ],
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400
      }
    ]
  },
  {
    "slug": "coach-station-carryall-bag-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Station Carryall Bag",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "샤이니 스무스 가죽, 리사이클 폴리에스터 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 24900,
    "costKrw": 272799,
    "priceKrw": 349200,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "crinkle leather Black",
        "colorKo": "크링클 레더 블랙",
        "sku": "CET29-CRINKLE-LEATHER-GOLD-BLACK",
        "cardImage": "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-card.webp",
        "detailImages": [
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-2.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-3.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-4.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-5.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-6.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-7.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-8.webp",
          "/images/products/coach-station-carryall-bag-women-crinkle-leather-gold-black-9.webp"
        ],
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200
      },
      {
        "color": "signature canvas Tan Brown",
        "colorKo": "시그니처 캔버스 탄 브라운",
        "sku": "CET31-SIGNATURE-CANVAS-GOLD-TAN-BROWN",
        "cardImage": "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-card.webp",
        "detailImages": [
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-2.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-3.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-4.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-5.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-6.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-7.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-8.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-gold-tan-brown-9.webp"
        ],
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200
      },
      {
        "color": "signature canvas Black",
        "colorKo": "시그니처 캔버스 블랙",
        "sku": "CET31-SIGNATURE-CANVAS-GOLDWALNUT-BLACK",
        "cardImage": "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-card.webp",
        "detailImages": [
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-2.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-3.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-4.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-5.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-6.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-7.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-8.webp",
          "/images/products/coach-station-carryall-bag-women-signature-canvas-goldwalnut-black-9.webp"
        ],
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200
      }
    ]
  },
  {
    "slug": "coach-teri-mini-crossbody-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Teri Mini Crossbody",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "샤이니 스무스 가죽, 패브릭 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 22900,
    "costKrw": 251379,
    "priceKrw": 321800,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "CDP30-GOLD-BLACK",
        "cardImage": "/images/products/coach-teri-mini-crossbody-women-gold-black-card.webp",
        "detailImages": [
          "/images/products/coach-teri-mini-crossbody-women-gold-black.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-2.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-3.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-4.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-5.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-6.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-7.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-8.webp",
          "/images/products/coach-teri-mini-crossbody-women-gold-black-9.webp"
        ],
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800
      },
      {
        "color": "pebbled leather Black",
        "colorKo": "페블 레더 블랙",
        "sku": "CW309-PEBBLED-LEATHER-GOLD-BLACK",
        "cardImage": "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-card.webp",
        "detailImages": [
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-2.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-3.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-4.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-5.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-6.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-7.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-black-8.webp"
        ],
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800
      },
      {
        "color": "pebbled leather Maple",
        "colorKo": "페블 레더 메이플",
        "sku": "CW309-PEBBLED-LEATHER-GOLD-MAPLE",
        "cardImage": "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-card.webp",
        "detailImages": [
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-2.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-3.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-4.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-5.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-6.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-7.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-8.webp",
          "/images/products/coach-teri-mini-crossbody-women-pebbled-leather-gold-maple-9.webp"
        ],
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800
      },
      {
        "color": "signature canvas Walnut Black",
        "colorKo": "시그니처 캔버스 월넛 블랙",
        "sku": "CW323-SIGNATURE-CANVAS-GOLD-WALNUT-BLACK",
        "cardImage": "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-card.webp",
        "detailImages": [
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-2.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-3.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-4.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-5.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-6.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-7.webp",
          "/images/products/coach-teri-mini-crossbody-women-signature-canvas-gold-walnut-black-8.webp"
        ],
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800
      },
      {
        "color": "suede Warm Brown",
        "colorKo": "스웨이드 웜 브라운",
        "sku": "CFF98-SUEDE-GOLD-WARM-BROWN",
        "cardImage": "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-card.webp",
        "detailImages": [
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-2.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-3.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-4.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-5.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-6.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-7.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-8.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-9.webp",
          "/images/products/coach-teri-mini-crossbody-women-suede-gold-warm-brown-10.webp"
        ],
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800
      }
    ]
  },
  {
    "slug": "coach-teri-shoulder-bag-women",
    "brand": "Coach",
    "brandSlug": "coach",
    "name": "Teri Shoulder Bag",
    "gender": "women",
    "category": "bag",
    "originCountry": null,
    "material": "리파인드 페블 가죽, 리사이클 폴리에스터 안감",
    "care": null,
    "manufacturer": "Coach",
    "cadCents": 27900,
    "costKrw": 304929,
    "priceKrw": 390400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "pebbled leather Black",
        "colorKo": "페블 레더 블랙",
        "sku": "CV934-PEBBLED-LEATHER-GOLD-BLACK",
        "cardImage": "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-card.webp",
        "detailImages": [
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-2.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-3.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-4.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-5.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-6.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-7.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-8.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-black-9.webp"
        ],
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400
      },
      {
        "color": "pebbled leather Maple",
        "colorKo": "페블 레더 메이플",
        "sku": "CV934-PEBBLED-LEATHER-GOLD-MAPLE",
        "cardImage": "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-card.webp",
        "detailImages": [
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-2.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-3.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-4.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-5.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-6.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-7.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-8.webp",
          "/images/products/coach-teri-shoulder-bag-women-pebbled-leather-gold-maple-9.webp"
        ],
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400
      },
      {
        "color": "signature canvas Walnut Black",
        "colorKo": "시그니처 캔버스 월넛 블랙",
        "sku": "CV933-SIGNATURE-CANVAS-GOLD-WALNUT-BLACK",
        "cardImage": "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black-card.webp",
        "detailImages": [
          "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black.webp",
          "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black-2.webp",
          "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black-3.webp",
          "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black-4.webp",
          "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black-5.webp",
          "/images/products/coach-teri-shoulder-bag-women-signature-canvas-gold-walnut-black-6.webp"
        ],
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400
      },
      {
        "color": "suede Blush Pink",
        "colorKo": "스웨이드 블러쉬 핑크",
        "sku": "CFG06-SUEDE-GOLD-BLUSH-PINK",
        "cardImage": "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-card.webp",
        "detailImages": [
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-2.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-3.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-4.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-5.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-6.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-7.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-8.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-9.webp",
          "/images/products/coach-teri-shoulder-bag-women-suede-gold-blush-pink-10.webp"
        ],
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400
      }
    ]
  },
  {
    "slug": "polo-cable-knit-cotton-cardigan-men",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Cotton Cardigan",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Ralph Lauren",
    "cadCents": 22800,
    "costKrw": 250308,
    "priceKrw": 320400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Camel Melange",
        "colorKo": "카멜 멜란지",
        "sku": "100066198-CAMEL-MELANGE",
        "cardImage": "/images/products/polo-cable-knit-cotton-cardigan-men-camel-melange-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-cardigan-men-camel-melange.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-camel-melange-2.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-camel-melange-3.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-camel-melange-4.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-camel-melange-5.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "100066198-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather-5.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-fawn-grey-heather-6.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "100066198-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-cardigan-men-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-cardigan-men-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-cardigan-men-hunter-navy-5.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      }
    ]
  },
  {
    "slug": "polo-cable-knit-cotton-full-zip-sweater-men",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Cotton Full-Zip Sweater",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Ralph Lauren",
    "cadCents": 22800,
    "costKrw": 250308,
    "priceKrw": 320400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "634135-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-fawn-grey-heather-5.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "634135-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-full-zip-sweater-men-hunter-navy-5.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      }
    ]
  },
  {
    "slug": "polo-cable-knit-cotton-polo-sweater-men",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Cotton Polo Sweater",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": "100% 면",
    "care": "손세탁 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 19800,
    "costKrw": 218178,
    "priceKrw": 279300,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Andover Cream",
        "colorKo": "앤도버 크림",
        "sku": "650001-ANDOVER-CREAM",
        "cardImage": "/images/products/polo-cable-knit-cotton-polo-sweater-men-andover-cream-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-andover-cream.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-andover-cream-2.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-andover-cream-3.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-andover-cream-4.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-andover-cream-5.webp"
        ],
        "cadCents": 19800,
        "costKrw": 218178,
        "priceKrw": 279300
      },
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "650001-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-cotton-polo-sweater-men-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-fawn-grey-heather-5.webp"
        ],
        "cadCents": 19800,
        "costKrw": 218178,
        "priceKrw": 279300
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "650001-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-polo-sweater-men-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-hunter-navy-5.webp"
        ],
        "cadCents": 19800,
        "costKrw": 218178,
        "priceKrw": 279300
      },
      {
        "color": "Polo Black",
        "colorKo": "폴로 블랙",
        "sku": "650001-POLO-BLACK",
        "cardImage": "/images/products/polo-cable-knit-cotton-polo-sweater-men-polo-black-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-polo-black.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-polo-black-2.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-polo-black-3.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-polo-black-4.webp",
          "/images/products/polo-cable-knit-cotton-polo-sweater-men-polo-black-5.webp"
        ],
        "cadCents": 19800,
        "costKrw": 218178,
        "priceKrw": 279300
      }
    ]
  },
  {
    "slug": "polo-cable-knit-wool-cashmere-cardigan-men",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Wool-Cashmere Cardigan",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": "90% 울, 10% 캐시미어",
    "care": "손세탁 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 29800,
    "costKrw": 325278,
    "priceKrw": 416400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "100103776-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-fawn-grey-heather-5.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "Sea Salt Blue Heather",
        "colorKo": "씨솔트 블루 헤더",
        "sku": "100103776-SEA-SALT-BLUE-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather-5.webp",
          "/images/products/polo-cable-knit-wool-cashmere-cardigan-men-sea-salt-blue-heather-6.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      }
    ]
  },
  {
    "slug": "polo-cable-knit-wool-cashmere-sweater-men",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Wool-Cashmere Sweater",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": "90% 울, 10% 캐시미어",
    "care": "손세탁 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 26800,
    "costKrw": 293148,
    "priceKrw": 375300,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "100066187-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater-men-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-fawn-grey-heather-5.webp"
        ],
        "cadCents": 26800,
        "costKrw": 293148,
        "priceKrw": 375300
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "100066187-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater-men-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-hunter-navy.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-men-hunter-navy-5.webp"
        ],
        "cadCents": 26800,
        "costKrw": 293148,
        "priceKrw": 375300
      }
    ]
  },
  {
    "slug": "polo-cable-knit-wool-cashmere-sweater2-men",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Wool-Cashmere Sweater2",
    "gender": "men",
    "category": "top",
    "originCountry": null,
    "material": "90% 울, 10% 캐시미어",
    "care": "손세탁 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 22800,
    "costKrw": 250308,
    "priceKrw": 320400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Andover Cream",
        "colorKo": "앤도버 크림",
        "sku": "625239-ANDOVER-CREAM",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream-5.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-andover-cream-6.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Blue Borage Heather",
        "colorKo": "블루 보리지 헤더",
        "sku": "625239-BLUE-BORAGE-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-blue-borage-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-blue-borage-heather.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-blue-borage-heather-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-blue-borage-heather-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-blue-borage-heather-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-blue-borage-heather-5.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "625239-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather-5.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-fawn-grey-heather-6.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "625239-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-5.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-6.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-hunter-navy-7.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      },
      {
        "color": "Polo Black",
        "colorKo": "폴로 블랙",
        "sku": "625239-POLO-BLACK",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black-5.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater2-men-polo-black-6.webp"
        ],
        "cadCents": 22800,
        "costKrw": 250308,
        "priceKrw": 320400
      }
    ]
  },
  {
    "slug": "polo-cable-knit-cotton-crewneck-cardigan-women",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Cotton Crewneck Cardigan",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": "기계 세탁 가능 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 29800,
    "costKrw": 325278,
    "priceKrw": 416400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Carmel Pink",
        "colorKo": "카멜 핑크",
        "sku": "100045499-CARMEL-PINK",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink-5.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-carmel-pink-6.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "100045499-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-hunter-navy-5.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "New Litchfield Blue",
        "colorKo": "뉴 리치필드 블루",
        "sku": "100045499-NEW-LITCHFIELD-BLUE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue-5.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-new-litchfield-blue-6.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "Polo Black",
        "colorKo": "폴로 블랙",
        "sku": "100045499-POLO-BLACK",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-polo-black-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-polo-black.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-polo-black-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-polo-black-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-polo-black-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-polo-black-5.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "White",
        "colorKo": "화이트",
        "sku": "100045499-WHITE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-white-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-white.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-white-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-white-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-white-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-cardigan-women-white-5.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      }
    ]
  },
  {
    "slug": "polo-cable-knit-cotton-crewneck-sweater-women",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Cotton Crewneck Sweater",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": "100% 면",
    "care": "기계 세탁 가능 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 21800,
    "costKrw": 239598,
    "priceKrw": 306700,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Collection Camel Melange",
        "colorKo": "컬렉션 카멜 멜란지",
        "sku": "638616-COLLECTION-CAMEL-MELANGE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange-5.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-collection-camel-melange-6.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "Fawn Grey Heather",
        "colorKo": "폰 그레이 헤더",
        "sku": "638616-FAWN-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather-5.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-fawn-grey-heather-6.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "638616-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy-5.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-hunter-navy-6.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "New Litchfield Blue",
        "colorKo": "뉴 리치필드 블루",
        "sku": "638616-NEW-LITCHFIELD-BLUE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-new-litchfield-blue-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-new-litchfield-blue.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-new-litchfield-blue-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-new-litchfield-blue-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-new-litchfield-blue-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-new-litchfield-blue-5.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "Polo Black / White",
        "colorKo": "폴로 블랙 / 화이트",
        "sku": "638616-POLO-BLACKWHITE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-blackwhite-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-blackwhite.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-blackwhite-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-blackwhite-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-blackwhite-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-blackwhite-5.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "cream",
        "colorKo": "크림",
        "sku": "638616-CREAM",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream-5.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-cream-6.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "white",
        "colorKo": "화이트",
        "sku": "638616-WHITE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-white-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-white.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-white-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-white-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-white-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-white-5.webp"
        ],
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      }
    ]
  },
  {
    "slug": "polo-cable-knit-cotton-quarter-zip-sweater-women",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Cotton Quarter-Zip Sweater",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Ralph Lauren",
    "cadCents": 32800,
    "costKrw": 357408,
    "priceKrw": 457500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "POLO-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-5.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-6.webp"
        ],
        "cadCents": 32800,
        "costKrw": 357408,
        "priceKrw": 457500
      },
      {
        "color": "White",
        "colorKo": "화이트",
        "sku": "POLO-WHITE",
        "cardImage": "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-2.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-3.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-4.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-5.webp"
        ],
        "cadCents": 32800,
        "costKrw": 357408,
        "priceKrw": 457500
      }
    ]
  },
  {
    "slug": "polo-cable-knit-wool-cashmere-polo-sweater-women",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Wool-Cashmere Polo Sweater",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "Ralph Lauren",
    "cadCents": 39800,
    "costKrw": 432378,
    "priceKrw": 553500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Authentic Cream",
        "colorKo": "어센틱 크림",
        "sku": "100058394-AUTHENTIC-CREAM",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-authentic-cream-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-authentic-cream.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-authentic-cream-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-authentic-cream-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-authentic-cream-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-authentic-cream-5.webp"
        ],
        "cadCents": 39800,
        "costKrw": 432378,
        "priceKrw": 553500
      },
      {
        "color": "Collection Camel Melange",
        "colorKo": "컬렉션 카멜 멜란지",
        "sku": "100058394-COLLECTION-CAMEL-MELANG",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melang-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melang.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melang-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melang-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melang-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melang-5.webp"
        ],
        "cadCents": 39800,
        "costKrw": 432378,
        "priceKrw": 553500
      },
      {
        "color": "Flannel Grey Heather",
        "colorKo": "플란넬 그레이 헤더",
        "sku": "100058394-FLANNEL-GREY-HEATHER",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-flannel-grey-heather-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-flannel-grey-heather.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-flannel-grey-heather-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-flannel-grey-heather-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-flannel-grey-heather-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-flannel-grey-heather-5.webp"
        ],
        "cadCents": 39800,
        "costKrw": 432378,
        "priceKrw": 553500
      }
    ]
  },
  {
    "slug": "polo-cable-knit-wool-cashmere-sweater-women",
    "brand": "Polo Ralph Lauren",
    "brandSlug": "polo",
    "name": "Cable-Knit Wool-Cashmere Sweater",
    "gender": "women",
    "category": "top",
    "originCountry": null,
    "material": "80% 울, 20% 캐시미어 (장식 제외)",
    "care": "손세탁 또는 드라이클리닝.",
    "manufacturer": "Ralph Lauren",
    "cadCents": 29800,
    "costKrw": 325278,
    "priceKrw": 416400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Collection Camel Melange",
        "colorKo": "컬렉션 카멜 멜란지",
        "sku": "648895-COLLECTION-CAMEL-MELANGE",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange-5.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-collection-camel-melange-6.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "Hunter Navy",
        "colorKo": "헌터 네이비",
        "sku": "648895-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater-women-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-hunter-navy.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-hunter-navy-5.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      },
      {
        "color": "New Litchfield Blue",
        "colorKo": "뉴 리치필드 블루",
        "sku": "648895-NEW-LITCHFIELD-BLUE",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-sweater-women-new-litchfield-blue-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-new-litchfield-blue.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-new-litchfield-blue-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-new-litchfield-blue-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-new-litchfield-blue-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-sweater-women-new-litchfield-blue-5.webp"
        ],
        "cadCents": 29800,
        "costKrw": 325278,
        "priceKrw": 416400
      }
    ]
  },
  {
    "slug": "lululemon-extra-large-claw-hair-clip-women",
    "brand": "lululemon",
    "brandSlug": "lululemon",
    "name": "Extra Large Claw Hair Clip",
    "gender": "women",
    "category": "accessory",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "lululemon athletica",
    "cadCents": 2800,
    "costKrw": 36108,
    "priceKrw": 46300,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Flamingo Fun",
        "colorKo": "플라밍고 펀",
        "sku": "LULULEMON-FLAMINGO-FUN",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-flamingo-fun-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-flamingo-fun.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-flamingo-fun-2.webp"
        ],
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "French Press / Burnt Caramel",
        "colorKo": "프렌치 프레스 / 번트 카라멜",
        "sku": "LULULEMON-FRENCH-PRESSBURNT-CARAMEL",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-french-pressburnt-caramel-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-french-pressburnt-caramel.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-french-pressburnt-caramel-2.webp"
        ],
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "Light Ivory / Black",
        "colorKo": "라이트 아이보리 / 블랙",
        "sku": "LULULEMON-LIGHT-IVORY-BLACK",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-light-ivory-black-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-light-ivory-black.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-light-ivory-black-2.webp"
        ],
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "Light Ivory / White",
        "colorKo": "라이트 아이보리 / 화이트",
        "sku": "LULULEMON-LIGHT-IVORY-WHITE",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-light-ivory-white-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-light-ivory-white.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-light-ivory-white-2.webp"
        ],
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "Lilac Play / White",
        "colorKo": "릴락 플레이 / 화이트",
        "sku": "LULULEMON-LILACPLAY-WHITE",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-lilacplay-white-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-lilacplay-white.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-lilacplay-white-2.webp"
        ],
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "Sweet Sorbet / Pink Pearl",
        "colorKo": "스위트 소르베 / 핑크 펄",
        "sku": "LULULEMON-SWEET-SORBETPINK-PEARL",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-sweet-sorbetpink-pearl-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-sweet-sorbetpink-pearl.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-sweet-sorbetpink-pearl-2.webp"
        ],
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      }
    ]
  },
  {
    "slug": "lululemon-jumbo-claw-clip-women",
    "brand": "lululemon",
    "brandSlug": "lululemon",
    "name": "Jumbo Claw Clip",
    "gender": "women",
    "category": "accessory",
    "originCountry": null,
    "material": null,
    "care": null,
    "manufacturer": "lululemon athletica",
    "cadCents": 3000,
    "costKrw": 38250,
    "priceKrw": 49000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "ONE SIZE"
    ],
    "variants": [
      {
        "color": "Flamingo Fun",
        "colorKo": "플라밍고 펀",
        "sku": "LULULEMON-FLAMINGO-FUN",
        "cardImage": "/images/products/lululemon-jumbo-claw-clip-women-flamingo-fun-card.webp",
        "detailImages": [
          "/images/products/lululemon-jumbo-claw-clip-women-flamingo-fun.webp",
          "/images/products/lululemon-jumbo-claw-clip-women-flamingo-fun-2.webp"
        ],
        "cadCents": 3000,
        "costKrw": 38250,
        "priceKrw": 49000
      },
      {
        "color": "French Press / Burnt Caramel",
        "colorKo": "프렌치 프레스 / 번트 카라멜",
        "sku": "LULULEMON-FRENCH-PRESS-BURNT-CARAMEL",
        "cardImage": "/images/products/lululemon-jumbo-claw-clip-women-french-press-burnt-caramel-card.webp",
        "detailImages": [
          "/images/products/lululemon-jumbo-claw-clip-women-french-press-burnt-caramel.webp",
          "/images/products/lululemon-jumbo-claw-clip-women-french-press-burnt-caramel-2.webp"
        ],
        "cadCents": 3000,
        "costKrw": 38250,
        "priceKrw": 49000
      },
      {
        "color": "Light Ivory / Black",
        "colorKo": "라이트 아이보리 / 블랙",
        "sku": "LULULEMON-LIGHT-IVORY-BLACK",
        "cardImage": "/images/products/lululemon-jumbo-claw-clip-women-light-ivory-black-card.webp",
        "detailImages": [
          "/images/products/lululemon-jumbo-claw-clip-women-light-ivory-black.webp",
          "/images/products/lululemon-jumbo-claw-clip-women-light-ivory-black-2.webp"
        ],
        "cadCents": 3000,
        "costKrw": 38250,
        "priceKrw": 49000
      },
      {
        "color": "Light Ivory / White",
        "colorKo": "라이트 아이보리 / 화이트",
        "sku": "LULULEMON-LIGHT-IVORY-WHITE",
        "cardImage": "/images/products/lululemon-jumbo-claw-clip-women-light-ivory-white-card.webp",
        "detailImages": [
          "/images/products/lululemon-jumbo-claw-clip-women-light-ivory-white.webp",
          "/images/products/lululemon-jumbo-claw-clip-women-light-ivory-white-2.webp"
        ],
        "cadCents": 3000,
        "costKrw": 38250,
        "priceKrw": 49000
      },
      {
        "color": "Pink Parfait / Pink Peony",
        "colorKo": "핑크 파르페 / 핑크 피오니",
        "sku": "LULULEMON-PINK-PARFAIT-PINK-PEONY",
        "cardImage": "/images/products/lululemon-jumbo-claw-clip-women-pink-parfait-pink-peony-card.webp",
        "detailImages": [
          "/images/products/lululemon-jumbo-claw-clip-women-pink-parfait-pink-peony.webp",
          "/images/products/lululemon-jumbo-claw-clip-women-pink-parfait-pink-peony-2.webp"
        ],
        "cadCents": 3000,
        "costKrw": 38250,
        "priceKrw": 49000
      },
      {
        "color": "Sweet Sorbet / Pink Pearl",
        "colorKo": "스위트 소르베 / 핑크 펄",
        "sku": "LULULEMON-SWEET-SORBET-PINK-PEARL",
        "cardImage": "/images/products/lululemon-jumbo-claw-clip-women-sweet-sorbet-pink-pearl-card.webp",
        "detailImages": [
          "/images/products/lululemon-jumbo-claw-clip-women-sweet-sorbet-pink-pearl.webp",
          "/images/products/lululemon-jumbo-claw-clip-women-sweet-sorbet-pink-pearl-2.webp"
        ],
        "cadCents": 3000,
        "costKrw": 38250,
        "priceKrw": 49000
      }
    ]
  },
  {
    "slug": "lululemon-fast-and-free-trail-running-vest-men",
    "brand": "lululemon",
    "brandSlug": "lululemon",
    "name": "Fast and Free Trail Running Vest",
    "gender": "men",
    "category": "accessory",
    "originCountry": null,
    "material": "밑단 밴드: 78% 폴리아미드, 22% 엘라스테인, 포켓: 86% 폴리에스터 (리사이클), 14% 라이크라 엘라스테인, 안감: 52% 폴리에스터 (리사이클), 48% 엘라스토멀티에스터, 앞면 메시 패널: 82% 폴리에스터, 18% Xtra Life 라이크라 엘라스테인, 뒷면 메시 패널: 100% 폴리에스터 (리사이클), 뒷면 패브릭: 100% 나일론 (리사이클), 겉감: 100% 나일론",
    "care": "찬물 세탁 약하게, 표백 금지, 뉘어서 건조, 다림질 금지, 드라이클리닝 금지, 단독 세탁",
    "manufacturer": "lululemon athletica",
    "cadCents": 15800,
    "costKrw": 175338,
    "priceKrw": 224500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XS/S",
      "M/L",
      "XL/XXL"
    ],
    "variants": [
      {
        "color": "Sassy Sage / Cypress Forest",
        "colorKo": "새시 세이지 / 사이프러스 포레스트",
        "sku": "LULULEMON-SASSY-SAGE-CYPRESS-FOREST",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-sassy-sage-cypress-forest-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "black",
        "colorKo": "블랙",
        "sku": "LULULEMON-BLACK",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-black-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "blue",
        "colorKo": "블루",
        "sku": "LULULEMON-BLUE",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-blue-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      }
    ]
  },
  {
    "slug": "lululemon-fast-and-free-trail-running-vest-women",
    "brand": "lululemon",
    "brandSlug": "lululemon",
    "name": "Fast and Free Trail Running Vest",
    "gender": "women",
    "category": "accessory",
    "originCountry": null,
    "material": "앞면 메시 패널: 82% 폴리에스터, 18% Xtra Life 라이크라 엘라스테인, 겉감: 100% 나일론, 안감: 52% 폴리에스터 (리사이클), 48% 엘라스토멀티에스터, 밑단 밴드: 78% 폴리아미드, 22% 엘라스테인, 포켓: 86% 폴리에스터 (리사이클), 14% 라이크라 엘라스테인, 뒷면 패널: 100% 나일론 (리사이클), 뒷면 메시 패널: 100% 폴리에스터 (리사이클)",
    "care": "찬물 세탁, 표백 금지, 낮은 온도 건조기, 다림질 금지, 드라이클리닝 금지, 같은 색끼리 세탁",
    "manufacturer": "lululemon athletica",
    "cadCents": 15800,
    "costKrw": 175338,
    "priceKrw": 224500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "sizes": [
      "XXS/XS",
      "S/M",
      "L/XL"
    ],
    "variants": [
      {
        "color": "Candy Cloud",
        "colorKo": "캔디 클라우드",
        "sku": "LULULEMON-CANDY-CLOUD",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-candy-cloud-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "Foam Cloud",
        "colorKo": "폼 클라우드",
        "sku": "LULULEMON-FOAM-CLOUD",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-foam-cloud-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "Lilac Play",
        "colorKo": "릴락 플레이",
        "sku": "LULULEMON-LILAC-PLAY",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-lilac-play-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "Pink Flare",
        "colorKo": "핑크 플레어",
        "sku": "LULULEMON-PINK-FLARE",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-flare-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "Pink Pearl",
        "colorKo": "핑크 펄",
        "sku": "LULULEMON-PINK-PEARL",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-pink-pearl-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
      {
        "color": "black",
        "colorKo": "블랙",
        "sku": "LULULEMON-BLACK",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-women-black-7.webp"
        ],
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      }
    ]
  }
];

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}
