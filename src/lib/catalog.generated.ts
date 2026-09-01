/**
 * ⚠️ 생성 파일 — 직접 수정하지 말 것. `npm run catalog:import`로 재생성한다.
 *
 * 원본: 아크테릭스/(+가격표 비교.xlsx) · 코치/ · 폴로/ · 룰루레몬/
 * 생성: 2026-09-01
 *
 * 아직 채워야 하는 값:
 *   - originCountry: 전부 null이다. **실물 라벨을 보고** 채운다. 브랜드 국적으로 추정 금지.
 *     캐나다산이 아니면 CKFTA 관세 면제를 받을 수 없다 (PROJECT.md §3.3).
 *   - weightG: 배송비 산정에 필요하다. 실측하거나 공식몰 스펙에서 가져온다.
 *   - krRetailKrw: 아크테릭스만 있다. 나머지는 한국 정발가 확인 후 채운다.
 *   - shippingKrw: 전부 null이다. 관리자 상품 등록 화면에서 상품마다 입력한다.
 *   - smartstoreUrl: scripts/smartstore-urls.json 에 채운다. 없으면 구매 버튼 대신 안내가 뜬다.
 *     색상마다 스토어 상품을 따로 등록했으면 byColor 로 적는다 — 그러면 고객이 색을 다시 안 고른다.
 */

export type CatalogVariant = {
  color: string;
  colorKo: string;
  sku: string;
  cardImage: string;
  detailImages: string[];
  /**
   * 이 색상의 공식몰 페이지. 색상마다 PDP 가 다른 브랜드(캐나다구스)에서만 채워진다.
   * null 이면 상품 단위 officialUrl 로 떨어진다 — 그 판단은 읽는 쪽이 한다.
   */
  officialUrl: string | null;
  /**
   * 이 색상만의 스마트스토어 상품 페이지. 색상마다 상품을 따로 등록했을 때 채워진다.
   * 있으면 고객이 우리 화면에서 고른 색을 스마트스토어에서 다시 고르지 않아도 된다.
   * null 이면 상품 단위 smartstoreUrl 로 떨어진다 — 그 판단은 읽는 쪽이 한다.
   */
  smartstoreUrl: string | null;
  /** 색상마다 값이 다른 경우에만 있다 (코치 — 소재가 다르면 가격이 다르다) */
  cadCents?: number;
  costKrw?: number;
  priceKrw?: number;
  /**
   * 상품 상세에 그대로 띄우는 스펙. 공식몰 표기를 옮긴 것이고 지어낸 값이 아니다.
   * 코치만 있다 — 다른 브랜드는 원본에 이만한 구조가 없다.
   */
  specs?: { label: string; values: string[] }[];
};

export type CatalogProduct = {
  slug: string;
  brand: string;
  brandSlug: string;
  name: string;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  category: string;
  /** 실물 라벨 기준. 미확인이면 null */
  originCountry: string | null;
  /** 공식몰 표기 무게(g). 없으면 카테고리 추정값을 쓴다 (weightGOf) */
  weightG?: number | null;
  /**
   * 공식몰 상품 상세. 아크테릭스만 있다 — 다른 브랜드는 원본에 이만한 구조가 없다.
   * 값(영문 스펙 문장)은 제조사 표기 그대로다. 라벨만 한국어로 옮겼다.
   */
  details?: {
    description: string | null;
    productTip: string | null;
    fit: { label: string; text: string | null } | null;
    groups: { label: string; values: string[] }[];
    sourceUrl: string | null;
  } | null;
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
  /**
   * 이 상품의 브랜드 공식몰 페이지. 브랜드 홈이 아니라 상품 페이지다.
   * 없으면 null — 브랜드 홈 주소로 대신 채우지 않는다.
   */
  officialUrl: string | null;
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
    "originCountry": "VN",
    "material": "겉감: 20D Hadron™ - 3L GORE-TEX® PRO, 78gsm, FC0 DWR - 나일론 94%, 폴리아릴레이트 6% + ePE·PU 멤브레인, 이면 나일론 100% / 배색: 50D Hadron™- 3L GORE-TEX® PRO ePE, 99 gsm, FC0 DWR - 나일론 94%, 폴리아릴레이트 6% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 358,
    "details": {
      "description": "알파 재킷은 1g도 아쉬운 빠르고 기술적인 등반을 위해 만들었어요. 그러면서도 믿을 만한 알파인 보호막이라는 조건은 양보하지 않았고요. GORE-TEX PRO ePE에 50D Hadron™ 겉감을 더해 방수·투습과 마모 저항 사이의 균형을 잡았고, 거친 지형과 변하는 날씨에서 매일 입기에 알맞아요. 하네스와 함께 쓸 수 있는 구조와 정교한 입체 패턴으로, 어떤 날씨에서도 오를 수 있게 만든 재킷이에요.\n\n더 두꺼운 옵션이 필요하다면 Alpha SV Jacket를 보세요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "PFAS를 의도적으로 넣지 않은 GORE-TEX® PRO ePE 원단이 가볍고 튼튼하게 방수·방풍·투습으로 보호해요",
            "아크테릭스 자체 개발 Hadron™ 겉감이 초경량 성능과 알파인에서 검증된 내구성을 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "소매단의 조절되는 Velcro® 여밈"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 78cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "벙어리장갑이나 장갑을 낀 채로 쓰기 쉬운 Cohaesive™ 밑단 조절 장치"
          ]
        },
        {
          "label": "후드",
          "values": [
            "조절되는 StormHood™"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 지퍼 보안 포켓",
            "안쪽 덤프 포켓 1개",
            "지퍼 가슴 포켓은 하네스와 배낭을 멘 채로도 꺼내기 쉬워요",
            "하네스와 함께 쓸 수 있는 가슴 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "PFAS(과불화화합물) 규제 준수",
            "원액 염색 겉면"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/alpha-jacket-0932"
    },
    "cadCents": 90000,
    "costKrw": 945000,
    "priceKrw": 981000,
    "krRetailKrw": 1090000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/alpha-jacket-0932",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      }
    ]
  },
  {
    "slug": "arcteryx-alpha-sl-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Alpha SL Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CN",
    "material": "겉감: 20D Hadron™ - 3L GORE-TEX® PRO, 78gsm, FC0 DWR - 나일론 94%, 폴리아릴레이트 6% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 232,
    "details": {
      "description": "알파 SL 재킷은 가장 혹독한 알파인 조건 앞에서도 내구성과 투습, 방수를 내주면서, 기술 등반과 긴 산행에 들고 가는 일을 한 번도 망설이지 않을 만큼 가볍고 작게 접혀요. 군더더기 없이 기능만 남겼고, 지금까지 만든 GORE-TEX PRO 셸 중 가장 가벼워요.\n\n무엇이 달라졌나: GORE-TEX PRO ePE에 자체 개발한 Hadron™ 겉감을 20D 초경량으로 올려, PFAS를 의도적으로 넣지 않으면서 방수·투습 성능은 가장 높였어요. 완전히 조절되는 헬멧 호환 StormHood™는 위와 옆 시야를 가리지 않고 딱 맞게 잡히고, 납작한 RECCO® 리플렉터를 더해 조난 시 수색 가능성을 높였어요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "경량",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "PFAS를 의도적으로 넣지 않은 GORE-TEX® PRO ePE 원단이 가볍고 튼튼하게 방수·방풍·투습으로 보호해요",
            "아크테릭스 자체 개발 Hadron™ 겉감이 초경량 성능과 알파인에서 검증된 내구성을 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "소매단의 조절되는 Velcro® 여밈"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 78cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "로고와 라벨",
          "values": [
            "가슴에 Arc'teryx 버드·워드 로고"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "라미네이트 지퍼 가슴 포켓"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "PFAS(과불화화합물) 규제 준수",
            "원액 염색 겉면"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/alpha-sl-jacket-0287"
    },
    "cadCents": 44800,
    "costKrw": 485928,
    "priceKrw": 622000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/alpha-sl-jacket-0287",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Arctic Silk Black",
        "colorKo": "아틱 실크 블랙",
        "sku": "X000010287-ARCTIC-SILK-BLACK",
        "cardImage": "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-back-view.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-fabric-detail.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-full-body.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-hood.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-hover.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-arctic-silk-black-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Euphoria Black",
        "colorKo": "Euphoria Black",
        "sku": "X000010287-EUPHORIA-BLACK",
        "cardImage": "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-back-view.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-fabric-detail.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-full-body.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-hood.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-hover.webp",
          "/images/products/arcteryx-alpha-sl-jacket-men-euphoria-black-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      }
    ]
  },
  {
    "slug": "arcteryx-alpha-sv-jacket-outlet-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Alpha SV Jacket (아울렛)",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": "겉감: 100d 3L GORE-TEX® PRO ePE, 리사이클 평직, 135 gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 492,
    "details": {
      "description": "산이 이빨을 드러낼 때 필요한 셸이에요. 알파 SV 재킷은 끝없이 혹독한 조건과 긴 등반, 세계에서 가장 거친 알파인 지형에서의 오랜 노출을 견디도록 만들었어요. 두툼한 100D GORE-TEX PRO ePE로 만들어 흔들림 없는 방수·투습 성능과 믿을 만한 보호를 주고, 산이 최악일 때도 계속 오를 수 있게 해요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "PFAS를 의도적으로 넣지 않은 GORE-TEX® PRO ePE 원단이 가볍고 튼튼하게 방수·방풍·투습으로 보호해요",
            "GORE 나일론 겉감은 방풍이고 리사이클 소재로 만들었으며, 원정에 쓸 만한 내구성을 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "소매단의 조절되는 Velcro® 여밈"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): M 사이즈 78cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "Cohaesive 밑단 조절 장치는 장갑을 낀 채 쓸 수 있고, 하네스 스토퍼 역할도 해서 재킷을 깔끔하게 고정해요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 덤프 포켓 2개",
            "WaterTight™ 지퍼와 RS™ 슬라이더가 달린 왼팔 포켓 1개",
            "안쪽 지퍼 보안 포켓",
            "방수 지퍼가 달린 하네스 호환 가슴 포켓 2개로, 등반 중에도 필요한 물건을 가까이 두고 꺼낼 수 있어요"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "겉감 — bluepass 소재, 원액 염색 이면, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요",
            "모든 지퍼가 WaterTight™이고 RS™ 슬라이더가 달려 부드럽게 여닫혀요"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/alpha-sv-jacket-9989"
    },
    "cadCents": 69000,
    "costKrw": 745110,
    "priceKrw": 953800,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/alpha-sv-jacket-9989",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Mantis Black",
        "colorKo": "Mantis Black",
        "sku": "X000009989-MANTIS-BLACK",
        "cardImage": "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black.webp",
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-back-view.webp",
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-fabric-detail.webp",
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-full-body.webp",
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-hood.webp",
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-hover.webp",
          "/images/products/arcteryx-alpha-sv-jacket-outlet-men-mantis-black-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "CN",
    "material": "겉감: 100d 3L GORE-TEX® PRO ePE, 리사이클 평직, 135 gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 492,
    "details": {
      "description": "산이 이빨을 드러낼 때 필요한 셸이에요. 알파 SV 재킷은 끝없이 혹독한 조건과 긴 등반, 세계에서 가장 거친 알파인 지형에서의 오랜 노출을 견디도록 만들었어요. 두툼한 100D GORE-TEX PRO ePE로 만들어 흔들림 없는 방수·투습 성능과 믿을 만한 보호를 주고, 산이 최악일 때도 계속 오를 수 있게 해요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "PFAS를 의도적으로 넣지 않은 GORE-TEX® PRO ePE 원단이 가볍고 튼튼하게 방수·방풍·투습으로 보호해요",
            "GORE 나일론 겉감은 방풍이고 리사이클 소재로 만들었으며, 원정에 쓸 만한 내구성을 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "소매단의 조절되는 Velcro® 여밈"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): M 사이즈 78cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "Cohaesive 밑단 조절 장치는 장갑을 낀 채 쓸 수 있고, 하네스 스토퍼 역할도 해서 재킷을 깔끔하게 고정해요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 덤프 포켓 2개",
            "WaterTight™ 지퍼와 RS™ 슬라이더가 달린 왼팔 포켓 1개",
            "안쪽 지퍼 보안 포켓",
            "방수 지퍼가 달린 하네스 호환 가슴 포켓 2개로, 등반 중에도 필요한 물건을 가까이 두고 꺼낼 수 있어요"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "겉감 — bluepass 소재, 원액 염색 이면, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요",
            "모든 지퍼가 WaterTight™이고 RS™ 슬라이더가 달려 부드럽게 여닫혀요"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/alpha-sv-jacket-9899"
    },
    "cadCents": 115000,
    "costKrw": 1207500,
    "priceKrw": 1305000,
    "krRetailKrw": 1450000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/alpha-sv-jacket-9899",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "배색: 환편 니트 플리스, 215 gsm, FC0 DWR - 폴리에스터 93%, 엘라스테인 7% / 겉감: 20dx20d 나일론 립스톱, FC0 DWR, 45gsm - 나일론 100% / 충전재(합성): Coreloft™ 60 (60 g/m²) - 폴리에스터 100% / 안감: 20d 리사이클 나일론 립스톱 · FC0 DWR, 40gsm - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 약하게·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기, 비틀어 짜기 금지",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 355,
    "details": {
      "description": "아톰 후디는 \"어떤 재킷을 입지?\" 하는 고민의 답이에요. 바람 부는 능선을 지나는 쌀쌀한 숲길 하이킹, 암장에서의 클라이밍, 캠프사이트에서 단독으로 입어도 좋고, 투어링이나 습한 겨울 산행에서 미드레이어로도 좋아요. Coreloft 신슐레이션은 가벼운 날씨 변화에도 온기를 지켜서, 활동량이 많은 날에는 사계절 내내 다운보다 나은 선택이에요.\n\n더 두꺼운 옵션이 필요하다면 Atom SV Hoody를 보세요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "경량",
            "압축·수납 가능",
            "바람 저항",
            "다용도"
          ]
        },
        {
          "label": "구조",
          "values": [
            "신축 플리스 옆판이 통기를 도와요",
            "탄력 있는 Coreloft™ Compact 60 충전재는 통기되고 따뜻하며 가볍고, 젖어도 성능을 유지하면서 눌려도 부피가 되살아나요",
            "가볍고 부드러운 Tyono™ 20이 공기를 통과시켜요",
            "통기되는 20D 리사이클 나일론 안감이 체온을 조절하고 살갗에 부드럽게 닿아요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 니트 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "몸에 붙는 핏에 입체 패턴을 넣어 움직임과 편안함을 함께 잡았어요",
            "총장(뒤 중심 기준): M 사이즈 73cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "튼튼하게 박은 밑단과 양쪽 조절 장치로 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "형태를 잡은 미니 챙이 달린, 조절되는 얇은 충전재 StormHood™"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼를 감춘 핸드 포켓 2개",
            "안쪽 지퍼 가슴 포켓"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "충전재 — bluepass 소재, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "안감 — bluepass 소재, FC0 DWR 발수, 리사이클 소재",
            "배색 — FC0 DWR 발수, 리사이클 소재",
            "겉감 — FC0 DWR 발수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "No Slip Zip™ 앞지퍼",
            "전용 TPU 지퍼 풀은 잡기 쉽고 장갑을 낀 채로도 쓸 수 있어요"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/atom-hoody-9556"
    },
    "cadCents": 38000,
    "costKrw": 399000,
    "priceKrw": 432000,
    "krRetailKrw": 480000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/atom-hoody-9556",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "배색: 환편 니트 플리스, 215 gsm, FC0 DWR - 폴리에스터 93%, 엘라스테인 7% / 겉감: 20dx20d 나일론 립스톱, FC0 DWR, 45gsm - 나일론 100% / 충전재(합성): Coreloft™ 60 (60 g/m²) - 폴리에스터 100% / 안감: 20d 리사이클 나일론 립스톱 · FC0 DWR, 40gsm - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 약하게·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기, 비틀어 짜기 금지",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 335,
    "details": {
      "description": "아톰 후디에서 좋아할 만한 건 그대로 두고 후드만 뺐어요. 아톰 재킷은 활동량 많은 여러 상황을 하나로 감당하는 레이어예요. 바람 부는 능선을 지나는 쌀쌀한 숲길 하이킹, 암장에서의 클라이밍, 캠프사이트에서는 단독으로, 투어링이나 습한 겨울 산행에서는 미드레이어로 입어요. Coreloft 신슐레이션은 가벼운 날씨 변화에도 온기를 지켜서, 활동량이 많은 날에는 사계절 내내 다운보다 나은 선택이에요.\n\n더 두꺼운 옵션이 필요하다면 Atom SV Jacket를 보세요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "무게 대비 보온성 우수",
            "경량",
            "압축·수납 가능",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "신축 플리스 옆판이 통기를 도와요",
            "탄력 있는 Coreloft™ Compact 60 충전재는 통기되고 따뜻하며 가볍고, 젖어도 성능을 유지하면서 눌려도 부피가 되살아나요",
            "가볍고 부드러운 Tyono™ 20이 공기를 통과시켜요",
            "통기되는 20D 리사이클 나일론 안감이 체온을 조절하고 살갗에 부드럽게 닿아요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 니트 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "몸에 붙는 핏에 입체 패턴을 넣어 움직임과 편안함을 함께 잡았어요",
            "총장(뒤 중심 기준): M 사이즈 73cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼를 감춘 핸드 포켓 2개",
            "안쪽 지퍼 가슴 포켓"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "충전재 — bluepass 소재, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "안감 — bluepass 소재, FC0 DWR 발수, 리사이클 소재",
            "배색 — FC0 DWR 발수, 리사이클 소재",
            "겉감 — FC0 DWR 발수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "No Slip Zip™ 앞지퍼",
            "전용 TPU 지퍼 풀은 잡기 쉽고 장갑을 낀 채로도 쓸 수 있어요"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/atom-jacket-9561"
    },
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/atom-jacket-9561",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "겉감: 100d 3L GORE-TEX® PRO ePE, 리사이클 평직, 135 gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 460,
    "details": {
      "description": "매서운 겨울 하이킹부터 쾌청한 백컨트리까지, 베타 AR 재킷이 감당해요. 어떤 산행에서도 먼저 집게 되는 하드셸로, 하이브리드 구조가 눈과 진눈깨비, 정상의 강한 바람을 버텨요. 어깨 요크와 팔에는 아주 튼튼한 GORE-TEX PRO ePE가 마모를 막고, 몸판에는 더 가벼운 원단을 써서 무게와 부피를 줄였어요. 필요한 자리에 필요한 성능을 넣은 재킷이에요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "ePE 멤브레인을 쓴 GORE-TEX®는 방수·투습이고 PFAS를 의도적으로 넣지 않았어요",
            "몸판에 통기·방수·방풍 GORE-TEX® PRO ePE를 써서 가볍게 보호해요",
            "요크와 팔 윗부분의 GORE-TEX® PRO ePE가 마모를 견디고 비바람을 통기되게 막아 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "장갑을 낀 채 쓸 수 있는 Velcro 소매 조절 장치가 소매를 고정해요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유로워요",
            "총장(뒤 중심 기준): M 사이즈 77cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 DropHood™",
            "후드가 머리를 완전히 덮고, 정밀 조절 장치로 주변 시야를 가리지 않으면서 맞춤새를 높여요",
            "후드 안쪽 코드록으로 조절해요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 가슴 포켓",
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요",
            "후드 챙에 넣은 RECCO® 리플렉터가 수색 가능성을 높여요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "원액 염색"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/beta-ar-jacket-1062"
    },
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 945000,
    "krRetailKrw": 1050000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/beta-ar-jacket-1062",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Olive Moss Euphoria",
        "colorKo": "Olive Moss Euphoria",
        "sku": "X000009906-OLIVE-MOSS-EUPHORIA",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria-full-body.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-olive-moss-euphoria-side-view.webp"
        ],
        "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-ar-jacket-9906",
        "smartstoreUrl": null,
        "cadCents": 42000,
        "costKrw": 455940,
        "priceKrw": 583700
      },
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Fluidity Vitality",
        "colorKo": "Fluidity Vitality",
        "sku": "X000009906-FLUIDITY-VITALITY",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-fabric-detail.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-full-body.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-fluidity-vitality-side-view.webp"
        ],
        "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-ar-jacket-9906",
        "smartstoreUrl": null,
        "cadCents": 58800,
        "costKrw": 635868,
        "priceKrw": 814000
      },
      {
        "color": "Mantis Tatsu",
        "colorKo": "Mantis Tatsu",
        "sku": "X000009906-MANTIS-TATSU",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-fabric-detail.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-full-body.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-mantis-tatsu-side-view.webp"
        ],
        "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-ar-jacket-9906",
        "smartstoreUrl": null,
        "cadCents": 58800,
        "costKrw": 635868,
        "priceKrw": 814000
      },
      {
        "color": "Stone Red Dk Stone",
        "colorKo": "Stone Red Dk Stone",
        "sku": "X000009906-STONE-RED-DK-STONE",
        "cardImage": "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-back-view.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-fabric-detail.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-full-body.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-hood.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-hover.webp",
          "/images/products/arcteryx-beta-ar-jacket-men-stone-red-dk-stone-side-view.webp"
        ],
        "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-ar-jacket-9906",
        "smartstoreUrl": null,
        "cadCents": 58800,
        "costKrw": 635868,
        "priceKrw": 814000
      }
    ]
  },
  {
    "slug": "arcteryx-beta-insulated-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Beta Insulated Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": "충전재(합성): Coreloft™ Continuous 90 (90 g/m²) - 폴리에스터 100% / 안감: 20d 나일론 평직 - 나일론 100% / 겉감: 40D x 70D 2L GORE-TEX® ePE, 리사이클 나일론 평직, 77gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 퍼머넌트 프레스·낮은 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 드럼 세탁기 권장, 통돌이 세탁기는 세탁망 사용",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 640,
    "details": {
      "description": "알파인을 만나는 방법은 여러 가지예요. 베타 라인은 다재다능함과 내구성, 날씨 대응을 위해 만들어져 산이 내주는 것을 마음껏 겪게 해 줘요. Coreloft™ Continuous 충전재와 더 지속가능한 방수·투습 40D GORE-TEX 원단을 써서, 충전재를 넣은 베타는 추운 날을 위한 재킷이에요. 헬멧과 함께 쓸 수 있는 StormHood™는 옆 시야를 최대한 열어 주도록 조절되고, 겨드랑이 지퍼로 열을 빼며, 안에 넣은 RECCO™ 리플렉터가 수색·구조를 도와요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "따뜻하고 복원력 좋은 Coreloft™ 합성 충전재가 보온을 주고 부피감을 유지해요",
            "PFAS를 넣지 않은 2L GORE-TEX®에 리사이클 나일론 겉감을 더해, 몸판과 소매를 부위별로 날씨에서 지켜요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "다이컷 Velcro® 소매 조절 탭이 부피를 줄이고, 어디에 걸리거나 뜯어지지 않아요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 79cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "양쪽 밑단 조절 장치"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "로고와 라벨",
          "values": [
            "자수 로고"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "WaterTight™ 지퍼 핸드 포켓 2개",
            "참고: WaterTight™ 지퍼는 물에 아주 강하지만 완전 방수는 아니에요. 물기에 상할 물건은 포켓에 넣지 않기를 권해요",
            "안쪽 덤프 포켓 1개",
            "안쪽 지퍼 보안 포켓"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "감춘 RECCO® 리플렉터"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "완전히 분리되는 양방향 앞지퍼",
            "겨드랑이 지퍼로 열을 쉽게 빼요"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-insulated-jacket-0510"
    },
    "cadCents": 63000,
    "costKrw": 680850,
    "priceKrw": 871500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-insulated-jacket-0510",
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
        "sku": "X000010510-BLACK",
        "cardImage": "/images/products/arcteryx-beta-insulated-jacket-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-insulated-jacket-men-black.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-black-back-view.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-black-full-body.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-black-hood.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-black-hover.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-black-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Blaze",
        "colorKo": "Blaze",
        "sku": "X000010510-BLAZE",
        "cardImage": "/images/products/arcteryx-beta-insulated-jacket-men-blaze-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-insulated-jacket-men-blaze.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-blaze-back-view.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-blaze-full-body.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-blaze-hood.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-blaze-hover.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-blaze-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Mars",
        "colorKo": "Mars",
        "sku": "X000010510-MARS",
        "cardImage": "/images/products/arcteryx-beta-insulated-jacket-men-mars-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-insulated-jacket-men-mars.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-mars-back-view.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-mars-full-body.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-mars-hood.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-mars-hover.webp",
          "/images/products/arcteryx-beta-insulated-jacket-men-mars-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "ID",
    "material": "배색: 3L 80d GORE-TEX® ePE, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 겉감: 80d 3L GORE-TEX® ePE · C-KNIT™ 이면, 평직 리사이클 나일론, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 375,
    "details": {
      "description": "아크테릭스 GORE-TEX 셸 중 가장 두루 쓰이는 제품이에요. 튼튼한 80D 겉감과, 가볍고 강하며 PFAS를 의도적으로 넣지 않은 GORE‑TEX ePE(팽창 폴리에틸렌) 멤브레인으로 만들어, 탄소 발자국을 줄이면서 오래가는 방수·방풍·투습을 줘요. C-KNIT 이면 처리가 착용감을 높이고, 낮게 붙는 StormHood는 한 번 당기면 조절돼 머리를 덮으면서 시야를 지켜요. 입체 패턴이 움직임을 막지 않고, 안에 넣은 RECCO 리플렉터가 조난 수색에 도움이 돼요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "경량",
            "내구성",
            "다용도"
          ]
        },
        {
          "label": "구조",
          "values": [
            "GORE C-KNIT™ 이면 기술로 가볍고 부드러우며 편안해요",
            "PFC를 쓰지 않은 GORE-TEX® ePE 멤브레인이 통기되게 날씨를 막고, 식물에서 뽑은 섬유로 만든 바이오 기반 나일론 겉감에 접합했어요",
            "오래 쓰고 PFC를 쓰지 않으며 탄소 발자국을 줄인 GORE-TEX® 원단으로 만들었어요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유로워요",
            "총장(뒤 중심 기준): M 사이즈 77cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0-DWR(내구성 발수) 처리로 물기를 튕겨 내요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "양쪽 밑단 조절 장치"
          ]
        },
        {
          "label": "후드",
          "values": [
            "얇게 마감한 조절식 StormHood™",
            "한 번 당기는 조절 장치가 시야를 막지 않아요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "핸드 포켓 2개",
            "안쪽 라미네이트 지퍼 포켓"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "원액 염색"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "턱 보호대가 달린 WaterTight™ Vislon 앞지퍼"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868"
    },
    "cadCents": 52000,
    "costKrw": 546000,
    "priceKrw": 585000,
    "krRetailKrw": 650000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Headwaters",
        "colorKo": "헤드워터스",
        "sku": "X000010511-HEADWATERS",
        "cardImage": "/images/products/arcteryx-beta-jacket-men-headwaters-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-jacket-men-headwaters.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-back-view.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-full-body.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-hood.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-hover.webp",
          "/images/products/arcteryx-beta-jacket-men-headwaters-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      }
    ]
  },
  {
    "slug": "arcteryx-beta-sl-jacket-outlet-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Beta SL Jacket (아울렛)",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "VN",
    "material": "배색: 40dx70d 3L GORE-TEX® ePE, 리사이클 나일론 평직, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 겉감: 40dx70d 3L GORE-TEX® ePE · C-KNIT™ 이면, 평직 리사이클 나일론, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 340,
    "details": {
      "description": "베타 SL 재킷은 베타 중 가장 가벼우면서, 산에서 실제로 벌어지는 일을 염두에 두고 만들었어요. 두루 쓰이도록 설계해 가볍게 접히는 성질을 잃지 않으면서 방수·방풍·투습을 온전히 갖췄고요. GORE-TEX ePE 멤브레인은 가볍고 강하며 PFC를 쓰지 않았어요. C-KNIT 이면 처리가 착용감과 통기를 높이고, 헬멧 위로 쓰는 StormHood는 시야를 가리지 않으면서 머리를 덮어요. 겨드랑이 지퍼로 열을 빼고, RECCO 리플렉터가 조난 수색에 도움이 돼요.\n\n더 두꺼운 옵션이 필요하다면 Beta Jacket를 보세요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성",
            "다용도"
          ]
        },
        {
          "label": "구조",
          "values": [
            "GORE C-KNIT™ 이면 기술로 가볍고 부드러우며 편안해요",
            "PFC를 쓰지 않은 GORE-TEX® ePE 멤브레인이 통기되게 날씨를 막고, 식물에서 뽑은 섬유로 만든 바이오 기반 나일론 겉감에 접합했어요",
            "오래 쓰고 PFC를 쓰지 않으며 탄소 발자국을 줄인 GORE-TEX® 원단으로 만들었어요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "Velcro® 여밈으로 조절되는 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 75cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0-DWR(내구성 발수) 처리로 물기를 튕겨 내요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 가슴 포켓",
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요",
            "앞면 전체 지퍼"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-sl-jacket-0553"
    },
    "cadCents": 44800,
    "costKrw": 485928,
    "priceKrw": 622000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/beta-sl-jacket-0553",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Habitat Forage",
        "colorKo": "해비탯 Forage",
        "sku": "X000010553-HABITAT-FORAGE",
        "cardImage": "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-back-view.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-fabric-detail.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-full-body.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-hood.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-hover.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-habitat-forage-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Mantis Tatsu",
        "colorKo": "Mantis Tatsu",
        "sku": "X000010553-MANTIS-TATSU",
        "cardImage": "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu-back-view.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu-full-body.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu-hood.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu-hover.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-mantis-tatsu-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Stone Red",
        "colorKo": "Stone Red",
        "sku": "X000010553-STONE-RED",
        "cardImage": "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-back-view.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-fabric-detail.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-full-body.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-hood.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-hover.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-stone-red-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Vitality II",
        "colorKo": "Vitality II",
        "sku": "X000010553-VITALITY-II",
        "cardImage": "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii-card.webp",
        "detailImages": [
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii-back-view.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii-full-body.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii-hood.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii-hover.webp",
          "/images/products/arcteryx-beta-sl-jacket-outlet-men-vitality-ii-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "배색: 40dx70d 3L GORE-TEX® ePE, 리사이클 나일론 평직, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 겉감: 40dx70d 3L GORE-TEX® ePE · C-KNIT™ 이면, 평직 리사이클 나일론, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 340,
    "details": {
      "description": "베타 SL 재킷은 베타 중 가장 가벼우면서, 산에서 실제로 벌어지는 일을 염두에 두고 만들었어요. 두루 쓰이도록 설계해 가볍게 접히는 성질을 잃지 않으면서 방수·방풍·투습을 온전히 갖췄고요. GORE-TEX ePE 멤브레인은 가볍고 강하며 PFAS를 의도적으로 넣지 않았어요. C-KNIT 이면 처리가 착용감과 통기를 높이고, 헬멧 위로 쓰는 StormHood는 시야를 가리지 않으면서 머리를 덮어요. 겨드랑이 지퍼로 열을 빼고, RECCO 리플렉터가 조난 수색에 도움이 돼요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성",
            "다용도"
          ]
        },
        {
          "label": "구조",
          "values": [
            "GORE C-KNIT™ 이면 기술로 가볍고 부드러우며 편안해요",
            "PFC를 쓰지 않은 GORE-TEX® ePE 멤브레인이 통기되게 날씨를 막고, 식물에서 뽑은 섬유로 만든 바이오 기반 나일론 겉감에 접합했어요",
            "오래 쓰고 PFC를 쓰지 않으며 탄소 발자국을 줄인 GORE-TEX® 원단으로 만들었어요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "Velcro® 여밈으로 조절되는 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 75cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0-DWR(내구성 발수) 처리로 물기를 튕겨 내요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 가슴 포켓",
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요",
            "앞면 전체 지퍼"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/beta-sl-jacket-0854"
    },
    "cadCents": 64000,
    "costKrw": 672000,
    "priceKrw": 765000,
    "krRetailKrw": 850000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/beta-sl-jacket-0854",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "배색: 70d 나일론·스판덱스 평직 · FC0 DWR, 123gsm - 나일론 94%, 엘라스테인 6% / 겉감: Fortius™ DW 1.0 - 이중직 우븐, 125gsm - 나일론 86%, 엘라스테인 14% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 낮은 온도로 다림질, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 350,
    "details": {
      "description": "마음이 이끄는 대로 나서요. 감마 라이트웨이트 후디는 감마 후디 중 가장 가볍고, 따뜻한 날을 염두에 두고 여러 지형과 조건, 활동을 감당하도록 만든 소프트셸이라 밖에서 보내는 시간이 많은 사람에게 잘 맞아요. Fortius 1.0 소프트셸 원단은 바람을 막고 물을 튕겨 내면서 늘어나고 숨 쉬며, UPF 50+ 자외선 차단을 주고 리사이클 나일론으로 만들었어요. 빠르게 조절되는 StormHood가 머리를 덮고, 레귤러 핏은 움직임을 막지 않도록 패턴을 잡았어요.\n\n더 두꺼운 옵션이 필요하다면 Gamma Hoody를 보세요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "통기성",
            "경량",
            "내구성",
            "바람 저항",
            "발수"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Fortius™ 1.0 소프트셸이 늘어나고 공기를 통과시켜 남는 열을 저절로 빼 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 소매단 바인딩"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유로워요",
            "총장(뒤 중심 기준): M 사이즈 73.5cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0-DWR(내구성 발수) 처리로 물기를 튕겨 내요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "한 번 당겨 조절하는 후드 드로코드",
            "헬멧 위로 착용 가능"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "양쪽 지퍼 가슴 포켓",
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "겉감 — bluepass 소재",
            "안감 — bluepass 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "UPF 자외선 차단",
          "values": [
            "UPF 50+ (EN 13758-2, AS4399:2020, GB/T 18830-2009). 옷이 덮은 부위만 보호돼요. 오래 입거나 늘어나거나 젖으면 차단 효과가 줄 수 있어요."
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "앞면 전체 지퍼"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/gamma-lightweight-hoody-0606"
    },
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/gamma-lightweight-hoody-0606",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "안감: 폴리에스터 Octa 라셀 니트 충전재, 98gsm - 폴리에스터 100% / 겉감: Fortius™ Air 20 - 평직, FC0 DWR, 58gsm - 나일론 88%, 엘라스테인 12% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 약하게·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 370,
    "details": {
      "description": "프로톤 SL 후디는 아크테릭스 인슐레이션 컬렉션에서 가장 가볍고 가장 통기가 좋은 선택이에요. 추운 날의 등반이나 서늘한 조건에서 활동량이 많은 운동을 할 때, 몸을 데우는 일에 더는 고민이 필요 없어요. 니트 충전재는 배낭 바닥에 아무리 밀어 넣어도 부피감과 형태를 지켜요. 더 중요한 건 몸이 숨을 쉰다는 점이에요 — 크럭스를 넘느라 페이스를 올려도 땀범벅으로 남지 않아요.\n\n더 두꺼운 옵션이 필요하다면 Proton Hoody를 보세요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "경량",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Fortius™ Air 20 겉감이 통기성과 날씨 대응, 가벼운 내구성과 신축성 사이에서 균형을 잡아요",
            "통기되는 Octa® Loft 충전재가 보온해 줘요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "몸에 붙는 핏에 입체 패턴을 넣어 움직임과 편안함을 함께 잡았어요",
            "총장(뒤 중심 기준): M 사이즈 72cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 착용 가능",
            "조절되는 충전재 후드"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드워머 포켓 2개",
            "신축 우븐 지퍼 가슴 포켓 1개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "PFAS(과불화화합물) 규제 준수",
            "겉감 — 리사이클 소재, FC0 DWR 발수, bluepass 소재"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/proton-sl-hoody-9557"
    },
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 405000,
    "krRetailKrw": 450000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/proton-sl-hoody-9557",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Sea Salt",
        "colorKo": "씨솔트",
        "sku": "X000009557-SEA-SALT",
        "cardImage": "/images/products/arcteryx-proton-sl-hoody-men-sea-salt-card.webp",
        "detailImages": [
          "/images/products/arcteryx-proton-sl-hoody-men-sea-salt.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      }
    ]
  },
  {
    "slug": "arcteryx-ralle-down-parka-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Ralle Down Parka",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": "Down Insulation: 750 fill European grey goose down - 100% Grey Goose Down (minimum 90% down) / 안감: 20d 리사이클 나일론 downproof, 42gsm, FC0 DWR - 나일론 100% / 충전재(합성): Coreloft™, 100gsm - 폴리에스터 100% / 겉감: 80d 2L GORE-TEX® ePE, 106gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 퍼머넌트 프레스·중간 온도, 건조기 낮은 온도 · 테니스공을 함께 넣기, 건조기 퍼머넌트 프레스·낮은 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 드럼 세탁기 권장, 통돌이 세탁기는 세탁망 사용",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 919,
    "details": {
      "description": "산에서 보내는 모든 순간을 위한 보온과 날씨 보호예요. 랄레 다운 파카는 랄레 중 가장 따뜻하고, 구스다운 충전재에 PFAS를 넣지 않은 GORE-TEX를 더해 눈과 바람, 비를 막아요. 충전재를 넣은 StormHood에는 충전 칼라가 이어져 있어 더 따뜻하고, 포켓이 여럿이라 넣을 곳이 넉넉해요. 기장이 길어 보호 범위가 넓고, 입체 패턴이 움직임을 막지 않아요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "750 필파워 유러피언 그레이 구스다운이 가볍고 효율적으로 따뜻하게 해 줘요. RDS(책임 다운 기준) 인증을 받았어요",
            "통기성이 아주 좋은 Fortius™ Air 20 신축 메시를 등판과 소매 아래에 써서 열을 더 잘 빼요",
            "PFAS를 쓰지 않은 GORE-TEX® ePE와 리사이클 겉감이 방수·방풍·투습을 온전히 갖췄어요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "허벅지 중간 기장",
            "총장(뒤 중심 기준): M 사이즈 88cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "충전재를 넣은 조절식 StormHood™가 머리를 온전히 덮고, 안에 이어진 충전 칼라가 보호를 더해요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 가슴 포켓",
            "충전재를 넣은 지퍼 핸드 포켓 2개",
            "안쪽 덤프 포켓"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "겉감 — bluepass 소재, 리사이클 소재",
            "충전재 — bluepass 소재, 리사이클 소재",
            "안감 — bluepass 소재, 리사이클 소재",
            "RDS(책임 다운 기준) — 사용한 다운 100%가 IDFL의 RDS 인증을 받았어요 (No.TE-99950273)",
            "깃털 — 법이 허용하는 범위를 넘지 않는 깃털이 들어 있어요",
            "PFAS(과불화화합물) 규제 준수",
            "살균 허가 번호 — PER. NO. PA-8811 (캐나다)"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "양방향 앞지퍼"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/ralle-down-parka-9156"
    },
    "cadCents": 66000,
    "costKrw": 712980,
    "priceKrw": 912700,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/ralle-down-parka-9156",
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
        "sku": "X000009156-BLACK",
        "cardImage": "/images/products/arcteryx-ralle-down-parka-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-ralle-down-parka-men-black.webp",
          "/images/products/arcteryx-ralle-down-parka-men-black-back-view.webp",
          "/images/products/arcteryx-ralle-down-parka-men-black-full-body.webp",
          "/images/products/arcteryx-ralle-down-parka-men-black-hood.webp",
          "/images/products/arcteryx-ralle-down-parka-men-black-hover.webp",
          "/images/products/arcteryx-ralle-down-parka-men-black-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      }
    ]
  },
  {
    "slug": "arcteryx-sabre-sv-jacket-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Sabre SV Jacket",
    "gender": "men",
    "category": "outerwear",
    "originCountry": null,
    "material": "겉감: 200D 3L GORE-TEX® PRO ePE 캔버스, 205 gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 740,
    "details": {
      "description": "세이버 SV는 우리가 만든 프리라이드 재킷 중 가장 튼튼해요. 박음질로 붙인 핸드 포켓과 200D GORE-TEX PRO ePE 원단이 방수·방풍·투습을 내주고요. 조금 짧게 잡은 프리라이드 전용 핏이 움직임을 자유롭게 해요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "PFAS를 의도적으로 넣지 않은 GORE-TEX® PRO ePE 원단이 가볍고 튼튼하게 방수·방풍·투습으로 보호해요",
            "통기가 좋은 Permeair™ 이면은 원액 염색 실로 색을 내, 기존 염색보다 자원을 덜 써요",
            "리사이클 겉감이 어떤 조건에서도 튼튼해요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 79cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0-DWR(내구성 발수) 처리로 물기를 튕겨 내요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요",
            "조절되는 후드로 원하는 만큼 가려요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개",
            "안쪽 가슴 포켓 2개",
            "안쪽 덤프 포켓 2개",
            "가슴 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요",
            "Slide 'n Loc™ 연결 장치로 호환 팬츠와 이어 붙여요",
            "안에 달린 파우더 스커트가 눈을 막아요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Zplus Company Limited · 중국"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/sabre-sv-jacket-9910"
    },
    "cadCents": 77000,
    "costKrw": 830790,
    "priceKrw": 1063500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/sabre-sv-jacket-9910",
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
        "sku": "X000009910-BLACK",
        "cardImage": "/images/products/arcteryx-sabre-sv-jacket-men-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-sabre-sv-jacket-men-black.webp",
          "/images/products/arcteryx-sabre-sv-jacket-men-black-back-view.webp",
          "/images/products/arcteryx-sabre-sv-jacket-men-black-full-body.webp",
          "/images/products/arcteryx-sabre-sv-jacket-men-black-hood.webp",
          "/images/products/arcteryx-sabre-sv-jacket-men-black-hover.webp",
          "/images/products/arcteryx-sabre-sv-jacket-men-black-side-view.webp",
          "/images/products/arcteryx-sabre-sv-jacket-men-black-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "배색: Fortius™ 2.0 - 합성 신축 소프트셸, FC0 DWR, 138 gsm - 나일론 86%, 엘라스테인 14% / 겉감: Fortius DW 2.0 - 이중직 우븐, 186gsm - 나일론 88%, 엘라스테인 12% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 낮은 온도로 다림질, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 430,
    "details": {
      "description": null,
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "악천후 대응",
            "통기성",
            "경량",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Aequora AirPerm™ 원단은 가볍고 더운 날 살갗에 닿는 감촉이 편하며, 엘라스테인이 들어가 늘어나요",
            "Hybrid Mapping 기술로 각 원단을 가장 잘 쓰이는 자리에 배치했어요",
            "특정 부위에 쓴 Fortius™ DW 2.0 소프트셸이 내구성·통기성·날씨 대응·신축성을 주고, 리사이클 소재로 만들었어요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "조절되는 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 77cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 착용 가능",
            "조절되는 StormHood™",
            "후드가 머리를 완전히 덮고, 정밀 조절 장치로 주변 시야를 가리지 않으면서 맞춤새를 높여요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "등반에 맞춘 입체 패턴이 움직임과 편안함을 주고 겹쳐 입기 좋아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "하네스와 함께 쓸 수 있는 지퍼 핸드 포켓"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "안감 — bluepass 소재",
            "PFAS(과불화화합물) 규제 준수",
            "배색 — bluepass 소재, FC0 DWR 발수, 리사이클 소재",
            "겉감 — 리사이클 소재, FC0 DWR 발수, bluepass 소재"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Vastco Garments LTD · 베트남"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/serratus-hoody-0941"
    },
    "cadCents": 44000,
    "costKrw": 462000,
    "priceKrw": 513000,
    "krRetailKrw": 570000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/serratus-hoody-0941",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "겉감: Tyono™ 30 - 나일론 미니립 경량 기계 신축, FC0 DWR, 51gsm - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 150,
    "details": {
      "description": "스쿼미시 후디는 가장 가벼운 레이어가 가장 큰 차이를 만든다는 걸 보여 줘요. 티셔츠 위에 걸치든 플리스 위에 겹치든, 이 튼튼한 윈드셸은 무게보다 훨씬 큰 일을 해요 — 바람을 막고 한기를 끊으며, 벽에서 움직임을 방해하지 않아요. 바람이 불면 거기 있고, 해가 나면 가슴 포켓 안으로 접혀 사라져요. 하네스에 걸어 두면 바람 부는 빌레이와 몸이 떨리는 크럭스에서 늘 손 닿는 곳에 있어요.\n\n바뀐 점: 스쿼미시 후디의 발수 처리를 FC0 DWR(내구성 발수)로 바꿨어요. 발수력은 그대로면서 PFAS를 의도적으로 넣지 않았어요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "통기성",
            "경량",
            "바람 저항",
            "발수"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Tyono™ 30D 원단이 무게에 비해 뛰어난 방풍·신축·통기·강도를 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 밴드 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): M 사이즈 76cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "내장 기능",
          "values": [
            "보강한 클립 루프로 접은 재킷을 하네스나 배낭에 걸어 두고 바로 꺼내 쓸 수 있어요"
          ]
        },
        {
          "label": "로고와 라벨",
          "values": [
            "Arc'teryx 버드 로고"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "가슴 포켓 하나에 재킷을 접어 넣어 작게 보관해요",
            "지퍼 가슴 포켓은 하네스와 배낭을 멘 채로도 꺼내기 쉬워요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "PFAS(과불화화합물) 규제 준수",
            "FC0 DWR 발수"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/mens/squamish-hoody-0276"
    },
    "cadCents": 26000,
    "costKrw": 273000,
    "priceKrw": 279000,
    "krRetailKrw": 310000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/mens/squamish-hoody-0276",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      }
    ]
  },
  {
    "slug": "arcteryx-therme-down-parka-men",
    "brand": "Arc'teryx",
    "brandSlug": "arcteryx",
    "name": "Therme Down Parka",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "VN",
    "material": "Down Insulation: 750 fill European grey goose down - 100% Grey Goose Down (minimum 90% down) / 배색: 폴리에스터 high gauge interlock, peached double-sided, 170gsm - 폴리에스터 100% / 안감: 20d 리사이클 나일론 downproof, 42gsm, FC0 DWR - 나일론 100% / 겉감: 2L GORE-TEX® ePE 200d 리사이클 나일론, 190 gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 낮은 온도 · 테니스공을 함께 넣기, 건조기 퍼머넌트 프레스·낮은 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 드럼 세탁기 권장, 통돌이 세탁기는 세탁망 사용",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": null,
    "details": {
      "description": "선은 최소한으로, 날씨 보호는 최대한으로. 테르메 다운 파카는 단정한 인상에 아크테릭스 하드셸의 검증된 구조를 합쳤어요. 비 오는 날의 산책과 도심 나들이를 염두에 두고, GORE-TEX ePE 소재와 조절되는 StormHood™가 찬 바람과 소나기를 막아요. 가벼운 구스다운을 엉덩이까지 덮는 긴 기장에 넣어 온기를 가둬서, 사무실에서 저녁 자리까지 편하게 입어요.\n\n사이즈 팁: 이 모델은 크게 나온다는 이야기가 있어요. 사이즈 가이드를 보고 고르시고, 두 사이즈 사이라면 작은 쪽을, 몸에 붙게 입고 싶다면 한 치수 작게 고르세요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Down Composite Mapping™으로 물기가 차기 쉬운 부위에는 합성 충전재를, 보온이 중요한 부위에는 다운을 나눠 넣었어요",
            "750 필파워 유러피언 그레이 구스다운이 가볍고 효율적으로 따뜻하게 해 줘요. RDS(책임 다운 기준) 인증을 받았어요",
            "GORE-TEX® ePE가 오래가는 날씨 보호를 줘요. 리사이클 소재로 만들었고 PFAS를 의도적으로 넣지 않았어요",
            "캔버스 같은 겉감이 거친 인상을 주면서, 손에 닿는 감촉은 부드러워요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 니트 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): M 사이즈 86cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "조절되는 충전재 내장 StormHood™",
            "Coreloft 충전재를 넣은 StormHood™가 젖어도 온기를 더해 줘요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "감춘 지퍼 핸드 포켓 2개",
            "가슴 포켓",
            "안쪽 지퍼 포켓",
            "바깥 덤프 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "RDS(책임 다운 기준) — 사용한 다운 100%가 IDFL의 RDS 인증을 받았어요 (No.TE-99950273)",
            "깃털 — 법이 허용하는 범위를 넘지 않는 깃털이 들어 있어요",
            "PFAS(과불화화합물) 규제 준수",
            "충전재 — bluepass 소재",
            "안감 — bluepass 소재, FC0 DWR 발수, 리사이클 소재",
            "겉감 — 리사이클 소재, FC0 DWR 발수, bluepass 소재"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "전체 길이 양방향 분리 사이드 지퍼로 입고 벗기 쉬워요"
          ]
        }
      ],
      "sourceUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/therme-down-parka-9914"
    },
    "cadCents": 80500,
    "costKrw": 868275,
    "priceKrw": 1111400,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://outlet.arcteryx.com/ca/en/shop/mens/therme-down-parka-9914",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "variants": [
      {
        "color": "Forage",
        "colorKo": "Forage",
        "sku": "X000009914-FORAGE",
        "cardImage": "/images/products/arcteryx-therme-down-parka-men-forage-card.webp",
        "detailImages": [
          "/images/products/arcteryx-therme-down-parka-men-forage.webp",
          "/images/products/arcteryx-therme-down-parka-men-forage-back-view.webp",
          "/images/products/arcteryx-therme-down-parka-men-forage-full-body.webp",
          "/images/products/arcteryx-therme-down-parka-men-forage-hood.webp",
          "/images/products/arcteryx-therme-down-parka-men-forage-hover.webp",
          "/images/products/arcteryx-therme-down-parka-men-forage-side-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "CN",
    "material": "겉감: 3L GORE-TEX® ePE 제트 염색 200d 리사이클 나일론, 213gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 470,
    "details": {
      "description": "아크테릭스 디자인 팀이 GORE-TEX ePE로 할 수 있는 일의 경계를 밀어붙인 방수 하드셸이에요. 산에서 비구름이 몰려와도 트레일 위에서 몸을 마른 상태로 지켜 줘요. 여유 있는 어깨와 크롭 기장, 등판 플리츠에 실용적인 포켓과 찬 바람을 막는 밑단 조임, 조절되는 StormHood™를 더해 특유의 실루엣과 기술적인 디테일 사이에서 균형을 잡았어요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "릴랙스드",
        "text": "가슴·허리·엉덩이·허벅지를 여유 있게 재단한 핏이에요. 구조와 깔끔한 선을 잃지 않으면서 편안함과 움직임의 자유를 주고, 조금 더 캐주얼하게 보여요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "신축 섬유와 흡습 속건 원사로 만들어 기능성을 높였어요",
            "튼튼한 200D 리사이클 나일론 캔버스 겉감으로 내구성을 더했어요",
            "GORE C-KNIT™ 이면 기술로 소리가 적고 살갗에 부드러우며 통기가 뛰어나고, 리사이클 소재로 만들었어요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "크롭 기장 디자인",
            "여유 있는 핏으로 편안하고 겹쳐 입기 좋아요",
            "총장(뒤 중심 기준): S 사이즈 56cm · 사이즈마다 달라져요",
            "등판과 소매에 플리츠를 넣어 움직임과 편안함을 높였어요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "얇게 마감한 조절식 StormHood™"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "주름을 넣어 본딩한 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "겉감 — bluepass 소재, 원액 염색 이면, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "전용 지퍼 풀은 장갑을 낀 채로도 쓸 수 있어요"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/altira-cropped-jacket-0094"
    },
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 1031940,
    "krRetailKrw": 1146600,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/altira-cropped-jacket-0094",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "배색: 환편 니트 플리스, 215 gsm, FC0 DWR - 폴리에스터 93%, 엘라스테인 7% / 겉감: 20dx20d 나일론 립스톱, FC0 DWR, 45gsm - 나일론 100% / 충전재(합성): Coreloft™ 60 (60 g/m²) - 폴리에스터 100% / 안감: 20D 리사이클 원액 염색 나일론 립스톱, FC0 DWR, 38gsm - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 약하게·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기, 비틀어 짜기 금지",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 266,
    "details": {
      "description": "아톰은 아웃도어 장비의 기본이에요. 쌀쌀한 알파인 스타트와 갑작스러운 정상의 돌풍에 대비해 통기되는 보온을 꾸준히 줘요. 몇 해를 입어도 눌리지 않는 가벼운 Coreloft 충전재와 신축성 있는 플리스 옆판이 열을 붙잡을 곳과 내보낼 곳을 나눠요. 하드셸 안에 겹쳐 입으면 젖어도 따뜻한 레이어링이 완성돼요.\n\n더 두꺼운 옵션이 필요하다면 Atom SV Jacket를 보세요.",
      "productTip": null,
      "fit": null,
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "경량",
            "바람 저항"
          ]
        },
        {
          "label": "칼라",
          "values": [
            "트리코 안감을 댄 칼라가 살갗에 부드럽게 닿아요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 니트 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "몸에 붙는 핏에 입체 패턴을 넣어 움직임과 편안함을 함께 잡았어요",
            "총장(뒤 중심 기준): S 사이즈 66cm · 사이즈마다 달라져요",
            "리사이클 Coreloft™ 충전재가 통기되는 보온을 주고 눌려도 부피가 되살아나요",
            "옆 밑단 벤트로 움직임과 보폭이 자유로워요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "양쪽 밑단 조임이 찬 바람을 막고 기장을 조절해요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "안쪽 가슴 포켓",
            "지퍼 핸드 포켓 2개",
            "안쪽 지퍼 가슴 포켓"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "충전재 — bluepass 소재, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "안감 — bluepass 소재, FC0 DWR 발수, 리사이클 소재",
            "배색 — FC0 DWR 발수, 리사이클 소재",
            "겉감 — FC0 DWR 발수"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "No Slip Zip™ 앞지퍼",
            "전용 지퍼 풀은 장갑을 낀 채로도 쓸 수 있어요"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/atom-jacket-9855"
    },
    "cadCents": 36000,
    "costKrw": 378000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/atom-jacket-9855",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "배색: Octa® 폴리에스터 플리스, 40D 델타 페이스, 122gsm - 폴리에스터 100% / 충전재(합성): Coreloft™ Stretch, 40gsm - 폴리에스터 100% / 안감: 리사이클 20d 나일론 평직 위사 신축 FC0 DWR, 58gsm - 나일론 88%, 엘라스테인 12% / 겉감: Fortius™ Air 20 - 평직, FC0 DWR, 58gsm - 나일론 88%, 엘라스테인 12% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 약하게·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기, 비틀어 짜기 금지",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 240,
    "details": {
      "description": "아톰 SL 후디는 기본형보다 가벼우면서, 갖고 있으면 가장 자주 쓰게 되는 옷 중 하나예요. 춥고 습한 날씨의 트레일 러닝에서는 단독으로, 산에서 보온과 움직임이 더 필요할 때는 방수 셸 안에 겹쳐 입어요. 통기되고 날씨를 막아 주며, 몸판에만 신축 충전재를 넣고 소매와 후드에는 넣지 않아 수납성을 최대한 살리면서 몸통을 집중적으로 데워요.\n\n더 두꺼운 옵션이 필요하다면 Atom Hoody를 보세요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "경량",
            "압축·수납 가능",
            "내구성",
            "바람 저항",
            "초경량"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Fortius™ Air 20 겉감이 통기성과 날씨 대응, 가벼운 내구성과 신축성 사이에서 균형을 잡아요",
            "신축 신슐레이션은 통기되고 따뜻하며 가볍고, 움직임을 자유롭게 하며 리사이클 소재로 만들었어요",
            "가볍고 신축성 있는 Octa® 플리스 옆판이 움직임을 자유롭게 하고 통기를 높여요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "충전재 없이 메시로 안감을 댄 소매가 가볍게 보호하고 체온을 조절해요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "몸에 붙는 핏에 입체 패턴을 넣어 움직임과 편안함을 함께 잡았어요",
            "총장(뒤 중심 기준): S 사이즈 65cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "충전재 없이 얇게 마감한 조절식 StormHood™"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "배색 — 리사이클 소재",
            "충전재 — 리사이클 소재",
            "방취 처리(Polygiene)를 한 제품이에요",
            "PFAS(과불화화합물) 규제 준수",
            "안감 — bluepass 소재, FC0 DWR 발수, 리사이클 소재",
            "겉감 — 리사이클 소재, FC0 DWR 발수, bluepass 소재"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/atom-sl-hoody-9511"
    },
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/atom-sl-hoody-9511",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "배색: 3L GORE-TEX® PRO ePE 빔 염색 80d 평직 리사이클 나일론, 126 gsm, C0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 겉감: 100d 3L GORE-TEX® PRO ePE, 리사이클 평직, 135 gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 395,
    "details": {
      "description": "베타 제품군에서 가장 튼튼하고 오래 입는 재킷이에요. 정상을 향해 오르는 길에 비가 옆으로 들이쳐도 전문가 수준의 보호를 주는 올마운틴 하드셸이고요. GORE-TEX PRO ePE를 하이브리드로 섞어 어깨는 더 튼튼하게, 몸판은 더 가볍게 만들어 몸통을 마른 상태로 지켜 줘요. 헬멧 위로 쓰는 DropHood를 달아 여닫기도 쉬워요.\n\n더 두꺼운 옵션이 필요하다면 Beta SV Jacket를 보세요.",
      "productTip": "새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "ePE 멤브레인을 쓴 GORE-TEX®는 방수·투습이고 PFAS를 의도적으로 넣지 않았어요",
            "어깨 요크와 후드에 통기·방수·방풍 GORE-TEX® PRO ePE를 써서 물기가 많이 닿는 부위를 튼튼하게 했어요",
            "몸판에 통기·방수·방풍 GORE-TEX® PRO ePE를 써서 가볍게 보호해요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "장갑을 낀 채 잡을 수 있는 소매 탭이 소매를 고정하고 바람을 막아요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): S 사이즈 69cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 DropHood™",
            "후드가 머리를 완전히 덮고, 정밀 조절 장치로 주변 시야를 가리지 않으면서 맞춤새를 높여요",
            "후드 안쪽 코드록으로 조절해요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요",
            "후드 챙에 넣은 RECCO® 리플렉터가 수색 가능성을 높여요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "PFAS(과불화화합물) 규제 준수",
            "겉감 — 리사이클 소재, FC0 DWR 발수, bluepass 소재, 원액 염색 이면"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone Nam Dinh Company LTD · 베트남"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/beta-ar-jacket-9863"
    },
    "cadCents": 84000,
    "costKrw": 882000,
    "priceKrw": 945000,
    "krRetailKrw": 1050000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/beta-ar-jacket-9863",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "충전재(합성): Coreloft™, 40gsm - 폴리에스터 100% / 안감: 20d 리사이클 나일론 평직, 42gsm - 나일론 100% / 겉감: 면·나일론 혼방 캔버스, 315 gsm - 면 66%, 나일론 25%, 엘라스테인 9% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 약하게·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 낮은 온도로 다림질, 섬유유연제 사용 금지, 두 번 헹구기, 드럼 세탁기 권장, 통돌이 세탁기는 세탁망 사용, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 748,
    "details": {
      "description": "클라키아 AR 인슐레이티드 후디로 서늘한 계절을 충분히 누려요. 가을 클라이밍의 기본이 될 옷이에요. 여유 있는 핏과 부드러운 니트 안감이 등반 사이사이 살갗에 닿는 감촉을 편하게 하고, 40gsm 신슐레이션은 두툼한 코튼 캔버스 겉감 덕분에 무게보다 훨씬 따뜻해요. 조절 장치를 감춘 매끈한 후드, 덮개가 달린 지퍼 핸드 포켓, 안쪽 니트 소매단 같은 디테일이 하루 종일 볼더링과 크래깅을 편하게 해 줘요.",
      "productTip": null,
      "fit": {
        "label": "오버사이즈",
        "text": "몸 전체를 가장 넉넉하게 재단한 핏이에요. 내려온 어깨선과 넓은 소매가 움직임을 자유롭게 하면서, 드레이프와 구조를 함께 살려 요즘의 실루엣을 만들어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "경량"
          ]
        },
        {
          "label": "구조",
          "values": [
            "두툼한 315gsm 유기농 면·리사이클 나일론 혼방이 신축성과 내구성을 줘서 여러 시즌 크래깅을 견뎌요",
            "40gsm Coreloft™ 충전재는 리사이클 소재로 만들었고 가벼운 보온을 줘요",
            "부드러운 니트 안감이 맨살에 닿는 감촉을 편하게 해요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "안쪽 신축 니트 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): S 사이즈 56cm · 사이즈마다 달라져요",
            "여유 있고 볼륨 있는 핏이라 플리스나 다른 레이어 위에 편하게 입어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "신축 밴드 밑단이 온기를 가둬요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "감춰 둔 후드 조절 장치"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "덮개가 달린 지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "충전재 — bluepass 소재, 리사이클 소재",
            "안감 — bluepass 소재, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "겉감 — 리사이클 소재, 유기농 면"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/clarkia-ar-insulated-hoody-0746"
    },
    "cadCents": 44000,
    "costKrw": 462000,
    "priceKrw": 540540,
    "krRetailKrw": 600600,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/clarkia-ar-insulated-hoody-0746",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "겉감: 3L ePE GORE-TEX®, 15d 리사이클 나일론, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 나일론 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 210,
    "details": {
      "description": "가볍게 접히는 이 셸이면 비를 계산에서 지울 수 있어요. 짧은 하이킹과 일상에 맞췄고요. 3레이어 방수 원단이 체온은 내보내고 물은 들이지 않아요. 이면 처리가 부드러움을 더해서, 가게에 뛰어들 때도, 예상 못 한 비 속에서 루트를 마무리할 때도, 긴 산행 뒤 친구들과 한 끼 할 때도 편해요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "경량",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "GORE C-KNIT™ 이면 기술로 가볍고 부드러우며 편안해요",
            "PFAS를 쓰지 않은 GORE-TEX® ePE와 리사이클 겉감이 방수·방풍·투습을 온전히 갖췄어요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): S 사이즈 60cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "조절되는 StormHood™",
            "후드가 머리를 완전히 덮고, 정밀 조절 장치로 주변 시야를 가리지 않으면서 맞춤새를 높여요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/coelle-jacket-9466"
    },
    "cadCents": 50000,
    "costKrw": 525000,
    "priceKrw": 585000,
    "krRetailKrw": 650000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/coelle-jacket-9466",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
      },
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "X000009466-BLACK",
        "cardImage": "/images/products/arcteryx-coelle-jacket-women-black-card.webp",
        "detailImages": [
          "/images/products/arcteryx-coelle-jacket-women-black.webp",
          "/images/products/arcteryx-coelle-jacket-women-black-back-view.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "BD",
    "material": "겉감: 20dx20d 나일론 립스톱, FC0 DWR, 45gsm - 나일론 100% / 충전재(합성): Coreloft™ 60 (60 g/m²) - 폴리에스터 100% / 안감: 20D 리사이클 원액 염색 나일론 립스톱, FC0 DWR, 38gsm - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기, 드럼 세탁기 권장, 통돌이 세탁기는 세탁망 사용",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 235,
    "details": {
      "description": null,
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "발수 겉감",
            "통기성",
            "경량",
            "내구성",
            "충전재 내장"
          ]
        },
        {
          "label": "구조",
          "values": [
            "탄력 있는 Coreloft™ Compact 60 충전재는 통기되고 따뜻하며 가볍고, 젖어도 성능을 유지하면서 눌려도 부피가 되살아나요",
            "가볍고 부드러운 Tyono™ 20이 공기를 통과시켜요",
            "통기되는 20D 리사이클 나일론 안감이 체온을 조절하고 살갗에 부드럽게 닿아요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): S 사이즈 56cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "충전재 — bluepass 소재, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "겉감 — FC0 DWR 발수",
            "안감 — 일부 색상 원액 염색, FC0 DWR 발수, 리사이클 소재"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Youngone (CEPZ) LTD · 방글라데시"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/elec-insulated-jacket-9512"
    },
    "cadCents": 38000,
    "costKrw": 399000,
    "priceKrw": 466830,
    "krRetailKrw": 518700,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/elec-insulated-jacket-9512",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "배색: Terratex™ - 50D 리사이클 나일론·스판덱스 평직, FC0 DWR, 126gsm - 나일론 95%, 엘라스테인 5% / 겉감: Fortius™ DW 1.0 - 이중직 우븐, 125gsm - 나일론 86%, 엘라스테인 14% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 낮은 온도로 다림질, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 260,
    "details": {
      "description": "감마 라이트웨이트 후디는 감마 중 가장 가벼워요. 여러 지형과 환경, 조건을 감당하도록 만들어 새로운 경험을 찾는 사람에게 맞는 소프트셸이에요. 가볍고 물을 튕겨 내는 Fortius™ 1.0 소프트셸 원단은 늘어나고 숨 쉬며, UPF 50+ 자외선 차단을 주고 리사이클 소재로 만들었어요. 낮게 붙는 후드가 머리를 덮고, 지퍼 핸드 포켓이 소지품을 지키며, 슬림한 핏은 얇은 레이어를 겹칠 여유를 두면서도 움직임이 자유롭도록 패턴을 잡았어요.\n\n더 두꺼운 옵션이 필요하다면 Gamma Hoody를 보세요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "통기성",
            "경량",
            "바람 저항",
            "생활 방수"
          ]
        },
        {
          "label": "구조",
          "values": [
            "기계적 신축 원단으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "얇게 마감한 신축 밴드 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "군더더기 없는 슬림한 핏으로 활동량이 많을 때 통기가 잘 돼요",
            "총장(뒤 중심 기준): S 사이즈 65cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "신축 밴드 밑단으로 안정적으로 맞아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "얇게 마감한 조절식 StormHood™"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요",
            "겨드랑이 거싯 덕분에 팔을 위로 올려도 밑단이 들리지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "안감 — bluepass 소재",
            "PFAS(과불화화합물) 규제 준수",
            "겉감 — 리사이클 소재, FC0 DWR 발수, bluepass 소재"
          ]
        },
        {
          "label": "UPF 자외선 차단",
          "values": [
            "UPF 50+ (EN 13758-2, AS4399:2020, GB/T 18830-2009). 옷이 덮은 부위만 보호돼요. 오래 입거나 늘어나거나 젖으면 차단 효과가 줄 수 있어요."
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Vast Apparel Vietnam LTD. · 베트남"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/gamma-lightweight-hoody-0924"
    },
    "cadCents": 34000,
    "costKrw": 357000,
    "priceKrw": 387000,
    "krRetailKrw": 430000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/gamma-lightweight-hoody-0924",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "안감: 리사이클 폴리에스터 기모 포켓 메시, 158gsm - 리사이클 폴리에스터 100% / 겉감: Fortius™ 2.0 - 60D 합성 신축 소프트셸 · 폴리 플리스 이면, 233gsm, FC0 DWR - 나일론 84%, 엘라스테인 16%, 이면 폴리에스터 100% / 원단 원산지: 대만, 중국 / 염색 원산지: 대만, 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 약한 코스·낮은 온도, 건조기 퍼머넌트 프레스·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 낮은 온도로 다림질, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 510,
    "details": {
      "description": "보온이 조금 더 필요하지만 완전한 충전재까지는 아니고, 날씨 대응이 조금 더 필요하지만 완전 방수까지는 아닌 날 — 감마 MX 후디가 그 자리를 채워요. 하드셸보다 통기가 좋은 소프트셸이라 가벼운 무게로 충분한 보온을 주고, 변덕스러운 날씨와 추운 날에 딱 그만큼의 날씨 대응을 해요. 쌀쌀한 하이킹과 접근로에서는 단독으로, 춥고 습한 산행에서는 미드레이어로 입어요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "악천후 대응",
            "통기성",
            "경량",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "튼튼한 Fortius™ 2.0 소프트셸 원단이 무게 대비 보온성과 내구성을 높이고, 바람을 막으며 DWR 발수 처리를 했어요",
            "심실링 처리로 날씨를 막고 마감을 얇게 하며 강도를 더했어요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 밴드 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): S 사이즈 66cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "조절되는 밑단 드로코드가 찬 바람을 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 가슴 포켓",
            "지퍼를 감춘 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "안감 — bluepass 소재, 리사이클 소재",
            "PFAS(과불화화합물) 규제 준수",
            "겉감 — FC0 DWR 발수, bluepass 소재"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/gamma-mx-hoody-9456"
    },
    "cadCents": 52000,
    "costKrw": 546000,
    "priceKrw": 567000,
    "krRetailKrw": 630000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/gamma-mx-hoody-9456",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "겉감: 40dx70d 3L GORE-TEX® ePE · C-KNIT™ 이면, 평직 리사이클 나일론, FC0 DWR - 나일론 100% + ePE·PU 멤브레인 / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 285,
    "details": {
      "description": "비바람을 견디도록 만든 가벼운 GORE-TEX ePE 셸이에요. 살갗에 닿는 이면 처리가 후텁지근한 여름 소나기에도 잘 숨 쉬어요. 나야의 군더더기 없는 디자인 라인과 크롭 기장이 만나, 하이킹에 바로 나설 수 있는 기술적인 셸을 새로운 핏으로 완성했어요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "경량",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "GORE C-KNIT™ 이면 기술로 가볍고 부드러우며 편안해요",
            "GORE-TEX® ePE가 PFAS를 의도적으로 넣지 않고도 방수·방풍·투습으로 날씨를 막아 줘요",
            "겉감에 리사이클 나일론이 57% 들어갔어요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "크롭 기장 디자인",
            "레귤러 핏으로 움직임이 자유로워요",
            "총장(뒤 중심 기준): S 사이즈 54cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "밑단 조임 장치"
          ]
        },
        {
          "label": "후드",
          "values": [
            "조절되는 드롭 후드는 쓰지 않을 때 목을 덮어 줘요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "감춘 지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요",
            "원액 염색 이면",
            "리사이클 소재",
            "PFAS(과불화화합물) 규제 준수"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/naya-cropped-jacket-0327"
    },
    "cadCents": 64000,
    "costKrw": 672000,
    "priceKrw": 711000,
    "krRetailKrw": 790000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/naya-cropped-jacket-0327",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "겉감: 15d 나일론 이중직 립스톱, 42gsm, FC0 DWR - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 낮은 온도로 다림질, 섬유유연제 사용 금지",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 123,
    "details": {
      "description": "가볍고 튼튼한 이 재킷은 당일 하이킹의 거센 바람을 막도록 만들었어요. 통기되는 원단이 트레일에서 땀이 날 때 남는 열을 빼 주고, 후드가 필요 없을 때는 칼라 안으로 지퍼로 넣어 둘 수 있어요. 예보에 비는 없지만 바람은 막아야 하는 날, 배낭에 넣어 두기 좋은 크롭 레귤러 핏 레이어예요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "통기성",
            "경량",
            "내구성",
            "바람 저항"
          ]
        },
        {
          "label": "구조",
          "values": [
            "통기되는 소재가 바람 부는 하이킹에서 남는 열을 빼 줘요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "크롭 기장 디자인",
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): S 사이즈 54cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "밑단",
          "values": [
            "신축 밴드 밑단과 소매단이 바깥 날씨를 막아요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "접어 넣는 후드"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "PFAS(과불화화합물) 규제 준수"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/naya-cropped-stowhood-jacket-0263"
    },
    "cadCents": 30000,
    "costKrw": 315000,
    "priceKrw": 359100,
    "krRetailKrw": 399000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/naya-cropped-stowhood-jacket-0263",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "material": "겉감: 3L GORE-TEX® ePE, 빔 염색, 80d 평직 리사이클 나일론, 165gsm, FC0 DWR - 나일론 100% + ePE·PU 멤브레인, 이면 폴리에스터 100% / 원단 원산지: 중국 / 염색 원산지: 중국 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 중간 온도, 건조기 일반·중간 온도, 표백 금지, 드라이클리닝 금지, 다림질 금지, 단독 세탁, 섬유유연제 사용 금지, 세탁 전 여밈 모두 잠그기, 두 번 헹구기, 젖은 채로 방치 금지, 건조 후 즉시 꺼내기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 605,
    "details": {
      "description": "빅마운틴 스키의 수직 구간을 위해 만든 센티넬 재킷은 튼튼하고 편안한 프리라이드의 정석이에요. 내구성 있고 통기되는 80D 3L ePE GORE-TEX가 외부 요소를 막고, 따뜻한 이면 처리로 감촉이 부드러워요. 앞서 나간 설계와 인체공학 패턴이 움직임을 막지 않고, WaterTight 겨드랑이 지퍼로 열을 빼며, 헬멧 위로 쓰는 StormHood는 머리를 완전히 덮으면서도 시야를 넓게 지키도록 조절돼요. 큰 포켓은 안전하게 잠기면서도 꺼내기 쉽고, RECCO® 리플렉터가 수색·구조에 도움이 돼요.\n\n이 제품에는 PFAS를 의도적으로 넣지 않았어요.\n\n새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. 겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.",
      "productTip": null,
      "fit": {
        "label": "레귤러",
        "text": "가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "방수",
            "방풍",
            "통기성",
            "내구성"
          ]
        },
        {
          "label": "구조",
          "values": [
            "플란넬 이면이 가볍게 보온해요",
            "PFAS를 쓰지 않은 GORE-TEX® ePE와 리사이클 겉감이 방수·방풍·투습을 온전히 갖췄어요",
            "80D ePE SSD(원액 염색 소프트셸) — 플란넬 이면으로 착용감을 더했어요"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요",
            "총장(뒤 중심 기준): S 사이즈 70cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "DWR(내구성 발수) 처리로 물기를 튕겨 내요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요",
            "조절되는 StormHood™"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "지퍼 핸드 포켓 2개",
            "안쪽 메시 덤프 포켓",
            "안쪽 지퍼 포켓",
            "RFID 패스를 넣는 소매 포켓"
          ]
        },
        {
          "label": "스노스포츠 기능",
          "values": [
            "RECCO® 리플렉터가 조난 시 수색·구조를 도와요",
            "Slide 'n Loc™ 연결 장치로 호환 팬츠·재킷과 이어 붙여 눈이 들어오지 않게 해요",
            "안에 달린 파우더 스커트가 눈을 막아요"
          ]
        },
        {
          "label": "지퍼",
          "values": [
            "겨드랑이 지퍼로 열을 쉽게 빼요"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/sentinel-jacket-0539"
    },
    "cadCents": 90000,
    "costKrw": 945000,
    "priceKrw": 1105650,
    "krRetailKrw": 1228500,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/sentinel-jacket-0539",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "originCountry": "VN",
    "material": "겉감: Tyono™ 30 - 나일론 미니립 경량 기계 신축, FC0 DWR, 51gsm - 나일론 100% / 원단 원산지: 일본 / 염색 원산지: 일본 / 세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요",
    "care": "세탁기 낮은 온도, 건조기 일반·낮은 온도, 표백 금지, 진한 색은 따로 세탁, 드라이클리닝 금지, 다림질 금지, 섬유유연제 사용 금지, 두 번 헹구기",
    "manufacturer": "Arc'teryx Equipment",
    "weightG": 123,
    "details": {
      "description": "스쿼미시 후디는 가장 가벼운 레이어가 가장 큰 차이를 만든다는 걸 보여 줘요. 티셔츠 위에 걸치든 플리스 위에 겹치든, 이 튼튼한 윈드셸은 무게보다 훨씬 큰 일을 해요 — 바람을 막고 한기를 끊으며, 벽에서 움직임을 방해하지 않아요. 바람이 불면 거기 있고, 해가 나면 가슴 포켓 안으로 접혀 사라져요. 하네스에 걸어 두면 바람 부는 빌레이와 몸이 떨리는 크럭스에서 늘 손 닿는 곳에 있어요.\n\n바뀐 점: 스쿼미시 후디의 발수 처리를 FC0 DWR(내구성 발수)로 바꿨어요. 발수력은 그대로면서 PFAS를 의도적으로 넣지 않았어요.",
      "productTip": null,
      "fit": {
        "label": "피티드",
        "text": "가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요."
      },
      "groups": [
        {
          "label": "주요 특성",
          "values": [
            "통기성",
            "경량",
            "바람 저항",
            "발수"
          ]
        },
        {
          "label": "구조",
          "values": [
            "Tyono™ 30D 원단이 무게에 비해 뛰어난 방풍·신축·통기·강도를 줘요"
          ]
        },
        {
          "label": "소매",
          "values": [
            "신축 밴드 소매단"
          ]
        },
        {
          "label": "디자인과 핏",
          "values": [
            "총장(뒤 중심 기준): S 사이즈 64cm · 사이즈마다 달라져요"
          ]
        },
        {
          "label": "원단 처리",
          "values": [
            "FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요"
          ]
        },
        {
          "label": "후드",
          "values": [
            "헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요"
          ]
        },
        {
          "label": "내장 기능",
          "values": [
            "보강한 클립 루프로 접은 재킷을 하네스나 배낭에 걸어 두고 바로 꺼내 쓸 수 있어요"
          ]
        },
        {
          "label": "로고와 라벨",
          "values": [
            "Arc'teryx 버드 로고"
          ]
        },
        {
          "label": "패턴",
          "values": [
            "입체 패턴으로 움직임을 막지 않아요"
          ]
        },
        {
          "label": "포켓",
          "values": [
            "가슴 포켓 하나에 재킷을 접어 넣어 작게 보관해요",
            "지퍼 가슴 포켓은 하네스와 배낭을 멘 채로도 꺼내기 쉬워요"
          ]
        },
        {
          "label": "지속가능성",
          "values": [
            "PFAS(과불화화합물) 규제 준수",
            "FC0 DWR 발수"
          ]
        },
        {
          "label": "생산 공장",
          "values": [
            "Maxport Limited (Viet Nam) — Nam Dinh, Maxport 5 · 베트남"
          ]
        }
      ],
      "sourceUrl": "https://arcteryx.com/ca/en/shop/womens/squamish-hoody-0268"
    },
    "cadCents": 26000,
    "costKrw": 273000,
    "priceKrw": 279000,
    "krRetailKrw": 310000,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://arcteryx.com/ca/en/shop/womens/squamish-hoody-0268",
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
        ],
        "officialUrl": null,
        "smartstoreUrl": null
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
    "officialUrl": "https://ca.coach.com/en/products/brooklyn-shoulder-bag-28/CDZ42.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 28800,
        "costKrw": 314568,
        "priceKrw": 402700,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 29.2cm · 세로 22.2cm · 폭 7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "우븐 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 26.7cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 27.9cm · 폭 8.3cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "내추럴 그레인 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 26.7cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 27.9cm · 폭 8.3cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "내추럴 그레인 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 26.7cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 31000,
        "costKrw": 338130,
        "priceKrw": 432900,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 29.2cm · 세로 22.2cm · 폭 7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스트로 · 리파인드 카프 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 26.7cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 27.9cm · 폭 8.3cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드 · 그레인 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 26.7cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 27.9cm · 폭 8.3cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드 · 그레인 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 26.7cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/brooklyn-shoulder-bag-34/CCU00.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 34.3cm · 세로 32.4cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "내추럴 그레인 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 31.8cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 34.3cm · 세로 32.4cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "내추럴 그레인 레더"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 31.8cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 34.3cm · 세로 32.4cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 31.8cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 48000,
        "costKrw": 520200,
        "priceKrw": 665900,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 34.3cm · 세로 32.4cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 31.8cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "마그네틱 스냅 여밈"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/chelsea-shoulder-bag-30/CDS58.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 40000,
        "costKrw": 434520,
        "priceKrw": 556200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 29.8cm · 세로 17.8cm · 폭 12.1cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "내추럴 그레인 레더",
              "스웨이드 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "숄더 스트랩 · 드롭 29.2cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 지퍼 포켓",
              "푸시락 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 40000,
        "costKrw": 434520,
        "priceKrw": 556200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 29.8cm · 세로 17.8cm · 폭 12.1cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "내추럴 그레인 레더",
              "스웨이드 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "숄더 스트랩 · 드롭 29.2cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 지퍼 포켓",
              "푸시락 여밈"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/ella-shoulder-bag/CCE47.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 35.6cm · 세로 32.4cm · 폭 6.4cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "소프트 페블 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "조절형 스트랩 · 드롭 28.6cm · 익스텐더 사용 시 드롭 50.8cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 지퍼 포켓",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 35.6cm · 세로 32.4cm · 폭 6.4cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드 · 스무스 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "조절형 스트랩 · 드롭 28.6cm · 익스텐더 사용 시 드롭 50.8cm"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 지퍼 포켓",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/jade-drawstring-bag/CER86.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 27000,
        "costKrw": 295290,
        "priceKrw": 378000,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 14.6cm · 세로 17.1cm · 폭 8.9cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드 · 내추럴 그레인 나파 레더",
              "코튼 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "조절형 스트랩 · 드롭 54.6cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 오픈 포켓",
              "드로스트링 · 마그네틱 스냅 여밈"
            ]
          },
          {
            "label": "그 외",
            "values": [
              "코치 (Re)Loved"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/lana-shoulder-bag-19/CCY32.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.1cm · 세로 23.5cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "폴리시드 페블 레더",
              "패브릭 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 8.9cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 체인 스트랩 · 드롭 54.6cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 슬립 포켓"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.1cm · 세로 23.5cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "폴리시드 페블 레더",
              "패브릭 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 8.9cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 체인 스트랩 · 드롭 54.6cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 슬립 포켓"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 36000,
        "costKrw": 391680,
        "priceKrw": 501400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.1cm · 세로 23.5cm · 폭 10.2cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "폴리시드 페블 레더",
              "패브릭 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 8.9cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 체인 스트랩 · 드롭 54.6cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 슬립 포켓"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/station-carryall-bag/CET29.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 20.3cm · 폭 11.4cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "샤이니 스무스 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 10.2cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 54cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "마그네틱 스냅 여밈",
              "가운데 지퍼 수납칸",
              "8인치(20.3cm) 태블릿 수납"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 20.3cm · 폭 11.4cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "시그니처 코티드 캔버스 · 스무스 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 10.2cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 54cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "마그네틱 스냅 여밈",
              "가운데 지퍼 수납칸",
              "8인치(20.3cm) 태블릿 수납"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 24900,
        "costKrw": 272799,
        "priceKrw": 349200,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 27.9cm · 세로 20.3cm · 폭 11.4cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "시그니처 코티드 캔버스 · 스무스 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "손잡이 · 드롭 10.2cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 54cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "마그네틱 스냅 여밈",
              "가운데 지퍼 수납칸",
              "8인치(20.3cm) 태블릿 수납"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/teri-mini-crossbody-bag-with-quilting/CDP30.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.7cm · 세로 12.7cm · 폭 5.7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "샤이니 스무스 레더",
              "패브릭 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 숏 스트랩 · 드롭 22.2cm",
              "분리형 롱 스트랩 · 드롭 57.2cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "카드 슬롯 2개",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.7cm · 세로 12.7cm · 폭 5.7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "리파인드 페블 레더",
              "리사이클 폴리에스터 안감",
              "패브릭 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 숏 스트랩 · 드롭 22.2cm",
              "분리형 롱 스트랩 · 드롭 57.2cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "카드 슬롯 2개",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.7cm · 세로 12.7cm · 폭 5.7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "리파인드 페블 레더",
              "리사이클 폴리에스터 안감",
              "패브릭 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 숏 스트랩 · 드롭 22.2cm",
              "분리형 롱 스트랩 · 드롭 57.2cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "카드 슬롯 2개",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.7cm · 세로 12.7cm · 폭 5.7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "시그니처 코티드 캔버스",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 숏 스트랩 · 드롭 22.2cm",
              "분리형 롱 스트랩 · 드롭 57.2cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "카드 슬롯 2개",
              "지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 22900,
        "costKrw": 251379,
        "priceKrw": 321800,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 19.7cm · 세로 12.7cm · 폭 5.7cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드 · 스무스 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 숏 스트랩 · 드롭 22.2cm",
              "분리형 롱 스트랩 · 드롭 57.2cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 스냅 포켓",
              "카드 슬롯 2개",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
    "officialUrl": "https://ca.coach.com/en/products/teri-shoulder-bag/CV934.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 24.1cm · 세로 15.2cm · 폭 7.6cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "리파인드 페블 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "분리형 손잡이 · 드롭 21.6cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 57.8cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 멀티 포켓",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 24.1cm · 세로 15.2cm · 폭 7.6cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "리파인드 페블 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "분리형 손잡이 · 드롭 21.6cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 57.8cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 멀티 포켓",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 24.1cm · 세로 15.2cm · 폭 7.6cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "시그니처 코티드 캔버스",
              "패브릭 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "분리형 손잡이 · 드롭 21.6cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 57.8cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 멀티 포켓",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 27900,
        "costKrw": 304929,
        "priceKrw": 390400,
        "specs": [
          {
            "label": "치수",
            "values": [
              "가로 24.1cm · 세로 15.2cm · 폭 7.6cm"
            ]
          },
          {
            "label": "소재",
            "values": [
              "스웨이드 · 스무스 레더",
              "리사이클 폴리에스터 안감"
            ]
          },
          {
            "label": "손잡이",
            "values": [
              "분리형 손잡이 · 드롭 21.6cm"
            ]
          },
          {
            "label": "스트랩",
            "values": [
              "분리형 스트랩 · 드롭 57.8cm · 숄더·크로스보디 겸용"
            ]
          },
          {
            "label": "특징",
            "values": [
              "내부 멀티 포켓",
              "상단 지퍼 여밈"
            ]
          }
        ]
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
    "officialUrl": "https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-cotton-cardigan/100066198.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-cotton-full-zip-sweater/634135.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-cotton-polo-sweater-/650001.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-wool-cashmere-cardigan/100103776.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-wool-cashmere-sweater/100066187.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/men-clothing-sweaters/cable-knit-wool-cashmere-sweater/625239.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/women-clothing-sweaters/cable-knit-cotton-crewneck-cardigan/638619.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/women-clothing-sweaters/cable-knit-cotton-crewneck-sweater/638616.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 21800,
        "costKrw": 239598,
        "priceKrw": 306700
      },
      {
        "color": "Polo Black / White",
        "colorKo": "폴로 블랙 / 화이트",
        "sku": "638616-POLO-BLACK-WHITE",
        "cardImage": "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-black-white-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-black-white.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-black-white-2.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-black-white-3.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-black-white-4.webp",
          "/images/products/polo-cable-knit-cotton-crewneck-sweater-women-polo-black-white-5.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/women-clothing-sweaters/cable-knit-cotton-quarter-zip-sweater/100040971.html#lang=en_CA&rootLevelCat=&br=t&q=Cable-Knit%2BCotton%2BQuarter-Zip%2BSweater&start=1",
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
        "sku": "100040971-HUNTER-NAVY",
        "cardImage": "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-2.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-3.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-4.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-5.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-hunter-navy-6.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 32800,
        "costKrw": 357408,
        "priceKrw": 457500
      },
      {
        "color": "White",
        "colorKo": "화이트",
        "sku": "100040971-WHITE",
        "cardImage": "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-2.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-3.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-4.webp",
          "/images/products/polo-cable-knit-cotton-quarter-zip-sweater-women-white-5.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/women-clothing-sweaters/cable-knit-wool-cashmere-polo-sweater/100058394.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 39800,
        "costKrw": 432378,
        "priceKrw": 553500
      },
      {
        "color": "Collection Camel Melange",
        "colorKo": "컬렉션 카멜 멜란지",
        "sku": "100058394-COLLECTION-CAMEL-MELANGE",
        "cardImage": "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melange-card.webp",
        "detailImages": [
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melange.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melange-2.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melange-3.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melange-4.webp",
          "/images/products/polo-cable-knit-wool-cashmere-polo-sweater-women-collection-camel-melange-5.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://www.ralphlauren.ca/women-clothing-sweaters/cable-knit-wool-cashmere-sweater/648895.html",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://shop.lululemon.com/en-ca/p/hair-accessories/Extra-Large-Claw-Hair-Clip/_/prod11440065",
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "French Press / Burnt Caramel",
        "colorKo": "프렌치 프레스 / 번트 카라멜",
        "sku": "LULULEMON-FRENCH-PRESS-BURNT-CARAMEL",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-french-press-burnt-caramel-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-french-press-burnt-caramel.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-french-press-burnt-caramel-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "Lilac Play / White",
        "colorKo": "릴락 플레이 / 화이트",
        "sku": "LULULEMON-LILAC-PLAY-WHITE",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-lilac-play-white-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-lilac-play-white.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-lilac-play-white-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 2800,
        "costKrw": 36108,
        "priceKrw": 46300
      },
      {
        "color": "Sweet Sorbet / Pink Pearl",
        "colorKo": "스위트 소르베 / 핑크 펄",
        "sku": "LULULEMON-SWEET-SORBET-PINK-PEARL",
        "cardImage": "/images/products/lululemon-extra-large-claw-hair-clip-women-sweet-sorbet-pink-pearl-card.webp",
        "detailImages": [
          "/images/products/lululemon-extra-large-claw-hair-clip-women-sweet-sorbet-pink-pearl.webp",
          "/images/products/lululemon-extra-large-claw-hair-clip-women-sweet-sorbet-pink-pearl-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://shop.lululemon.com/en-ca/p/hair-accessories/Jumbo-Claw-Clip/_/prod11870457",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://shop.lululemon.com/en-ca/p/equipment/Mens-Fast-and-Free-Trail-Running-Vest/_/prod11890040",
    "sizes": [
      "XS/S",
      "M/L",
      "XL/XXL"
    ],
    "variants": [
      {
        "color": "Beach Ball Blue",
        "colorKo": "비치볼 블루",
        "sku": "LULULEMON-BEACH-BALL-BLUE",
        "cardImage": "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-card.webp",
        "detailImages": [
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-2.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-3.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-4.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-5.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-6.webp",
          "/images/products/lululemon-fast-and-free-trail-running-vest-men-beach-ball-blue-7.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      },
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
    "officialUrl": "https://shop.lululemon.com/en-ca/p/equipment/Womens-Fast-and-Free-Trail-Running-Vest/_/prod11890062",
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
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
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 15800,
        "costKrw": 175338,
        "priceKrw": 224500
      }
    ]
  },
  {
    "slug": "canada-goose-crofton-hoodie-kids",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Crofton Hoodie",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 59500,
    "costKrw": 643365,
    "priceKrw": 823600,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "2-3",
      "4-5",
      "6-7"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "5460K-BLACK",
        "cardImage": "/images/products/canada-goose-crofton-hoodie-kids-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-crofton-hoodie-kids-black.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-2.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-3.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-4.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-5.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-6.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-7.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-black-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Ozone Blue",
        "colorKo": "오존 블루",
        "sku": "5460K-OZONE-BLUE",
        "cardImage": "/images/products/canada-goose-crofton-hoodie-kids-ozone-blue-card.webp",
        "detailImages": [
          "/images/products/canada-goose-crofton-hoodie-kids-ozone-blue.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-ozone-blue-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Pink Lemonade",
        "colorKo": "핑크 레모네이드",
        "sku": "5460K-PINK-LEMONADE",
        "cardImage": "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-card.webp",
        "detailImages": [
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-2.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-3.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-4.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-5.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-6.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-7.webp",
          "/images/products/canada-goose-crofton-hoodie-kids-pink-lemonade-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      }
    ]
  },
  {
    "slug": "canada-goose-kids-snowy-owl-parka",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Kids Snowy Owl Parka",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 65000,
    "costKrw": 702270,
    "priceKrw": 899000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "2-3",
      "4-5",
      "6-7"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "4576K-BLACK",
        "cardImage": "/images/products/canada-goose-kids-snowy-owl-parka-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-snowy-owl-parka-black.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-2.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-3.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-4.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-5.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-6.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-7.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-black-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Bloom Pink",
        "colorKo": "블룸 핑크",
        "sku": "4576K-BLOOM-PINK",
        "cardImage": "/images/products/canada-goose-kids-snowy-owl-parka-bloom-pink-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-snowy-owl-parka-bloom-pink.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-bloom-pink-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Oxford Navy",
        "colorKo": "옥스퍼드 네이비",
        "sku": "4576K-OXFORD-NAVY",
        "cardImage": "/images/products/canada-goose-kids-snowy-owl-parka-oxford-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-snowy-owl-parka-oxford-navy.webp",
          "/images/products/canada-goose-kids-snowy-owl-parka-oxford-navy-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      }
    ]
  },
  {
    "slug": "canada-goose-kids-vanier-vest",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Kids Vanier Vest",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 45000,
    "costKrw": 488070,
    "priceKrw": 624800,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "2-3",
      "4-5",
      "6-7"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "4554K-BLACK",
        "cardImage": "/images/products/canada-goose-kids-vanier-vest-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-vanier-vest-black.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-2.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-3.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-4.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-5.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-6.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-7.webp",
          "/images/products/canada-goose-kids-vanier-vest-black-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 45000,
        "costKrw": 488070,
        "priceKrw": 624800
      },
      {
        "color": "Carmine Red",
        "colorKo": "카민 레드",
        "sku": "4554K-CARMINE-RED",
        "cardImage": "/images/products/canada-goose-kids-vanier-vest-carmine-red-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-vanier-vest-carmine-red.webp",
          "/images/products/canada-goose-kids-vanier-vest-carmine-red-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 45000,
        "costKrw": 488070,
        "priceKrw": 624800
      },
      {
        "color": "Early Frost",
        "colorKo": "얼리 프로스트",
        "sku": "4554K-EARLY-FROST",
        "cardImage": "/images/products/canada-goose-kids-vanier-vest-early-frost-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-vanier-vest-early-frost.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-2.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-3.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-4.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-5.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-6.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-7.webp",
          "/images/products/canada-goose-kids-vanier-vest-early-frost-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 45000,
        "costKrw": 488070,
        "priceKrw": 624800
      },
      {
        "color": "Future Dusk",
        "colorKo": "퓨처 더스크",
        "sku": "4554K-FUTURE-DUSK",
        "cardImage": "/images/products/canada-goose-kids-vanier-vest-future-dusk-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-vanier-vest-future-dusk.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-2.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-3.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-4.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-5.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-6.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-7.webp",
          "/images/products/canada-goose-kids-vanier-vest-future-dusk-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 45000,
        "costKrw": 488070,
        "priceKrw": 624800
      },
      {
        "color": "North Star White",
        "colorKo": "노스 스타 화이트",
        "sku": "4554K-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-kids-vanier-vest-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-kids-vanier-vest-north-star-white.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-2.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-3.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-4.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-5.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-6.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-7.webp",
          "/images/products/canada-goose-kids-vanier-vest-north-star-white-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 45000,
        "costKrw": 488070,
        "priceKrw": 624800
      }
    ]
  },
  {
    "slug": "canada-goose-youth-expedition-parka",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Youth Expedition Parka",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 99500,
    "costKrw": 1071765,
    "priceKrw": 1371900,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "XS (6)",
      "S (7-8)",
      "M (10-12)",
      "L (14-16)",
      "XL (18)"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "4552Y-BLACK",
        "cardImage": "/images/products/canada-goose-youth-expedition-parka-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-expedition-parka-black.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-2.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-3.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-4.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-5.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-6.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-7.webp",
          "/images/products/canada-goose-youth-expedition-parka-black-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Bloom Pink",
        "colorKo": "블룸 핑크",
        "sku": "4552Y-BLOOM-PINK",
        "cardImage": "/images/products/canada-goose-youth-expedition-parka-bloom-pink-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-expedition-parka-bloom-pink.webp",
          "/images/products/canada-goose-youth-expedition-parka-bloom-pink-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "North Star White",
        "colorKo": "노스 스타 화이트",
        "sku": "4552Y-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-youth-expedition-parka-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-expedition-parka-north-star-white.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-2.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-3.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-4.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-5.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-6.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-7.webp",
          "/images/products/canada-goose-youth-expedition-parka-north-star-white-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      }
    ]
  },
  {
    "slug": "canada-goose-youth-juniper-parka",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Youth Juniper Parka",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 95000,
    "costKrw": 1023570,
    "priceKrw": 1310200,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "XS (6)",
      "S (7-8)",
      "M (10-12)",
      "L (14-16)",
      "XL (18)"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "4559Y-BLACK",
        "cardImage": "/images/products/canada-goose-youth-juniper-parka-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-juniper-parka-black.webp",
          "/images/products/canada-goose-youth-juniper-parka-black-2.webp",
          "/images/products/canada-goose-youth-juniper-parka-black-3.webp",
          "/images/products/canada-goose-youth-juniper-parka-black-4.webp",
          "/images/products/canada-goose-youth-juniper-parka-black-5.webp",
          "/images/products/canada-goose-youth-juniper-parka-black-6.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 95000,
        "costKrw": 1023570,
        "priceKrw": 1310200
      },
      {
        "color": "Bloom Pink",
        "colorKo": "블룸 핑크",
        "sku": "4559Y-BLOOM-PINK",
        "cardImage": "/images/products/canada-goose-youth-juniper-parka-bloom-pink-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-juniper-parka-bloom-pink.webp",
          "/images/products/canada-goose-youth-juniper-parka-bloom-pink-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 95000,
        "costKrw": 1023570,
        "priceKrw": 1310200
      }
    ]
  },
  {
    "slug": "canada-goose-youth-logan-parka",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Youth Logan Parka",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 89500,
    "costKrw": 964665,
    "priceKrw": 1234800,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "XS (6)",
      "S (7-8)",
      "M (10-12)",
      "L (14-16)",
      "XL (18)"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "4557Y-BLACK",
        "cardImage": "/images/products/canada-goose-youth-logan-parka-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-logan-parka-black.webp",
          "/images/products/canada-goose-youth-logan-parka-black-2.webp",
          "/images/products/canada-goose-youth-logan-parka-black-3.webp",
          "/images/products/canada-goose-youth-logan-parka-black-4.webp",
          "/images/products/canada-goose-youth-logan-parka-black-5.webp",
          "/images/products/canada-goose-youth-logan-parka-black-6.webp",
          "/images/products/canada-goose-youth-logan-parka-black-7.webp",
          "/images/products/canada-goose-youth-logan-parka-black-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 89500,
        "costKrw": 964665,
        "priceKrw": 1234800
      },
      {
        "color": "North Star White",
        "colorKo": "노스 스타 화이트",
        "sku": "4557Y-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-youth-logan-parka-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-logan-parka-north-star-white.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-2.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-3.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-4.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-5.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-6.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-7.webp",
          "/images/products/canada-goose-youth-logan-parka-north-star-white-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 89500,
        "costKrw": 964665,
        "priceKrw": 1234800
      }
    ]
  },
  {
    "slug": "canada-goose-youth-vanier-vest",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Youth Vanier Vest",
    "gender": "kids",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 49500,
    "costKrw": 536265,
    "priceKrw": 686500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": null,
    "sizes": [
      "XS (6)",
      "S (7-8)",
      "M (10-12)",
      "L (14-16)",
      "XL (18)"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "4554Y-BLACK",
        "cardImage": "/images/products/canada-goose-youth-vanier-vest-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-vanier-vest-black.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-2.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-3.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-4.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-5.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-6.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-7.webp",
          "/images/products/canada-goose-youth-vanier-vest-black-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 49500,
        "costKrw": 536265,
        "priceKrw": 686500
      },
      {
        "color": "Carmine Red",
        "colorKo": "카민 레드",
        "sku": "4554Y-CARMINE-RED",
        "cardImage": "/images/products/canada-goose-youth-vanier-vest-carmine-red-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-vanier-vest-carmine-red.webp",
          "/images/products/canada-goose-youth-vanier-vest-carmine-red-2.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 49500,
        "costKrw": 536265,
        "priceKrw": 686500
      },
      {
        "color": "Early Frost",
        "colorKo": "얼리 프로스트",
        "sku": "4554Y-EARLY-FROST",
        "cardImage": "/images/products/canada-goose-youth-vanier-vest-early-frost-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-vanier-vest-early-frost.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-2.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-3.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-4.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-5.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-6.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-7.webp",
          "/images/products/canada-goose-youth-vanier-vest-early-frost-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 49500,
        "costKrw": 536265,
        "priceKrw": 686500
      },
      {
        "color": "Future Dusk",
        "colorKo": "퓨처 더스크",
        "sku": "4554Y-FUTURE-DUSK",
        "cardImage": "/images/products/canada-goose-youth-vanier-vest-future-dusk-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-vanier-vest-future-dusk.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-2.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-3.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-4.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-5.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-6.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-7.webp",
          "/images/products/canada-goose-youth-vanier-vest-future-dusk-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 49500,
        "costKrw": 536265,
        "priceKrw": 686500
      },
      {
        "color": "North Star White",
        "colorKo": "노스 스타 화이트",
        "sku": "4554Y-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-youth-vanier-vest-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-youth-vanier-vest-north-star-white.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-2.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-3.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-4.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-5.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-6.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-7.webp",
          "/images/products/canada-goose-youth-vanier-vest-north-star-white-8.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 49500,
        "costKrw": 536265,
        "priceKrw": 686500
      }
    ]
  },
  {
    "slug": "canada-goose-crofton-enduraluxe-vest-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Crofton EnduraLuxe Vest",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 65000,
    "costKrw": 702270,
    "priceKrw": 899000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/crofton-enduraluxe-vest-1925MB.html?Color=9061",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "1925MB-BLACK",
        "cardImage": "/images/products/canada-goose-crofton-enduraluxe-vest-men-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-black.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-black-2.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-black-3.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-black-4.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-black-5.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-black-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/crofton-enduraluxe-vest-1925MB.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Limestone",
        "colorKo": "라임스톤",
        "sku": "1925MB-LIMESTONE",
        "cardImage": "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone-2.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone-3.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone-4.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone-5.webp",
          "/images/products/canada-goose-crofton-enduraluxe-vest-men-limestone-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/crofton-enduraluxe-vest-1925MB.html?Color=9432",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      }
    ]
  },
  {
    "slug": "canada-goose-freestyle-crew-vest-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Freestyle Crew Vest",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 69500,
    "costKrw": 750465,
    "priceKrw": 960600,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-black-disc-4159MB.html",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black Disc / North Star White",
        "colorKo": "블랙 디스크 / 노스 스타 화이트",
        "sku": "4159MB-BLACK-DISC-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white-2.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white-3.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white-4.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white-5.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-black-disc-north-star-white-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-black-disc-4159MB.html",
        "smartstoreUrl": null,
        "cadCents": 69500,
        "costKrw": 750465,
        "priceKrw": 960600
      },
      {
        "color": "Classic Disc / Atlantic Navy",
        "colorKo": "클래식 디스크 / 애틀랜틱 네이비",
        "sku": "2054M-CLASSIC-DISC-ATLANTIC-NAVY",
        "cardImage": "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy-2.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy-3.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy-4.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy-5.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-atlantic-navy-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-2054M.html?Color=63",
        "smartstoreUrl": null,
        "cadCents": 69500,
        "costKrw": 750465,
        "priceKrw": 960600
      },
      {
        "color": "Classic Disc / Black",
        "colorKo": "클래식 디스크 / 블랙",
        "sku": "2054M-CLASSIC-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black-2.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black-3.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black-4.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black-5.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-black-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-2054M.html?Color=61",
        "smartstoreUrl": null,
        "cadCents": 69500,
        "costKrw": 750465,
        "priceKrw": 960600
      },
      {
        "color": "Classic Disc / Graphite",
        "colorKo": "클래식 디스크 / 그래파이트",
        "sku": "2054M-CLASSIC-DISC-GRAPHITE",
        "cardImage": "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite-card.webp",
        "detailImages": [
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite-2.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite-3.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite-4.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite-5.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-graphite-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-2054M.html?Color=66",
        "smartstoreUrl": null,
        "cadCents": 69500,
        "costKrw": 750465,
        "priceKrw": 960600
      },
      {
        "color": "Classic Disc / Limestone",
        "colorKo": "클래식 디스크 / 라임스톤",
        "sku": "2054M-CLASSIC-DISC-LIMESTONE",
        "cardImage": "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone-2.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone-3.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone-4.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone-5.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-limestone-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-2054M.html?Color=432",
        "smartstoreUrl": null,
        "cadCents": 69500,
        "costKrw": 750465,
        "priceKrw": 960600
      },
      {
        "color": "Classic Disc / Sagebrush",
        "colorKo": "클래식 디스크 / 세이지브러시",
        "sku": "2054M-CLASSIC-DISC-SAGEBRUSH",
        "cardImage": "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush-card.webp",
        "detailImages": [
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush-2.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush-3.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush-4.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush-5.webp",
          "/images/products/canada-goose-freestyle-crew-vest-men-classic-disc-sagebrush-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/freestyle-crew-vest-2054M.html?Color=852",
        "smartstoreUrl": null,
        "cadCents": 69500,
        "costKrw": 750465,
        "priceKrw": 960600
      }
    ]
  },
  {
    "slug": "canada-goose-garson-vest-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Garson Vest",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 65000,
    "costKrw": 702270,
    "priceKrw": 899000,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/garson-vest-black-disc-2081MB.html?Color=9061",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "2081MB-BLACK",
        "cardImage": "/images/products/canada-goose-garson-vest-men-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-garson-vest-men-black.webp",
          "/images/products/canada-goose-garson-vest-men-black-2.webp",
          "/images/products/canada-goose-garson-vest-men-black-3.webp",
          "/images/products/canada-goose-garson-vest-men-black-4.webp",
          "/images/products/canada-goose-garson-vest-men-black-5.webp",
          "/images/products/canada-goose-garson-vest-men-black-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/garson-vest-black-disc-2081MB.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Coastal Grey",
        "colorKo": "코스탈 그레이",
        "sku": "2081MB-COASTAL-GREY",
        "cardImage": "/images/products/canada-goose-garson-vest-men-coastal-grey-card.webp",
        "detailImages": [
          "/images/products/canada-goose-garson-vest-men-coastal-grey.webp",
          "/images/products/canada-goose-garson-vest-men-coastal-grey-2.webp",
          "/images/products/canada-goose-garson-vest-men-coastal-grey-3.webp",
          "/images/products/canada-goose-garson-vest-men-coastal-grey-4.webp",
          "/images/products/canada-goose-garson-vest-men-coastal-grey-5.webp",
          "/images/products/canada-goose-garson-vest-men-coastal-grey-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/garson-vest-black-disc-2081MB.html?Color=811",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "North Star White",
        "colorKo": "노스 스타 화이트",
        "sku": "2081MB-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-garson-vest-men-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-garson-vest-men-north-star-white.webp",
          "/images/products/canada-goose-garson-vest-men-north-star-white-2.webp",
          "/images/products/canada-goose-garson-vest-men-north-star-white-3.webp",
          "/images/products/canada-goose-garson-vest-men-north-star-white-4.webp",
          "/images/products/canada-goose-garson-vest-men-north-star-white-5.webp",
          "/images/products/canada-goose-garson-vest-men-north-star-white-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/garson-vest-black-disc-2081MB.html?Color=433",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Taupe Grey",
        "colorKo": "토프 그레이",
        "sku": "2081MB-TAUPE-GREY",
        "cardImage": "/images/products/canada-goose-garson-vest-men-taupe-grey-card.webp",
        "detailImages": [
          "/images/products/canada-goose-garson-vest-men-taupe-grey.webp",
          "/images/products/canada-goose-garson-vest-men-taupe-grey-2.webp",
          "/images/products/canada-goose-garson-vest-men-taupe-grey-3.webp",
          "/images/products/canada-goose-garson-vest-men-taupe-grey-4.webp",
          "/images/products/canada-goose-garson-vest-men-taupe-grey-5.webp",
          "/images/products/canada-goose-garson-vest-men-taupe-grey-6.webp"
        ],
        "officialUrl": null,
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Terra",
        "colorKo": "테라",
        "sku": "2081MB-TERRA",
        "cardImage": "/images/products/canada-goose-garson-vest-men-terra-card.webp",
        "detailImages": [
          "/images/products/canada-goose-garson-vest-men-terra.webp",
          "/images/products/canada-goose-garson-vest-men-terra-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/garson-vest-black-disc-2081MB.html?Color=9842",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      },
      {
        "color": "Volcano",
        "colorKo": "볼케이노",
        "sku": "2081MB-VOLCANO",
        "cardImage": "/images/products/canada-goose-garson-vest-men-volcano-card.webp",
        "detailImages": [
          "/images/products/canada-goose-garson-vest-men-volcano.webp",
          "/images/products/canada-goose-garson-vest-men-volcano-2.webp",
          "/images/products/canada-goose-garson-vest-men-volcano-3.webp",
          "/images/products/canada-goose-garson-vest-men-volcano-4.webp",
          "/images/products/canada-goose-garson-vest-men-volcano-5.webp",
          "/images/products/canada-goose-garson-vest-men-volcano-6.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/garson-vest-black-disc-2081MB.html?Color=9782",
        "smartstoreUrl": null,
        "cadCents": 65000,
        "costKrw": 702270,
        "priceKrw": 899000
      }
    ]
  },
  {
    "slug": "canada-goose-langford-parka-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Langford Parka",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 169500,
    "costKrw": 1821465,
    "priceKrw": 2331500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-2052M.html",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Classic Disc / Atlantic Navy",
        "colorKo": "클래식 디스크 / 애틀랜틱 네이비",
        "sku": "2052M-CLASSIC-DISC-ATLANTIC-NAVY",
        "cardImage": "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-2.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-3.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-4.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-5.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-6.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-atlantic-navy-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-2052M.html",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Classic Disc / Black",
        "colorKo": "클래식 디스크 / 블랙",
        "sku": "2052M-CLASSIC-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-langford-parka-men-classic-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-classic-disc-black.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-black-2.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-black-3.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-black-4.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-black-5.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-black-6.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-2052M.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Classic Disc / Limestone",
        "colorKo": "클래식 디스크 / 라임스톤",
        "sku": "2052M-CLASSIC-DISC-LIMESTONE",
        "cardImage": "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-2.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-3.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-4.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-5.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-6.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-limestone-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-2052M.html?Color=432",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Classic Disc / Oxford Navy",
        "colorKo": "클래식 디스크 / 옥스퍼드 네이비",
        "sku": "2052M-CLASSIC-DISC-OXFORD-NAVY",
        "cardImage": "/images/products/canada-goose-langford-parka-men-classic-disc-oxford-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-classic-disc-oxford-navy.webp",
          "/images/products/canada-goose-langford-parka-men-classic-disc-oxford-navy-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-2052M.html?Color=9841",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Tonal Disc / Vireo Green",
        "colorKo": "토널 디스크 / 비레오 그린",
        "sku": "2052MT-TONAL-DISC-VIREO-GREEN",
        "cardImage": "/images/products/canada-goose-langford-parka-men-tonal-disc-vireo-green-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-tonal-disc-vireo-green.webp",
          "/images/products/canada-goose-langford-parka-men-tonal-disc-vireo-green-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-tonal-disc-2052MT.html",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Black Disc / Black",
        "colorKo": "블랙 디스크 / 블랙",
        "sku": "2052MB-BLACK-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-langford-parka-men-black-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-black-disc-black.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-black-2.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-black-3.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-black-4.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-black-5.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-black-6.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-black-disc-2052MB.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Black Disc / Limestone",
        "colorKo": "블랙 디스크 / 라임스톤",
        "sku": "2052MB-BLACK-DISC-LIMESTONE",
        "cardImage": "/images/products/canada-goose-langford-parka-men-black-disc-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone-2.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone-3.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone-4.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone-5.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone-6.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-limestone-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-black-disc-2052MB.html?Color=9432",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Black Disc / North Star White",
        "colorKo": "블랙 디스크 / 노스 스타 화이트",
        "sku": "2052MB-BLACK-DISC-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-2.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-3.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-4.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-5.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-6.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-north-star-white-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-black-disc-2052MB.html?Color=433",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Black Disc / Ozone Blue",
        "colorKo": "블랙 디스크 / 오존 블루",
        "sku": "2052MB-BLACK-DISC-OZONE-BLUE",
        "cardImage": "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-card.webp",
        "detailImages": [
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-2.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-3.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-4.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-5.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-6.webp",
          "/images/products/canada-goose-langford-parka-men-black-disc-ozone-blue-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/langford-parka-black-disc-2052MB.html",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      }
    ]
  },
  {
    "slug": "canada-goose-lodge-hoodie-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Lodge Hoodie",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 99500,
    "costKrw": 1071765,
    "priceKrw": 1371900,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-black-disc-5078MB.html?Color=9061",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black Disc / Black",
        "colorKo": "블랙 디스크 / 블랙",
        "sku": "5078MB-BLACK-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-2.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-3.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-4.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-5.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-6.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-7.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-8.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-9.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-10.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-black-11.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-black-disc-5078MB.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Black Disc / Desert Sand",
        "colorKo": "블랙 디스크 / Desert Sand",
        "sku": "5078MB-BLACK-DISC-DESERT-SAND",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-2.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-3.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-4.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-5.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-6.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-7.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-8.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-9.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-10.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-desert-sand-11.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-black-disc-5078MB.html?Color=1483",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Black Disc / Stratus Grey",
        "colorKo": "블랙 디스크 / Stratus Grey",
        "sku": "5078MB-BLACK-DISC-STRATUS-GREY",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-black-disc-stratus-grey-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-stratus-grey.webp",
          "/images/products/canada-goose-lodge-hoodie-men-black-disc-stratus-grey-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-black-disc-5078MB.html?Color=9838",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Classic Disc / Atlantic Navy",
        "colorKo": "클래식 디스크 / 애틀랜틱 네이비",
        "sku": "5078M-CLASSIC-DISC-ATLANTIC-NAVY",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-2.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-3.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-4.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-5.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-6.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-atlantic-navy-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-5078M.html",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Classic Disc / Black",
        "colorKo": "클래식 디스크 / 블랙",
        "sku": "5078M-CLASSIC-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-2.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-3.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-4.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-5.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-6.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-5078M.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Classic Disc / Carmine Red",
        "colorKo": "클래식 디스크 / 카민 레드",
        "sku": "5078M-CLASSIC-DISC-CARMINE-RED",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-2.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-3.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-4.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-5.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-6.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-carmine-red-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-5078M.html?Color=9839",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      },
      {
        "color": "Classic Disc / Military Tan",
        "colorKo": "클래식 디스크 / 밀리터리 탄",
        "sku": "5078M-CLASSIC-DISC-MILITARY-TAN",
        "cardImage": "/images/products/canada-goose-lodge-hoodie-men-classic-disc-military-tan-card.webp",
        "detailImages": [
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-military-tan.webp",
          "/images/products/canada-goose-lodge-hoodie-men-classic-disc-military-tan-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/lodge-hoodie-5078M.html?Color=9113",
        "smartstoreUrl": null,
        "cadCents": 99500,
        "costKrw": 1071765,
        "priceKrw": 1371900
      }
    ]
  },
  {
    "slug": "canada-goose-macmillan-parka-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "MacMillan Parka",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 145000,
    "costKrw": 1559070,
    "priceKrw": 1995700,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-black-disc-2080MB.html",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black Disc / Black",
        "colorKo": "블랙 디스크 / 블랙",
        "sku": "2080MB-BLACK-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-macmillan-parka-men-black-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black-2.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black-3.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black-4.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black-5.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black-6.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-black-disc-2080MB.html",
        "smartstoreUrl": null,
        "cadCents": 145000,
        "costKrw": 1559070,
        "priceKrw": 1995700
      },
      {
        "color": "Black Disc / North Star White",
        "colorKo": "블랙 디스크 / 노스 스타 화이트",
        "sku": "2080MB-BLACK-DISC-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-2.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-3.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-4.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-5.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-6.webp",
          "/images/products/canada-goose-macmillan-parka-men-black-disc-north-star-white-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-black-disc-2080MB.html?Color=433",
        "smartstoreUrl": null,
        "cadCents": 145000,
        "costKrw": 1559070,
        "priceKrw": 1995700
      },
      {
        "color": "Classic Disc / Atlantic Navy",
        "colorKo": "클래식 디스크 / 애틀랜틱 네이비",
        "sku": "2080M-CLASSIC-DISC-ATLANTIC-NAVY",
        "cardImage": "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-2.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-3.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-4.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-5.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-6.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-atlantic-navy-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-2080M.html?Color=9063",
        "smartstoreUrl": null,
        "cadCents": 145000,
        "costKrw": 1559070,
        "priceKrw": 1995700
      },
      {
        "color": "Classic Disc / Black",
        "colorKo": "클래식 디스크 / 블랙",
        "sku": "2080M-CLASSIC-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-2.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-3.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-4.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-5.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-6.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-2080M.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 145000,
        "costKrw": 1559070,
        "priceKrw": 1995700
      },
      {
        "color": "Classic Disc / Granite Grey",
        "colorKo": "클래식 디스크 / 그래나이트 그레이",
        "sku": "2080M-CLASSIC-DISC-GRANITE-GREY",
        "cardImage": "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-card.webp",
        "detailImages": [
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-2.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-3.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-4.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-5.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-6.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-granite-grey-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-2080M.html?Color=9431",
        "smartstoreUrl": null,
        "cadCents": 145000,
        "costKrw": 1559070,
        "priceKrw": 1995700
      },
      {
        "color": "Classic Disc / Limestone",
        "colorKo": "클래식 디스크 / 라임스톤",
        "sku": "2080M-CLASSIC-DISC-LIMESTONE",
        "cardImage": "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-2.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-3.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-4.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-5.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-6.webp",
          "/images/products/canada-goose-macmillan-parka-men-classic-disc-limestone-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/macmillan-parka-2080M.html?Color=9432",
        "smartstoreUrl": null,
        "cadCents": 145000,
        "costKrw": 1559070,
        "priceKrw": 1995700
      }
    ]
  },
  {
    "slug": "canada-goose-murray-parka-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Murray Parka",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 169500,
    "costKrw": 1821465,
    "priceKrw": 2331500,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/murray-parka-1741M.html?Color=9061",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black",
        "colorKo": "블랙",
        "sku": "1741M-BLACK",
        "cardImage": "/images/products/canada-goose-murray-parka-men-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-murray-parka-men-black.webp",
          "/images/products/canada-goose-murray-parka-men-black-2.webp",
          "/images/products/canada-goose-murray-parka-men-black-3.webp",
          "/images/products/canada-goose-murray-parka-men-black-4.webp",
          "/images/products/canada-goose-murray-parka-men-black-5.webp",
          "/images/products/canada-goose-murray-parka-men-black-6.webp",
          "/images/products/canada-goose-murray-parka-men-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/murray-parka-1741M.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Military Tan",
        "colorKo": "밀리터리 탄",
        "sku": "1741M-MILITARY-TAN",
        "cardImage": "/images/products/canada-goose-murray-parka-men-military-tan-card.webp",
        "detailImages": [
          "/images/products/canada-goose-murray-parka-men-military-tan.webp",
          "/images/products/canada-goose-murray-parka-men-military-tan-2.webp",
          "/images/products/canada-goose-murray-parka-men-military-tan-3.webp",
          "/images/products/canada-goose-murray-parka-men-military-tan-4.webp",
          "/images/products/canada-goose-murray-parka-men-military-tan-5.webp",
          "/images/products/canada-goose-murray-parka-men-military-tan-6.webp",
          "/images/products/canada-goose-murray-parka-men-military-tan-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/murray-parka-1741M.html",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      },
      {
        "color": "Nocturne",
        "colorKo": "녹턴",
        "sku": "1741M-NOCTURNE",
        "cardImage": "/images/products/canada-goose-murray-parka-men-nocturne-card.webp",
        "detailImages": [
          "/images/products/canada-goose-murray-parka-men-nocturne.webp",
          "/images/products/canada-goose-murray-parka-men-nocturne-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/murray-parka-1741M.html?Color=9858",
        "smartstoreUrl": null,
        "cadCents": 169500,
        "costKrw": 1821465,
        "priceKrw": 2331500
      }
    ]
  },
  {
    "slug": "canada-goose-wyndham-parka-men",
    "brand": "Canada Goose",
    "brandSlug": "canada-goose",
    "name": "Wyndham Parka",
    "gender": "men",
    "category": "outerwear",
    "originCountry": "CA",
    "material": null,
    "care": null,
    "manufacturer": "Canada Goose",
    "cadCents": 59500,
    "costKrw": 643365,
    "priceKrw": 823600,
    "krRetailKrw": null,
    "shippingKrw": null,
    "smartstoreUrl": null,
    "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-black-disc-2048MB.html?Color=9061",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "variants": [
      {
        "color": "Black Disc / Black",
        "colorKo": "블랙 디스크 / 블랙",
        "sku": "2048MB-BLACK-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-black-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-black-disc-2048MB.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Black Disc / Dusk Blue",
        "colorKo": "블랙 디스크 / Dusk Blue",
        "sku": "2048MB-BLACK-DISC-DUSK-BLUE",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-black-disc-dusk-blue-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-black-disc-dusk-blue.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-dusk-blue-2.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-black-disc-2048MB.html?Color=9128",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Black Disc / Limestone",
        "colorKo": "블랙 디스크 / 라임스톤",
        "sku": "2048MB-BLACK-DISC-LIMESTONE",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-limestone-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-black-disc-2048MB.html?Color=432",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Black Disc / North Star White",
        "colorKo": "블랙 디스크 / 노스 스타 화이트",
        "sku": "2048MB-BLACK-DISC-NORTH-STAR-WHITE",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-black-disc-north-star-white-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-black-disc-2048MB.html?Color=9433",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Classic Disc / Atlantic Navy",
        "colorKo": "클래식 디스크 / 애틀랜틱 네이비",
        "sku": "2048M-CLASSIC-DISC-ATLANTIC-NAVY",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-atlantic-navy-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-2048M.html?Color=9063",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Classic Disc / Black",
        "colorKo": "클래식 디스크 / 블랙",
        "sku": "2048M-CLASSIC-DISC-BLACK",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-black-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-2048M.html?Color=9061",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Classic Disc / Granite Grey",
        "colorKo": "클래식 디스크 / 그래나이트 그레이",
        "sku": "2048M-CLASSIC-DISC-GRANITE-GREY",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-granite-grey-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-black-disc-2048MB.html?Color=9128",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      },
      {
        "color": "Classic Disc / Limestone",
        "colorKo": "클래식 디스크 / 라임스톤",
        "sku": "2048M-CLASSIC-DISC-LIMESTONE",
        "cardImage": "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-card.webp",
        "detailImages": [
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-2.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-3.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-4.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-5.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-6.webp",
          "/images/products/canada-goose-wyndham-parka-men-classic-disc-limestone-7.webp"
        ],
        "officialUrl": "https://www.canadagoose.com/ca/en/pr/wyndham-parka-2048M.html?Color=9432",
        "smartstoreUrl": null,
        "cadCents": 59500,
        "costKrw": 643365,
        "priceKrw": 823600
      }
    ]
  }
];

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}
