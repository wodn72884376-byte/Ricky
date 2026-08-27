/**
 * ⚠️ 생성 파일 — 직접 수정하지 말 것. `npm run catalog:import`로 재생성한다.
 *
 * 원본: 아크테릭스/ 폴더 + 가격표 비교.xlsx
 * 생성: 2026-08-27
 *
 * 주의 — 아직 채워야 하는 값:
 *   - originCountry: 전부 null이다. **실물 라벨을 보고** 채운다. 브랜드 국적으로 추정 금지.
 *     캐나다산이 아니면 CKFTA 관세 면제를 받을 수 없다 (PROJECT.md §3.3).
 *   - weightG: 배송비 산정에 필요하다. 실측하거나 공식몰 스펙에서 가져온다.
 */
export type CatalogVariant = {
  color: string;
  colorKo: string;
  sku: string;
  cardImage: string;
  detailImages: string[];
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
  cadCents: number;
  /** CAD × 1.05(GST) × 환율 */
  costKrw: number;
  priceKrw: number;
  /** 한국 정발가. 비교 표시용 */
  krRetailKrw: number | null;
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
    "cadCents": 90000,
    "costKrw": 945000,
    "priceKrw": 981000,
    "krRetailKrw": 1090000,
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
          "/images/products/arcteryx-alpha-jacket-men-graphite-black-hood.webp"
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
    "cadCents": 115000,
    "costKrw": 1207500,
    "priceKrw": 1305000,
    "krRetailKrw": 1450000,
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
          "/images/products/arcteryx-alpha-sv-jacket-men-24k-black-hood.webp"
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
    "cadCents": 38000,
    "costKrw": 399000,
    "priceKrw": 432000,
    "krRetailKrw": 480000,
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
          "/images/products/arcteryx-atom-hoody-men-black-hood.webp"
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
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
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
          "/images/products/arcteryx-atom-jacket-men-black-fabric-detail.webp"
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
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 945000,
    "krRetailKrw": 1050000,
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
          "/images/products/arcteryx-beta-ar-jacket-men-black-hood.webp"
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
          "/images/products/arcteryx-beta-ar-jacket-men-cloud-void-hood.webp"
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
    "cadCents": 52000,
    "costKrw": 546000,
    "priceKrw": 585000,
    "krRetailKrw": 650000,
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
          "/images/products/arcteryx-beta-jacket-men-black-hood.webp"
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
          "/images/products/arcteryx-beta-jacket-men-sea-salt-hood.webp"
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
          "/images/products/arcteryx-beta-jacket-men-headwaters-hood.webp"
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
    "cadCents": 64000,
    "costKrw": 672000,
    "priceKrw": 765000,
    "krRetailKrw": 850000,
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
          "/images/products/arcteryx-beta-sl-jacket-men-black-hood.webp"
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
          "/images/products/arcteryx-beta-sl-jacket-men-cloud-hood.webp"
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
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
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
          "/images/products/arcteryx-gamma-lightweight-hoody-men-black-hood.webp"
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
          "/images/products/arcteryx-gamma-lightweight-hoody-men-void-hood.webp"
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
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 405000,
    "krRetailKrw": 450000,
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
          "/images/products/arcteryx-proton-sl-hoody-men-black-hood.webp"
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
    "cadCents": 44000,
    "costKrw": 462000,
    "priceKrw": 513000,
    "krRetailKrw": 570000,
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
          "/images/products/arcteryx-serratus-hoody-men-void-cloud-hood.webp"
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
    "cadCents": 26000,
    "costKrw": 273000,
    "priceKrw": 279000,
    "krRetailKrw": 310000,
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
          "/images/products/arcteryx-squamish-hoody-men-black-hood.webp"
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
          "/images/products/arcteryx-squamish-hoody-men-habitat-hood.webp"
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
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 1031940,
    "krRetailKrw": 1146600,
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
          "/images/products/arcteryx-altira-cropped-jacket-women-black-hood.webp"
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
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
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
          "/images/products/arcteryx-atom-jacket-women-alpine-rose-fabric-detail.webp"
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
          "/images/products/arcteryx-atom-jacket-women-black-fabric-detail.webp"
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
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
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
          "/images/products/arcteryx-atom-sl-hoody-women-black-hood.webp"
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
          "/images/products/arcteryx-atom-sl-hoody-women-sea-salt-hover.webp"
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
          "/images/products/arcteryx-atom-sl-hoody-women-alpine-blue-hood.webp"
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
          "/images/products/arcteryx-atom-sl-hoody-women-arctic-silk-hood.webp"
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
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 945000,
    "krRetailKrw": 1050000,
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
          "/images/products/arcteryx-beta-ar-jacket-women-black-hood.webp"
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
    "cadCents": 44000,
    "costKrw": 462000,
    "priceKrw": 540540,
    "krRetailKrw": 600600,
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
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-black-hood.webp"
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
          "/images/products/arcteryx-clarkia-ar-insulated-hoody-women-lt-renegade-hood.webp"
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
    "cadCents": 50000,
    "costKrw": 525000,
    "priceKrw": 585000,
    "krRetailKrw": 650000,
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
    "cadCents": 38000,
    "costKrw": 399000,
    "priceKrw": 466830,
    "krRetailKrw": 518700,
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
          "/images/products/arcteryx-elec-insulated-jacket-women-black-fabric-detail.webp"
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
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
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
          "/images/products/arcteryx-gamma-lightweight-hoody-women-atmos-solitude-hood.webp"
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
          "/images/products/arcteryx-gamma-lightweight-hoody-women-black-hood.webp"
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
    "cadCents": 52000,
    "costKrw": 546000,
    "priceKrw": 567000,
    "krRetailKrw": 630000,
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
          "/images/products/arcteryx-gamma-mx-hoody-women-arctic-silk-hood.webp"
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
          "/images/products/arcteryx-gamma-mx-hoody-women-black-hood.webp"
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
    "cadCents": 64000,
    "costKrw": 672000,
    "priceKrw": 711000,
    "krRetailKrw": 790000,
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
          "/images/products/arcteryx-naya-cropped-jacket-women-black-hood.webp"
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
    "cadCents": 30000,
    "costKrw": 315000,
    "priceKrw": 359100,
    "krRetailKrw": 399000,
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
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-black-hood.webp"
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
          "/images/products/arcteryx-naya-cropped-stowhood-jacket-women-habitat-hood.webp"
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
    "cadCents": 90000,
    "costKrw": 945000,
    "priceKrw": 1105650,
    "krRetailKrw": 1228500,
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
          "/images/products/arcteryx-sentinel-jacket-women-black-hood.webp"
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
    "cadCents": 26000,
    "costKrw": 273000,
    "priceKrw": 279000,
    "krRetailKrw": 310000,
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
          "/images/products/arcteryx-squamish-hoody-women-black-hood.webp"
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
          "/images/products/arcteryx-squamish-hoody-women-mongoose-hood.webp"
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
          "/images/products/arcteryx-squamish-hoody-women-alpine-blue-hood.webp"
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
          "/images/products/arcteryx-squamish-hoody-women-arctic-silk-sea-salt-hood.webp"
        ]
      }
    ]
  }
];

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}
