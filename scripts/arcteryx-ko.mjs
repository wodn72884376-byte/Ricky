/**
 * 아크테릭스 공식몰 상세 문구 → 한국어.
 *
 * ## 왜 사전인가 (정규식 치환이 아니라)
 * `scripts/import-catalog.mjs` 의 `FABRIC_KO` 는 단어 단위 치환이다. 케어 라벨처럼
 * 어휘가 짧은 곳에서는 통하지만, 아크테릭스의 스펙은 **문장**이다 —
 * `GORE C-KNIT™ backer technology is light, soft and comfortable` 를 단어별로 바꾸면
 * 한국어 어순이 무너져 뜻이 달라진다. 상품 설명은 표시광고의 대상이라 그럴 수 없다.
 *
 * 그래서 **문장 전체를 통째로 맞춘다.** 수집된 값이 24개 상품 · 문장 243종으로
 * 닫혀 있어 가능한 방식이다.
 *
 * ## 못 찾으면 원문을 둔다
 * 사전에 없는 문장은 영문 그대로 내보내고 경고한다. 지어낸 한국어를 상세 페이지에
 * 띄우는 것보다 영문이 남는 편이 낫다 — 공식몰이 문구를 바꾸면 여기서 드러난다.
 *
 * ## 옮기지 않는 것
 * 고유명사와 규격은 그대로 둔다: GORE-TEX®, ePE, C-KNIT™, Coreloft™, Fortius™,
 * Tyono™, Hadron™, Octa®, StormHood™, DropHood™, RECCO®, WaterTight™, Cohaesive™,
 * bluesign®, DWR, UPF, 데니어(D)·gsm. 옮기면 오히려 검색도 대조도 안 된다.
 */

// ── 그룹 값 (Features & Specs) ─────────────────────────────────────

/** Technical features — 한두 단어짜리 특성 라벨 */
const TECHNICAL = {
  Breathable: '통기성',
  'Compressible and packable': '압축·수납 가능',
  Durable: '내구성',
  'Great warmth-to-weight ratio': '무게 대비 보온성 우수',
  Insulated: '충전재 내장',
  Lightweight: '경량',
  'Moisture-resistant outer face fabric': '발수 겉감',
  Ultralight: '초경량',
  Versatile: '다용도',
  'Water repellent': '발수',
  'Water resistant': '생활 방수',
  Waterproof: '방수',
  'Weather resistant': '악천후 대응',
  'Wind resistant': '바람 저항',
  Windproof: '방풍',
};

/** Collar configuration */
const COLLAR = {
  'Tricot lined collar for next-to-skin comfort': '트리코 안감을 댄 칼라가 살갗에 부드럽게 닿아요',
};

/** Construction — 원단과 구조 설명 */
const CONSTRUCTION = {
  '40gsm Coreloft™ insulation is made with recycled content and offers lightweight warmth':
    '40gsm Coreloft™ 충전재는 리사이클 소재로 만들었고 가벼운 보온을 줘요',
  '80D ePE SSD (Soft Shell Dope Dyed) - flannel backer for added comfort':
    '80D ePE SSD(원액 염색 소프트셸) — 플란넬 이면으로 착용감을 더했어요',
  'Aequora AirPerm™ fabric is lightweight and comfortable next to skin in warm weather, has elastane for stretch':
    'Aequora AirPerm™ 원단은 가볍고 더운 날 살갗에 닿는 감촉이 편하며, 엘라스테인이 들어가 늘어나요',
  'Breathable 20D recycled nylon liner helps regulate temperature and is soft and comfortable next to the skin':
    '통기되는 20D 리사이클 나일론 안감이 체온을 조절하고 살갗에 부드럽게 닿아요',
  'Breathable material dumps excess heat on windy hikes':
    '통기되는 소재가 바람 부는 하이킹에서 남는 열을 빼 줘요',
  'Breathable, waterproof, wind-resistant GORE-TEX® PRO ePE on the body for lightweight protection':
    '몸판에 통기·방수·방풍 GORE-TEX® PRO ePE를 써서 가볍게 보호해요',
  'Breathable, waterproof, wind-resistant GORE-TEX® PRO ePE on the upper yoke and hood for durability in high-moisture zones':
    '어깨 요크와 후드에 통기·방수·방풍 GORE-TEX® PRO ePE를 써서 물기가 많이 닿는 부위를 튼튼하게 했어요',
  '750 fill power European grey goose down provides lightweight, efficient warmth and is RDS (Responsible Down Standard) certified':
    '750 필파워 유러피언 그레이 구스다운이 가볍고 효율적으로 따뜻하게 해 줘요. RDS(책임 다운 기준) 인증을 받았어요',
  'Canvas-like face fabric for a rugged look and soft hand feel':
    '캔버스 같은 겉감이 거친 인상을 주면서, 손에 닿는 감촉은 부드러워요',
  'Down Composite Mapping™ strategically places synthetic insulation in areas where moisture may buildup and down in areas for maximum warmth':
    'Down Composite Mapping™으로 물기가 차기 쉬운 부위에는 합성 충전재를, 보온이 중요한 부위에는 다운을 나눠 넣었어요',
  'GORE-TEX® ePE for durable weather protection, made with recycled content and free from intentionally added PFAS':
    'GORE-TEX® ePE가 오래가는 날씨 보호를 줘요. 리사이클 소재로 만들었고 PFAS를 의도적으로 넣지 않았어요',
  'Highly air-permeable Fortius™ Air 20 stretch mesh fabric at the back and under the sleeves provides enhanced ventilation':
    '통기성이 아주 좋은 Fortius™ Air 20 신축 메시를 등판과 소매 아래에 써서 열을 더 잘 빼요',
  'Highly breathable Permeair™ backer is coloured with dope-dyed yarns, using fewer resources than traditional dye processes':
    '통기가 좋은 Permeair™ 이면은 원액 염색 실로 색을 내, 기존 염색보다 자원을 덜 써요',
  'PFAS-free 2L GORE-TEX® fabric with a recycled nylon face provides zonal weather resistance on the body and sleeves':
    'PFAS를 넣지 않은 2L GORE-TEX®에 리사이클 나일론 겉감을 더해, 몸판과 소매를 부위별로 날씨에서 지켜요',
  'Recycled face fabric is durable in all conditions': '리사이클 겉감이 어떤 조건에서도 튼튼해요',
  'Warm, resilient Coreloft™ synthetic insulation provides thermal performance and retains loft':
    '따뜻하고 복원력 좋은 Coreloft™ 합성 충전재가 보온을 주고 부피감을 유지해요',
  'Flannel backer for light insulation': '플란넬 이면이 가볍게 보온해요',
  'Fortius™ 1.0 softshell enables stretch and air flow automatically releasing excess heat':
    'Fortius™ 1.0 소프트셸이 늘어나고 공기를 통과시켜 남는 열을 저절로 빼 줘요',
  'Fortius™ Air 20 face fabric effectively balances air permeability and weather resistance with lightweight durability and stretch':
    'Fortius™ Air 20 겉감이 통기성과 날씨 대응, 가벼운 내구성과 신축성 사이에서 균형을 잡아요',
  'Fortius™ DW 2.0 softshell in specific areas provide durability, breathability, weather resistance, and stretch, and is made with recycled content':
    '특정 부위에 쓴 Fortius™ DW 2.0 소프트셸이 내구성·통기성·날씨 대응·신축성을 주고, 리사이클 소재로 만들었어요',
  'GORE C-KNIT™ backer technology is light, soft and comfortable':
    'GORE C-KNIT™ 이면 기술로 가볍고 부드러우며 편안해요',
  'GORE C-KNIT™ backer technology is quiet, soft next-to-skin, highly breathable, and made with recycled content':
    'GORE C-KNIT™ 이면 기술로 소리가 적고 살갗에 부드러우며 통기가 뛰어나고, 리사이클 소재로 만들었어요',
  'GORE nylon face fabric is windproof, is made from recycled content, and delivers expedition-ready durability':
    'GORE 나일론 겉감은 방풍이고 리사이클 소재로 만들었으며, 원정에 쓸 만한 내구성을 줘요',
  'GORE-TEX® ePE delivers waterproof, windproof, breathable weather protection without intentionally added PFAS':
    'GORE-TEX® ePE가 PFAS를 의도적으로 넣지 않고도 방수·방풍·투습으로 날씨를 막아 줘요',
  'GORE-TEX® PRO ePE fabric free from intentionally added PFAS provides lightweight, durable, waterproof, windproof, breathable protection':
    'PFAS를 의도적으로 넣지 않은 GORE-TEX® PRO ePE 원단이 가볍고 튼튼하게 방수·방풍·투습으로 보호해요',
  'GORE-TEX® PRO ePE on the yoke and upper arms resists abrasion and provides breathable protection from wind and rain':
    '요크와 팔 윗부분의 GORE-TEX® PRO ePE가 마모를 견디고 비바람을 통기되게 막아 줘요',
  'GORE-TEX® with ePE membrane is waterproof, breathable, and free from intentionally added PFAS':
    'ePE 멤브레인을 쓴 GORE-TEX®는 방수·투습이고 PFAS를 의도적으로 넣지 않았어요',
  'Hardwearing 200D recycled nylon canvas face for added durability':
    '튼튼한 200D 리사이클 나일론 캔버스 겉감으로 내구성을 더했어요',
  'Hardwearing Fortius™ 2.0 softshell fabric has increased warmth to weight ratio and durability, with wind resistance and a DWR finish':
    '튼튼한 Fortius™ 2.0 소프트셸 원단이 무게 대비 보온성과 내구성을 높이고, 바람을 막으며 DWR 발수 처리를 했어요',
  'Heavyweight 315gsm blend of organic cotton and recycled nylon delivers stretch and durability for season after season of cragging':
    '두툼한 315gsm 유기농 면·리사이클 나일론 혼방이 신축성과 내구성을 줘서 여러 시즌 크래깅을 견뎌요',
  'Hybrid Mapping technology puts specific fabrics where they are most effective':
    'Hybrid Mapping 기술로 각 원단을 가장 잘 쓰이는 자리에 배치했어요',
  'Light, soft Tyono™ 20 is air permeable': '가볍고 부드러운 Tyono™ 20이 공기를 통과시켜요',
  'Lightweight stretch Octa® Fleece side panels provide freedom of movement and improve ventilation':
    '가볍고 신축성 있는 Octa® 플리스 옆판이 움직임을 자유롭게 하고 통기를 높여요',
  'Made from stretch fibres and wicking yarns for technical performance':
    '신축 섬유와 흡습 속건 원사로 만들어 기능성을 높였어요',
  'Made with an innovative GORE-TEX® fabric that provides a long product life, is PFC free, and has a reduced carbon footprint':
    '오래 쓰고 PFC를 쓰지 않으며 탄소 발자국을 줄인 GORE-TEX® 원단으로 만들었어요',
  'Mechanical stretch textile for unrestricted mobility':
    '기계적 신축 원단으로 움직임을 막지 않아요',
  'Octa® Loft breathable insulation provides thermal protection':
    '통기되는 Octa® Loft 충전재가 보온해 줘요',
  'Our proprietary Hadron™ face fabric delivers ultralight performance and alpine-tested durability':
    '아크테릭스 자체 개발 Hadron™ 겉감이 초경량 성능과 알파인에서 검증된 내구성을 줘요',
  'Performance stretch fleece side panels give ventilation':
    '신축 플리스 옆판이 통기를 도와요',
  'PFAS-free GORE-TEX® ePE with a recycled face delivers complete waterproof, windproof, breathable protection':
    'PFAS를 쓰지 않은 GORE-TEX® ePE와 리사이클 겉감이 방수·방풍·투습을 온전히 갖췄어요',
  'PFC-free GORE-TEX® ePE membrane provides breathable weather protection and is laminated to a bio-based nylon face made with fibres derived from plants':
    'PFC를 쓰지 않은 GORE-TEX® ePE 멤브레인이 통기되게 날씨를 막고, 식물에서 뽑은 섬유로 만든 바이오 기반 나일론 겉감에 접합했어요',
  'Resilient Coreloft™ Compact 60 insulation is breathable, warm, and light, performs if wet, and delivers loft retention that resists packing out':
    '탄력 있는 Coreloft™ Compact 60 충전재는 통기되고 따뜻하며 가볍고, 젖어도 성능을 유지하면서 눌려도 부피가 되살아나요',
  'Shell fabric contains 57% recycled nylon': '겉감에 리사이클 나일론이 57% 들어갔어요',
  'Soft knit liner adds comfort against bare skin': '부드러운 니트 안감이 맨살에 닿는 감촉을 편하게 해요',
  'Stretch synthetic insulation is breathable, warm, and light, adds freedom of movement, and is made with recycled content':
    '신축 신슐레이션은 통기되고 따뜻하며 가볍고, 움직임을 자유롭게 하며 리사이클 소재로 만들었어요',
  'Taped seams for weather resistance, a low-profile finish, and added strength':
    '심실링 처리로 날씨를 막고 마감을 얇게 하며 강도를 더했어요',
  'Tyono™ 30D fabric offers impressive wind resistance, stretch, breathability, and strength for its weight':
    'Tyono™ 30D 원단이 무게에 비해 뛰어난 방풍·신축·통기·강도를 줘요',
};

/** Cuff & Sleeves configuration */
const CUFF = {
  "Die-cut Velcro® cuff adjusters reduce bulk, and won't catch or tear off":
    '다이컷 Velcro® 소매 조절 탭이 부피를 줄이고, 어디에 걸리거나 뜯어지지 않아요',
  'Adjustable cuff with Velcro® closure': 'Velcro® 여밈으로 조절되는 소매단',
  'Adjustable cuffs': '조절되는 소매단',
  'Adjustable Velcro® closure at cuff': '소매단의 조절되는 Velcro® 여밈',
  'Elasticized cuffs': '신축 밴드 소매단',
  'Glove-friendly cuff tabs keep sleeves secure and seal out weather':
    '장갑을 낀 채 잡을 수 있는 소매 탭이 소매를 고정하고 바람을 막아요',
  'Glove-friendly Velcro cuff adjusters secure the sleeves':
    '장갑을 낀 채 쓸 수 있는 Velcro 소매 조절 장치가 소매를 고정해요',
  'Internal stretch-knit cuffs': '안쪽 신축 니트 소매단',
  'Low profile elasticized cuffs': '얇게 마감한 신축 밴드 소매단',
  'Stretch-knit cuffs': '신축 니트 소매단',
  'Stretchy cuff binding': '신축 소매단 바인딩',
  'Uninsulated, mesh lined sleeves give light protection and regulate temperature':
    '충전재 없이 메시로 안감을 댄 소매가 가볍게 보호하고 체온을 조절해요',
};

/** Design & Fit (기장 문장은 아래 PATTERNS 에서 처리한다) */
const DESIGN_FIT = {
  'Mid thigh length': '허벅지 중간 기장',
  'Cropped length design': '크롭 기장 디자인',
  'Fitted, with articulated patterning for mobility and comfort':
    '몸에 붙는 핏에 입체 패턴을 넣어 움직임과 편안함을 함께 잡았어요',
  'Pleated back and sleeves for improved freedom of movement and comfort':
    '등판과 소매에 플리츠를 넣어 움직임과 편안함을 높였어요',
  'Recycled Coreloft™ insulation delivers breathable warmth that resists packing out':
    '리사이클 Coreloft™ 충전재가 통기되는 보온을 주고 눌려도 부피가 되살아나요',
  'Regular fit provides freedom of movement': '레귤러 핏으로 움직임이 자유로워요',
  'Regular fit provides freedom of movement with room for layers':
    '레귤러 핏으로 움직임이 자유롭고 안에 겹쳐 입을 여유가 있어요',
  'Relaxed fit for comfort and easy layering': '여유 있는 핏으로 편안하고 겹쳐 입기 좋아요',
  'Relaxed, high-volume fit wears easily over fleece or layers':
    '여유 있고 볼륨 있는 핏이라 플리스나 다른 레이어 위에 편하게 입어요',
  'Side hem vent for improved mobility and freedom of stride':
    '옆 밑단 벤트로 움직임과 보폭이 자유로워요',
  'Trim, slim fit, optimizes exceptional breathability during high output':
    '군더더기 없는 슬림한 핏으로 활동량이 많을 때 통기가 잘 돼요',
};

/** Fabric treatment */
const FABRIC_TREATMENT = {
  'DWR (Durable Water Repellent) finish repels moisture': 'DWR(내구성 발수) 처리로 물기를 튕겨 내요',
  'DWR (Durable Water Repellent) finish repels moisture and is free from intentionally added PFAS':
    'DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요',
  'FC0 DWR (Durable Water Repellent) finish repels moisture and is free from intentionally added PFAS':
    'FC0 DWR(내구성 발수) 처리로 물기를 튕겨 내고 PFAS를 의도적으로 넣지 않았어요',
  'FC0-DWR (Durable Water Repellent) finish repels moisture': 'FC0-DWR(내구성 발수) 처리로 물기를 튕겨 내요',
};

/** Hem configuration */
const HEM = {
  'Adjustable hem draw cord seals out drafts': '조절되는 밑단 드로코드가 찬 바람을 막아요',
  'Cinching system at hem': '밑단 조임 장치',
  'Cohaesive hem adjusters are glove-friendly and double as a harness stop, keeping the jacket neatly secured':
    'Cohaesive 밑단 조절 장치는 장갑을 낀 채 쓸 수 있고, 하네스 스토퍼 역할도 해서 재킷을 깔끔하게 고정해요',
  'Cohaesive™ hem adjustments for ease of use with mittens or gloves':
    '벙어리장갑이나 장갑을 낀 채로 쓰기 쉬운 Cohaesive™ 밑단 조절 장치',
  'Dual hem cinches seal out drafts and adjust length':
    '양쪽 밑단 조임이 찬 바람을 막고 기장을 조절해요',
  'Dual lower hem adjusters': '양쪽 밑단 조절 장치',
  'Durable stitched hem with dual adjusters to seal out drafts':
    '튼튼하게 박은 밑단과 양쪽 조절 장치로 찬 바람을 막아요',
  'Elasticated hem seal in warmth': '신축 밴드 밑단이 온기를 가둬요',
  'Elasticized bottom hem for secure fit': '신축 밴드 밑단으로 안정적으로 맞아요',
  'Elasticized hem and cuffs keep out weather': '신축 밴드 밑단과 소매단이 바깥 날씨를 막아요',
};

/** Hood configuration */
const HOOD = {
  'Adjustable hood provides custom protection': '조절되는 후드로 원하는 만큼 가려요',
  'Adjustable, insulated StormHood™': '조절되는 충전재 내장 StormHood™',
  'Coreloft-insulated StormHood™ provides added warmth even if wet':
    'Coreloft 충전재를 넣은 StormHood™가 젖어도 온기를 더해 줘요',
  'Insulated adjustable StormHood™ provides full coverage and has an integrated insulated collar for added protection':
    '충전재를 넣은 조절식 StormHood™가 머리를 온전히 덮고, 안에 이어진 충전 칼라가 보호를 더해요',
  'Adjustable drop hood keeps neck covered when hood is not in use':
    '조절되는 드롭 후드는 쓰지 않을 때 목을 덮어 줘요',
  'Adjustable hood drawcord with single pull adjuster': '한 번 당겨 조절하는 후드 드로코드',
  'Adjustable insulated hood': '조절되는 충전재 후드',
  'Adjustable low profile StormHood™': '얇게 마감한 조절식 StormHood™',
  'Adjustable StormHood™': '조절되는 StormHood™',
  'Adjustable, insulated, low profile StormHood™ with structured mini hood brim':
    '형태를 잡은 미니 챙이 달린, 조절되는 얇은 충전재 StormHood™',
  'Adjustable, low profile uninsulated StormHood™': '충전재 없이 얇게 마감한 조절식 StormHood™',
  'Helmet compatible': '헬멧 위로 착용 가능',
  'Helmet compatible DropHood™': '헬멧 위로 쓰는 DropHood™',
  'Helmet compatible StormHood™ provides full coverage without impacting visibility':
    '헬멧 위로 쓰는 StormHood™가 시야를 가리지 않으면서 머리를 완전히 덮어요',
  'Hidden hood adjusters': '감춰 둔 후드 조절 장치',
  'Hood provides full coverage and uses a unique precision adjustment system to improve fit without impacting peripheral vision':
    '후드가 머리를 완전히 덮고, 정밀 조절 장치로 주변 시야를 가리지 않으면서 맞춤새를 높여요',
  'Internal cordlocks in hood for adjustability': '후드 안쪽 코드록으로 조절해요',
  'Single pull adjuster does not restrict vision': '한 번 당기는 조절 장치가 시야를 막지 않아요',
  'Stowable hood': '접어 넣는 후드',
};

/** Integrated features · Logos & Label · UPF */
const MISC_GROUPS = {
  "Arc'teryx bird and word logo placed on chest": "가슴에 Arc'teryx 버드·워드 로고",
  'Embroidered logo': '자수 로고',
  'Sterilization Permit Number- PER. NO. PA-8811 (CA)': '살균 허가 번호 — PER. NO. PA-8811 (캐나다)',
  'Reinforced clip-in loop lets you attach the packed jacket to your harness or pack for easy access':
    '보강한 클립 루프로 접은 재킷을 하네스나 배낭에 걸어 두고 바로 꺼내 쓸 수 있어요',
  "Arc'teryx Bird logo": "Arc'teryx 버드 로고",
  'UPF 50+, EN 13758-2, AS4399:2020, GB/T 18830-2009. Only covered areas are protected. Protection may be reduced with use or if stretched or wet.':
    'UPF 50+ (EN 13758-2, AS4399:2020, GB/T 18830-2009). 옷이 덮은 부위만 보호돼요. 오래 입거나 늘어나거나 젖으면 차단 효과가 줄 수 있어요.',
};

/** Patterning */
const PATTERNING = {
  'Articulated patterning for unrestricted mobility': '입체 패턴으로 움직임을 막지 않아요',
  'Climb-specific articulated patterning provides mobility and comfort, layers easily':
    '등반에 맞춘 입체 패턴이 움직임과 편안함을 주고 겹쳐 입기 좋아요',
  'Gusseted underarms provide a stationary hem that does not lift with overhead motion':
    '겨드랑이 거싯 덕분에 팔을 위로 올려도 밑단이 들리지 않아요',
};

/** Pocket configuration */
const POCKET = {
  'Chest pocket': '가슴 포켓',
  'Chest pocket with laminated zip': '라미네이트 지퍼 가슴 포켓',
  'Internal dump pocket': '안쪽 덤프 포켓',
  'Note: Our WaterTight™ zippers are highly water resistant, but not waterproof. We do not recommend keeping items in your pockets that may be damaged by moisture':
    '참고: WaterTight™ 지퍼는 물에 아주 강하지만 완전 방수는 아니에요. 물기에 상할 물건은 포켓에 넣지 않기를 권해요',
  'Two chest pockets': '가슴 포켓 2개',
  'Two external dump pockets': '바깥 덤프 포켓 2개',
  'Two hand pockets with WaterTight™ zippers': 'WaterTight™ 지퍼 핸드 포켓 2개',
  'Two insulated hand pockets with zippers': '충전재를 넣은 지퍼 핸드 포켓 2개',
  'Two internal chest pockets': '안쪽 가슴 포켓 2개',
  'Chest pocket with zip': '지퍼 가슴 포켓',
  'Chest pocket with zip allows easy access when wearing harness and pack':
    '지퍼 가슴 포켓은 하네스와 배낭을 멘 채로도 꺼내기 쉬워요',
  'Dual chest pockets with zip': '양쪽 지퍼 가슴 포켓',
  'Harness friendly zippered hand pockets': '하네스와 함께 쓸 수 있는 지퍼 핸드 포켓',
  'Internal chest pocket': '안쪽 가슴 포켓',
  'Internal chest pocket with zip': '안쪽 지퍼 가슴 포켓',
  'Internal laminated pocket with zip': '안쪽 라미네이트 지퍼 포켓',
  'Internal mesh dump pocket': '안쪽 메시 덤프 포켓',
  'Internal zippered pocket': '안쪽 지퍼 포켓',
  'Internal zippered security pocket': '안쪽 지퍼 보안 포켓',
  'One internal dump pocket': '안쪽 덤프 포켓 1개',
  'One left bicep pocket with WaterTight™ zipper and RS™ Zipper Sliders':
    'WaterTight™ 지퍼와 RS™ 슬라이더가 달린 왼팔 포켓 1개',
  'Single chest pocket stores jacket for compact storage':
    '가슴 포켓 하나에 재킷을 접어 넣어 작게 보관해요',
  'Single stretch woven zippered chest pocket': '신축 우븐 지퍼 가슴 포켓 1개',
  'Sleeve pocket for RFID pass': 'RFID 패스를 넣는 소매 포켓',
  'Two bonded hand pockets with bellow': '주름을 넣어 본딩한 핸드 포켓 2개',
  'Two concealed zippered hand pockets': '감춘 지퍼 핸드 포켓 2개',
  'Two hand pockets': '핸드 포켓 2개',
  'Two hand pockets with hidden zippers': '지퍼를 감춘 핸드 포켓 2개',
  'Two hand pockets with zippers': '지퍼 핸드 포켓 2개',
  'Two harness-compatible chest pockets': '하네스와 함께 쓸 수 있는 가슴 포켓 2개',
  'Two harness-compatible chest pockets with waterproof zippers keep essentials close and accessible while climbing':
    '방수 지퍼가 달린 하네스 호환 가슴 포켓 2개로, 등반 중에도 필요한 물건을 가까이 두고 꺼낼 수 있어요',
  'Two internal dump pockets': '안쪽 덤프 포켓 2개',
  'Two zippered hand warmer pockets': '지퍼 핸드워머 포켓 2개',
  'Two zippered, flapped hand pockets': '덮개가 달린 지퍼 핸드 포켓 2개',
  'Zippered internal security pocket': '안쪽 지퍼 보안 포켓',
};

/** Snowsport features */
const SNOWSPORT = {
  'Hidden RECCO® reflector': '감춘 RECCO® 리플렉터',
  "Slide 'n Loc™ attachment fits compatible pants":
    "Slide 'n Loc™ 연결 장치로 호환 팬츠와 이어 붙여요",
  'Integrated powder skirt seals out snow': '안에 달린 파우더 스커트가 눈을 막아요',
  'RECCO® reflector aids search and rescue in emergency situations':
    'RECCO® 리플렉터가 조난 시 수색·구조를 도와요',
  'RECCO® reflector built into the brim for added searchability':
    '후드 챙에 넣은 RECCO® 리플렉터가 수색 가능성을 높여요',
  "Slide 'n Loc™ attachment fits compatible pants and jackets to form a unified system that seals out snow":
    "Slide 'n Loc™ 연결 장치로 호환 팬츠·재킷과 이어 붙여 눈이 들어오지 않게 해요",
};

/** Sustainability — 조합형 문장은 PATTERNS 에서 처리한다 */
const SUSTAINABILITY = {
  'Feather - This product contains feather not exceeding that allowable by law':
    '깃털 — 법이 허용하는 범위를 넘지 않는 깃털이 들어 있어요',
  'RDS (Responsible Down Standard) - 100% of our down is certified to the RDS by IDFL (No.TE-99950273)':
    'RDS(책임 다운 기준) — 사용한 다운 100%가 IDFL의 RDS 인증을 받았어요 (No.TE-99950273)',
  'Contains materials produced through processes that meet bluesign® criteria':
    'bluesign® 기준을 충족하는 공정으로 만든 소재가 들어갔어요',
  'Dope dyed': '원액 염색',
  'Dope dyed backer': '원액 염색 이면',
  'Dope dyed face': '원액 염색 겉면',
  'FC0 DWR': 'FC0 DWR 발수',
  'PFAS (Per- and polyfluoroalkyl substances) Compliant': 'PFAS(과불화화합물) 규제 준수',
  'Recycled content': '리사이클 소재',
  'This article was treated with an anti-odour biocidal product (Polygiene)':
    '방취 처리(Polygiene)를 한 제품이에요',
};

/** Zippers & Fly configuration */
const ZIPPER = {
  'Full separating two-way front zip': '완전히 분리되는 양방향 앞지퍼',
  'Full-length two-way separating side zips make on-and-off easy':
    '전체 길이 양방향 분리 사이드 지퍼로 입고 벗기 쉬워요',
  'Two-way front zipper': '양방향 앞지퍼',
  'All zippers are WaterTight™ and feature RS™ Zipper Sliders for smooth operation':
    '모든 지퍼가 WaterTight™이고 RS™ 슬라이더가 달려 부드럽게 여닫혀요',
  'Custom TPU zipper pulls are easy to operate and glove-friendly':
    '전용 TPU 지퍼 풀은 잡기 쉽고 장갑을 낀 채로도 쓸 수 있어요',
  'Custom zipper pulls are glove-friendly': '전용 지퍼 풀은 장갑을 낀 채로도 쓸 수 있어요',
  'Full front zip': '앞면 전체 지퍼',
  'No Slip Zip™ front zipper': 'No Slip Zip™ 앞지퍼',
  'Pit zippers for easy venting': '겨드랑이 지퍼로 열을 쉽게 빼요',
  'WaterTight™ Vislon front zip with chin guard': '턱 보호대가 달린 WaterTight™ Vislon 앞지퍼',
};

/** Manufacturing facility — 공장 고유명사. 나라 이름만 옮긴다 */
const FACILITY = {
  'Zplus Company Limited, China': 'Zplus Company Limited · 중국',
  'Maxport Limited (Viet Nam)- Nam Dinh- Maxport 5, Vietnam':
    'Maxport Limited (Viet Nam) — Nam Dinh, Maxport 5 · 베트남',
  'Vast Apparel Vietnam LTD., Vietnam': 'Vast Apparel Vietnam LTD. · 베트남',
  'Vastco Garments LTD, Vietnam': 'Vastco Garments LTD · 베트남',
  'Youngone (CEPZ) LTD, Bangladesh': 'Youngone (CEPZ) LTD · 방글라데시',
  'Youngone Nam Dinh Company LTD, Vietnam': 'Youngone Nam Dinh Company LTD · 베트남',
};

const VALUE_KO = {
  ...TECHNICAL, ...COLLAR, ...CONSTRUCTION, ...CUFF, ...DESIGN_FIT, ...FABRIC_TREATMENT,
  ...HEM, ...HOOD, ...MISC_GROUPS, ...PATTERNING, ...POCKET, ...SNOWSPORT,
  ...SUSTAINABILITY, ...ZIPPER, ...FACILITY,
};

// ── 조합형 문장 ────────────────────────────────────────────────────

/** Sustainability 의 `Shell - recycled content, FC0 DWR` 같은 조합에서 쓰는 조각들 */
const PART_KO = {
  Body: '겉감', Shell: '겉감', Lining: '안감', Contrast: '배색', Insulation: '충전재',
  Padding: '충전재',
};

const CLAIM_KO = {
  'recycled content': '리사이클 소재',
  'FC0 DWR': 'FC0 DWR 발수',
  'C0 DWR': 'C0 DWR 발수',
  'bluepass Material': 'bluepass 소재',
  'dope dyed backer': '원액 염색 이면',
  'dope dyed face': '원액 염색 겉면',
  'dope dyed some colours': '일부 색상 원액 염색',
  'dope dyed': '원액 염색',
  'organically grown cotton': '유기농 면',
};

/**
 * 자리표시자가 든 문장. 사전으로는 감당이 안 되는 것만 여기 둔다 —
 * 사이즈별 기장은 24개 상품에서 16종이 나오는데 전부 같은 문형이다.
 */
const PATTERNS = [
  [
    /^Garment Centre Back Length: Size (\S+) is [\d.]+"\/([\d.]+)cm - Varies by size$/,
    (m) => `총장(뒤 중심 기준): ${m[1]} 사이즈 ${m[2]}cm · 사이즈마다 달라져요`,
  ],
  [
    /^(Body|Shell|Lining|Contrast|Insulation|Padding) - (.+)$/,
    (m) => {
      const claims = m[2].split(',').map((c) => CLAIM_KO[c.trim()] ?? null);
      // 하나라도 모르는 조각이 있으면 통째로 포기한다. 반만 번역된 문장은 오히려 나쁘다.
      if (claims.some((c) => c === null)) return null;
      return `${PART_KO[m[1]]} — ${claims.join(', ')}`;
    },
  ],
];

/** 그룹 값 하나를 옮긴다. 모르면 원문을 그대로 두고 경고한다. */
export function koValue(en, warn) {
  const direct = VALUE_KO[en];
  if (direct) return direct;
  for (const [re, fn] of PATTERNS) {
    const m = en.match(re);
    if (m) {
      const out = fn(m);
      if (out) return out;
    }
  }
  warn?.(`아크테릭스 값 미등록: "${en}"`);
  return en;
}

// ── Fit & Sizing ──────────────────────────────────────────────────

export const FIT_KO = {
  Regular: {
    label: '레귤러',
    text: '가슴·허리·엉덩이·허벅지를 편안하게 재단한 클래식 핏이에요. 움직임이 자유롭고 실루엣이 살아 있으며, 다른 레이어 위나 아래에 편하게 겹쳐 입을 수 있어요.',
  },
  Fitted: {
    label: '피티드',
    text: '가슴·허리·엉덩이·허벅지를 몸에 가깝게 잡은 슬림한 핏이에요. 얇은 실루엣이 부피를 줄이고 몸을 따라 움직이며, 베이스 레이어 위나 아우터 안에 편하게 들어가요.',
  },
  Relaxed: {
    label: '릴랙스드',
    text: '가슴·허리·엉덩이·허벅지를 여유 있게 재단한 핏이에요. 구조와 깔끔한 선을 잃지 않으면서 편안함과 움직임의 자유를 주고, 조금 더 캐주얼하게 보여요.',
  },
  Oversized: {
    label: '오버사이즈',
    text: '몸 전체를 가장 넉넉하게 재단한 핏이에요. 내려온 어깨선과 넓은 소매가 움직임을 자유롭게 하면서, 드레이프와 구조를 함께 살려 요즘의 실루엣을 만들어요.',
  },
};

export function koFit(fit, warn) {
  if (!fit) return null;
  const hit = fit.label ? FIT_KO[fit.label] : null;
  if (fit.label && !hit) warn?.(`아크테릭스 핏 미등록: "${fit.label}"`);
  return { label: hit?.label ?? fit.label, text: hit?.text ?? fit.text };
}

// ── Care ──────────────────────────────────────────────────────────

/**
 * 케어 라벨. 지시문이지만 명사형으로 통일한다 —
 * 라벨은 문장이 아니라 항목이고, 고시 표에서 쉼표로 이어 붙기 때문이다.
 */
const CARE_KO = {
  'Close all fastenings before wash': '세탁 전 여밈 모두 잠그기',
  'Do not bleach': '표백 금지',
  'Do not dry clean': '드라이클리닝 금지',
  'Do not iron': '다림질 금지',
  'Do not leave wet': '젖은 채로 방치 금지',
  'Do not use fabric softener': '섬유유연제 사용 금지',
  'Do not wring': '비틀어 짜기 금지',
  'Double rinse': '두 번 헹구기',
  'Front load washer recommended': '드럼 세탁기 권장',
  'Iron low': '낮은 온도로 다림질',
  'Machine wash gentle low': '세탁기 약한 코스·낮은 온도',
  'Machine wash low': '세탁기 낮은 온도',
  'Machine wash medium': '세탁기 중간 온도',
  'Machine wash permanent press medium': '세탁기 퍼머넌트 프레스·중간 온도',
  'Remove immediately': '건조 후 즉시 꺼내기',
  'Tumble dry gentle low': '건조기 약하게·낮은 온도',
  'Tumble dry low with tennis balls': '건조기 낮은 온도 · 테니스공을 함께 넣기',
  'Tumble dry normal low': '건조기 일반·낮은 온도',
  'Tumble dry normal medium': '건조기 일반·중간 온도',
  'Tumble dry permanent press low': '건조기 퍼머넌트 프레스·낮은 온도',
  'Use mesh bag for top load washer': '통돌이 세탁기는 세탁망 사용',
  'Wash dark colours separately': '진한 색은 따로 세탁',
  'Wash separately': '단독 세탁',
};

export function koCare(en, warn) {
  const hit = CARE_KO[en];
  if (hit) return hit;
  warn?.(`아크테릭스 취급 문구 미등록: "${en}"`);
  return en;
}

// ── Materials ─────────────────────────────────────────────────────

/**
 * 소재 줄은 문장이 아니라 **규격**이다 (`Body: 80d 3L GORE-TEX® ePE … - 100% Nylon`).
 * 그래서 여기만은 조각 치환을 쓴다 — 규격은 어순이 바뀌지 않기 때문이다.
 * 원단 이름(GORE-TEX®·Fortius™·데니어·gsm)은 건드리지 않는다.
 */
const SECTION_KO = [
  [/^Body:/, '겉감:'],
  [/^Shell:/, '겉감:'],
  [/^Lining:/, '안감:'],
  [/^Contrast:/, '배색:'],
  [/^Synthetic Insulation:/, '충전재(합성):'],
  [/^Insulation:/, '충전재:'],
];

const FIBER_KO = {
  'Recycled Polyester': '리사이클 폴리에스터',
  Polyarylate: '폴리아릴레이트',
  Polyester: '폴리에스터',
  Elastane: '엘라스테인',
  Spandex: '스판덱스',
  Cotton: '면',
  Nylon: '나일론',
  Wool: '울',
};

const ORIGIN_LABEL_KO = { 'Origin of fabric': '원단 원산지', 'Origin of dyeing': '염색 원산지' };
const ORIGIN_PLACE_KO = {
  CHINA: '중국', JAPAN: '일본', 'TAIWAN, CHINA': '대만, 중국', VIETNAM: '베트남',
  BANGLADESH: '방글라데시', INDONESIA: '인도네시아', KOREA: '대한민국', TAIWAN: '대만',
};

/**
 * 규격 줄의 서술어. **긴 것부터 맞춘다** — `plain weave` 를 먼저 바꾸면
 * `double weave ripstop` 이 반만 번역된다.
 * 원단 이름(GORE-TEX®·Fortius™·Tyono™·Hadron™·Octa®·Coreloft™)과 수치는 건드리지 않는다.
 */
const SPEC_KO = [
  [/Cotton\/Nylon Blend Canvas/gi, '면·나일론 혼방 캔버스'],
  [/Recycled Polyester Brushed Pocket Mesh/gi, '리사이클 폴리에스터 기모 포켓 메시'],
  [/Polyester Octa Rachel knit Insulation/gi, '폴리에스터 Octa 라셀 니트 충전재'],
  [/Nylon Mini-Rip Lightweight Mechanical Stretch/gi, '나일론 미니립 경량 기계 신축'],
  [/Synthetic Stretch Softshell/gi, '합성 신축 소프트셸'],
  [/Woven Double Weave/gi, '이중직 우븐'],
  [/Circular Knit Fleece/gi, '환편 니트 플리스'],
  [/double weave ripstop/gi, '이중직 립스톱'],
  [/with poly fleece backer/gi, '· 폴리 플리스 이면'],
  [/with (C-KNIT™) backer/g, '· $1 이면'],
  [/with (FC0 DWR|C0 DWR)/gi, '· $1'],
  [/dope dyed/gi, '원액 염색'],
  [/\bPolyester\b/g, '폴리에스터'],
  [/nylon\/spandex plain weave/gi, '나일론·스판덱스 평직'],
  [/plain weave/gi, '평직'],
  [/weft stretch/gi, '위사 신축'],
  [/\bripstop\b/gi, '립스톱'],
  [/\bBeam Dyed\b/gi, '빔 염색'],
  [/\bJet Dyed\b/gi, '제트 염색'],
  [/\bDelta Face\b/gi, '델타 페이스'],
  [/\brecycled\b/gi, '리사이클'],
  [/\bnylon\b/gi, '나일론'],
  [/\bcanvas\b/gi, '캔버스'],
  [/\bfleece\b/gi, '플리스'],
];

const MATERIAL_NOTE_KO = {
  'May release plastic microfibres into the environment when washing':
    '세탁할 때 미세 플라스틱 섬유가 환경으로 배출될 수 있어요',
};

/**
 * 소재 줄 하나를 옮긴다. `null` 을 돌려주면 그 줄은 버린다는 뜻이다.
 *
 * `Origin of Manufacture` 는 버린다 — 고시 표에 `제조국` 행이 따로 있어서
 * 같은 표 안에 같은 값이 두 번 나오게 된다.
 */
export function koMaterial(en, warn) {
  if (/^Origin of Manufacture:/i.test(en)) return null;

  const note = MATERIAL_NOTE_KO[en];
  if (note) return note;

  const origin = en.match(/^(Origin of \w+):\s*(.+)$/);
  if (origin) {
    const label = ORIGIN_LABEL_KO[origin[1]];
    const place = ORIGIN_PLACE_KO[origin[2].trim().toUpperCase()];
    if (!label || !place) {
      warn?.(`아크테릭스 원산지 표기 미등록: "${en}"`);
      return en;
    }
    return `${label}: ${place}`;
  }

  let out = en;
  for (const [re, to] of SECTION_KO) out = out.replace(re, to);

  // 이면 표기는 성분 앞으로 뺀다. `100% Nylon Backing` → `이면 100% Nylon`
  out = out.replace(/,?\s*(\d+%\s+[A-Za-z ]+?)\s+Backing\b/g, ', 이면 $1');
  out = out.replace(/with ePE (?:and|&) PU Membrane/g, '+ ePE·PU 멤브레인');

  // 성분은 한국어 어순으로 뒤집는다. `100% Nylon` → `나일론 100%`
  // **서술어 치환보다 먼저** 해야 한다 — `Nylon` 이 먼저 한국어가 되면 이 정규식이 못 맞춘다.
  const fibers = Object.keys(FIBER_KO).sort((a, b) => b.length - a.length).join('|');
  out = out.replace(new RegExp(`(\\d+)%\\s+(${fibers})\\b`, 'g'), (_, n, f) => `${FIBER_KO[f]} ${n}%`);

  for (const [re, to] of SPEC_KO) out = out.replace(re, to);

  return out.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
}

// ── Description / Product tip ─────────────────────────────────────

/**
 * 마지막 문단의 상호 참조. 원문은 `Need a heavier option? Try the X.` 한 문형이라
 * 문장 사전에 넣지 않고 조립한다.
 */
const heavier = (name) => `더 두꺼운 옵션이 필요하다면 ${name}를 보세요.`;

/** 여러 상품에 똑같이 붙는 ePE 안내. 한 번만 쓰고 슬러그마다 참조한다. */
const EPE_TIP =
  '새 ePE 멤브레인은 더 가볍고 얇지만, 이전에 쓰던 소재만큼 튼튼하고 오래가요. ' +
  'ePE 멤브레인을 쓴 제품은 겉감이 조금 더 빨리 젖어 보일 수 있는데, 멤브레인 자체의 방수 성능에는 영향이 없어요. ' +
  '겉감이 생각보다 빨리 젖는다면 재킷을 세탁하고 말려 주세요. 유분이 씻겨 나가면서 DWR 발수력이 되돌아와요.';

const SQUAMISH =
  '스쿼미시 후디는 가장 가벼운 레이어가 가장 큰 차이를 만든다는 걸 보여 줘요. ' +
  '티셔츠 위에 걸치든 플리스 위에 겹치든, 이 튼튼한 윈드셸은 무게보다 훨씬 큰 일을 해요 — ' +
  '바람을 막고 한기를 끊으며, 벽에서 움직임을 방해하지 않아요. 바람이 불면 거기 있고, ' +
  '해가 나면 가슴 포켓 안으로 접혀 사라져요. 하네스에 걸어 두면 바람 부는 빌레이와 ' +
  '몸이 떨리는 크럭스에서 늘 손 닿는 곳에 있어요.\n\n' +
  '바뀐 점: 스쿼미시 후디의 발수 처리를 FC0 DWR(내구성 발수)로 바꿨어요. ' +
  '발수력은 그대로면서 PFAS를 의도적으로 넣지 않았어요.';

/**
 * 상품 설명. 슬러그마다 하나씩 둔다 — 설명은 상품마다 다른 글이라
 * 문장 단위로 나눌 수 없다.
 *
 * 원문의 1인칭(`our`, `we`)은 아크테릭스를 가리킨다. RICKY 의 목소리와 섞이지 않게
 * `저희` 대신 `아크테릭스`로 옮긴다.
 */
const DESC_KO = {
  'arcteryx-alpha-jacket-men':
    '알파 재킷은 1g도 아쉬운 빠르고 기술적인 등반을 위해 만들었어요. 그러면서도 믿을 만한 알파인 보호막이라는 조건은 양보하지 않았고요. ' +
    'GORE-TEX PRO ePE에 50D Hadron™ 겉감을 더해 방수·투습과 마모 저항 사이의 균형을 잡았고, 거친 지형과 변하는 날씨에서 매일 입기에 알맞아요. ' +
    '하네스와 함께 쓸 수 있는 구조와 정교한 입체 패턴으로, 어떤 날씨에서도 오를 수 있게 만든 재킷이에요.\n\n' +
    heavier('Alpha SV Jacket'),

  'arcteryx-alpha-sv-jacket-men':
    '산이 이빨을 드러낼 때 필요한 셸이에요. 알파 SV 재킷은 끝없이 혹독한 조건과 긴 등반, ' +
    '세계에서 가장 거친 알파인 지형에서의 오랜 노출을 견디도록 만들었어요. 두툼한 100D GORE-TEX PRO ePE로 만들어 ' +
    '흔들림 없는 방수·투습 성능과 믿을 만한 보호를 주고, 산이 최악일 때도 계속 오를 수 있게 해요.',

  'arcteryx-atom-hoody-men':
    '아톰 후디는 "어떤 재킷을 입지?" 하는 고민의 답이에요. 바람 부는 능선을 지나는 쌀쌀한 숲길 하이킹, ' +
    '암장에서의 클라이밍, 캠프사이트에서 단독으로 입어도 좋고, 투어링이나 습한 겨울 산행에서 미드레이어로도 좋아요. ' +
    'Coreloft 신슐레이션은 가벼운 날씨 변화에도 온기를 지켜서, 활동량이 많은 날에는 사계절 내내 다운보다 나은 선택이에요.\n\n' +
    heavier('Atom SV Hoody'),

  'arcteryx-atom-jacket-men':
    '아톰 후디에서 좋아할 만한 건 그대로 두고 후드만 뺐어요. 아톰 재킷은 활동량 많은 여러 상황을 하나로 감당하는 레이어예요. ' +
    '바람 부는 능선을 지나는 쌀쌀한 숲길 하이킹, 암장에서의 클라이밍, 캠프사이트에서는 단독으로, ' +
    '투어링이나 습한 겨울 산행에서는 미드레이어로 입어요. Coreloft 신슐레이션은 가벼운 날씨 변화에도 온기를 지켜서, ' +
    '활동량이 많은 날에는 사계절 내내 다운보다 나은 선택이에요.\n\n' +
    heavier('Atom SV Jacket'),

  'arcteryx-alpha-sl-jacket-men':
    '알파 SL 재킷은 가장 혹독한 알파인 조건 앞에서도 내구성과 투습, 방수를 내주면서, ' +
    '기술 등반과 긴 산행에 들고 가는 일을 한 번도 망설이지 않을 만큼 가볍고 작게 접혀요. ' +
    '군더더기 없이 기능만 남겼고, 지금까지 만든 GORE-TEX PRO 셸 중 가장 가벼워요.\n\n' +
    '무엇이 달라졌나: GORE-TEX PRO ePE에 자체 개발한 Hadron™ 겉감을 20D 초경량으로 올려, ' +
    'PFAS를 의도적으로 넣지 않으면서 방수·투습 성능은 가장 높였어요. ' +
    '완전히 조절되는 헬멧 호환 StormHood™는 위와 옆 시야를 가리지 않고 딱 맞게 잡히고, ' +
    '납작한 RECCO® 리플렉터를 더해 조난 시 수색 가능성을 높였어요.',

  'arcteryx-beta-insulated-jacket-men':
    '알파인을 만나는 방법은 여러 가지예요. 베타 라인은 다재다능함과 내구성, 날씨 대응을 위해 만들어져 ' +
    '산이 내주는 것을 마음껏 겪게 해 줘요. Coreloft™ Continuous 충전재와 더 지속가능한 방수·투습 40D GORE-TEX 원단을 써서, ' +
    '충전재를 넣은 베타는 추운 날을 위한 재킷이에요. 헬멧과 함께 쓸 수 있는 StormHood™는 옆 시야를 최대한 열어 주도록 조절되고, ' +
    '겨드랑이 지퍼로 열을 빼며, 안에 넣은 RECCO™ 리플렉터가 수색·구조를 도와요.',

  'arcteryx-ralle-down-parka-men':
    '산에서 보내는 모든 순간을 위한 보온과 날씨 보호예요. 랄레 다운 파카는 랄레 중 가장 따뜻하고, ' +
    '구스다운 충전재에 PFAS를 넣지 않은 GORE-TEX를 더해 눈과 바람, 비를 막아요. ' +
    '충전재를 넣은 StormHood에는 충전 칼라가 이어져 있어 더 따뜻하고, 포켓이 여럿이라 넣을 곳이 넉넉해요. ' +
    '기장이 길어 보호 범위가 넓고, 입체 패턴이 움직임을 막지 않아요.',

  'arcteryx-sabre-sv-jacket-men':
    '세이버 SV는 우리가 만든 프리라이드 재킷 중 가장 튼튼해요. 박음질로 붙인 핸드 포켓과 ' +
    '200D GORE-TEX PRO ePE 원단이 방수·방풍·투습을 내주고요. ' +
    '조금 짧게 잡은 프리라이드 전용 핏이 움직임을 자유롭게 해요.',

  'arcteryx-therme-down-parka-men':
    '선은 최소한으로, 날씨 보호는 최대한으로. 테르메 다운 파카는 단정한 인상에 ' +
    '아크테릭스 하드셸의 검증된 구조를 합쳤어요. 비 오는 날의 산책과 도심 나들이를 염두에 두고, ' +
    'GORE-TEX ePE 소재와 조절되는 StormHood™가 찬 바람과 소나기를 막아요. ' +
    '가벼운 구스다운을 엉덩이까지 덮는 긴 기장에 넣어 온기를 가둬서, 사무실에서 저녁 자리까지 편하게 입어요.\n\n' +
    '사이즈 팁: 이 모델은 크게 나온다는 이야기가 있어요. 사이즈 가이드를 보고 고르시고, ' +
    '두 사이즈 사이라면 작은 쪽을, 몸에 붙게 입고 싶다면 한 치수 작게 고르세요.',

  'arcteryx-beta-ar-jacket-men':
    '매서운 겨울 하이킹부터 쾌청한 백컨트리까지, 베타 AR 재킷이 감당해요. 어떤 산행에서도 먼저 집게 되는 하드셸로, ' +
    '하이브리드 구조가 눈과 진눈깨비, 정상의 강한 바람을 버텨요. 어깨 요크와 팔에는 아주 튼튼한 GORE-TEX PRO ePE가 마모를 막고, ' +
    '몸판에는 더 가벼운 원단을 써서 무게와 부피를 줄였어요. 필요한 자리에 필요한 성능을 넣은 재킷이에요.',

  'arcteryx-beta-sl-jacket-men':
    '베타 SL 재킷은 베타 중 가장 가벼우면서, 산에서 실제로 벌어지는 일을 염두에 두고 만들었어요. ' +
    '두루 쓰이도록 설계해 가볍게 접히는 성질을 잃지 않으면서 방수·방풍·투습을 온전히 갖췄고요. ' +
    'GORE-TEX ePE 멤브레인은 가볍고 강하며 PFAS를 의도적으로 넣지 않았어요. C-KNIT 이면 처리가 착용감과 통기를 높이고, ' +
    '헬멧 위로 쓰는 StormHood는 시야를 가리지 않으면서 머리를 덮어요. 겨드랑이 지퍼로 열을 빼고, ' +
    'RECCO 리플렉터가 조난 수색에 도움이 돼요.',

  'arcteryx-gamma-lightweight-hoody-men':
    '마음이 이끄는 대로 나서요. 감마 라이트웨이트 후디는 감마 후디 중 가장 가볍고, 따뜻한 날을 염두에 두고 ' +
    '여러 지형과 조건, 활동을 감당하도록 만든 소프트셸이라 밖에서 보내는 시간이 많은 사람에게 잘 맞아요. ' +
    'Fortius 1.0 소프트셸 원단은 바람을 막고 물을 튕겨 내면서 늘어나고 숨 쉬며, UPF 50+ 자외선 차단을 주고 리사이클 나일론으로 만들었어요. ' +
    '빠르게 조절되는 StormHood가 머리를 덮고, 레귤러 핏은 움직임을 막지 않도록 패턴을 잡았어요.\n\n' +
    heavier('Gamma Hoody'),

  'arcteryx-proton-sl-hoody-men':
    '프로톤 SL 후디는 아크테릭스 인슐레이션 컬렉션에서 가장 가볍고 가장 통기가 좋은 선택이에요. ' +
    '추운 날의 등반이나 서늘한 조건에서 활동량이 많은 운동을 할 때, 몸을 데우는 일에 더는 고민이 필요 없어요. ' +
    '니트 충전재는 배낭 바닥에 아무리 밀어 넣어도 부피감과 형태를 지켜요. 더 중요한 건 몸이 숨을 쉰다는 점이에요 — ' +
    '크럭스를 넘느라 페이스를 올려도 땀범벅으로 남지 않아요.\n\n' +
    heavier('Proton Hoody'),

  'arcteryx-squamish-hoody-men': SQUAMISH,
  'arcteryx-squamish-hoody-women': SQUAMISH,

  'arcteryx-altira-cropped-jacket-women':
    '아크테릭스 디자인 팀이 GORE-TEX ePE로 할 수 있는 일의 경계를 밀어붙인 방수 하드셸이에요. ' +
    '산에서 비구름이 몰려와도 트레일 위에서 몸을 마른 상태로 지켜 줘요. 여유 있는 어깨와 크롭 기장, 등판 플리츠에 ' +
    '실용적인 포켓과 찬 바람을 막는 밑단 조임, 조절되는 StormHood™를 더해 ' +
    '특유의 실루엣과 기술적인 디테일 사이에서 균형을 잡았어요.',

  'arcteryx-atom-jacket-women':
    '아톰은 아웃도어 장비의 기본이에요. 쌀쌀한 알파인 스타트와 갑작스러운 정상의 돌풍에 대비해 통기되는 보온을 꾸준히 줘요. ' +
    '몇 해를 입어도 눌리지 않는 가벼운 Coreloft 충전재와 신축성 있는 플리스 옆판이 열을 붙잡을 곳과 내보낼 곳을 나눠요. ' +
    '하드셸 안에 겹쳐 입으면 젖어도 따뜻한 레이어링이 완성돼요.\n\n' +
    heavier('Atom SV Jacket'),

  'arcteryx-atom-sl-hoody-women':
    '아톰 SL 후디는 기본형보다 가벼우면서, 갖고 있으면 가장 자주 쓰게 되는 옷 중 하나예요. ' +
    '춥고 습한 날씨의 트레일 러닝에서는 단독으로, 산에서 보온과 움직임이 더 필요할 때는 방수 셸 안에 겹쳐 입어요. ' +
    '통기되고 날씨를 막아 주며, 몸판에만 신축 충전재를 넣고 소매와 후드에는 넣지 않아 ' +
    '수납성을 최대한 살리면서 몸통을 집중적으로 데워요.\n\n' +
    heavier('Atom Hoody'),

  'arcteryx-beta-ar-jacket-women':
    '베타 제품군에서 가장 튼튼하고 오래 입는 재킷이에요. 정상을 향해 오르는 길에 비가 옆으로 들이쳐도 ' +
    '전문가 수준의 보호를 주는 올마운틴 하드셸이고요. GORE-TEX PRO ePE를 하이브리드로 섞어 ' +
    '어깨는 더 튼튼하게, 몸판은 더 가볍게 만들어 몸통을 마른 상태로 지켜 줘요. ' +
    '헬멧 위로 쓰는 DropHood를 달아 여닫기도 쉬워요.\n\n' +
    heavier('Beta SV Jacket'),

  'arcteryx-clarkia-ar-insulated-hoody-women':
    '클라키아 AR 인슐레이티드 후디로 서늘한 계절을 충분히 누려요. 가을 클라이밍의 기본이 될 옷이에요. ' +
    '여유 있는 핏과 부드러운 니트 안감이 등반 사이사이 살갗에 닿는 감촉을 편하게 하고, ' +
    '40gsm 신슐레이션은 두툼한 코튼 캔버스 겉감 덕분에 무게보다 훨씬 따뜻해요. ' +
    '조절 장치를 감춘 매끈한 후드, 덮개가 달린 지퍼 핸드 포켓, 안쪽 니트 소매단 같은 디테일이 ' +
    '하루 종일 볼더링과 크래깅을 편하게 해 줘요.',

  'arcteryx-coelle-jacket-women':
    '가볍게 접히는 이 셸이면 비를 계산에서 지울 수 있어요. 짧은 하이킹과 일상에 맞췄고요. ' +
    '3레이어 방수 원단이 체온은 내보내고 물은 들이지 않아요. 이면 처리가 부드러움을 더해서, ' +
    '가게에 뛰어들 때도, 예상 못 한 비 속에서 루트를 마무리할 때도, 긴 산행 뒤 친구들과 한 끼 할 때도 편해요.',

  'arcteryx-gamma-lightweight-hoody-women':
    '감마 라이트웨이트 후디는 감마 중 가장 가벼워요. 여러 지형과 환경, 조건을 감당하도록 만들어 ' +
    '새로운 경험을 찾는 사람에게 맞는 소프트셸이에요. 가볍고 물을 튕겨 내는 Fortius™ 1.0 소프트셸 원단은 ' +
    '늘어나고 숨 쉬며, UPF 50+ 자외선 차단을 주고 리사이클 소재로 만들었어요. 낮게 붙는 후드가 머리를 덮고, ' +
    '지퍼 핸드 포켓이 소지품을 지키며, 슬림한 핏은 얇은 레이어를 겹칠 여유를 두면서도 ' +
    '움직임이 자유롭도록 패턴을 잡았어요.\n\n' +
    heavier('Gamma Hoody'),

  'arcteryx-gamma-mx-hoody-women':
    '보온이 조금 더 필요하지만 완전한 충전재까지는 아니고, 날씨 대응이 조금 더 필요하지만 완전 방수까지는 아닌 날 — ' +
    '감마 MX 후디가 그 자리를 채워요. 하드셸보다 통기가 좋은 소프트셸이라 가벼운 무게로 충분한 보온을 주고, ' +
    '변덕스러운 날씨와 추운 날에 딱 그만큼의 날씨 대응을 해요. 쌀쌀한 하이킹과 접근로에서는 단독으로, ' +
    '춥고 습한 산행에서는 미드레이어로 입어요.',

  'arcteryx-naya-cropped-jacket-women':
    '비바람을 견디도록 만든 가벼운 GORE-TEX ePE 셸이에요. 살갗에 닿는 이면 처리가 후텁지근한 여름 소나기에도 잘 숨 쉬어요. ' +
    '나야의 군더더기 없는 디자인 라인과 크롭 기장이 만나, 하이킹에 바로 나설 수 있는 기술적인 셸을 새로운 핏으로 완성했어요.',

  'arcteryx-naya-cropped-stowhood-jacket-women':
    '가볍고 튼튼한 이 재킷은 당일 하이킹의 거센 바람을 막도록 만들었어요. 통기되는 원단이 트레일에서 땀이 날 때 남는 열을 빼 주고, ' +
    '후드가 필요 없을 때는 칼라 안으로 지퍼로 넣어 둘 수 있어요. 예보에 비는 없지만 바람은 막아야 하는 날, ' +
    '배낭에 넣어 두기 좋은 크롭 레귤러 핏 레이어예요.',

  'arcteryx-sentinel-jacket-women':
    '빅마운틴 스키의 수직 구간을 위해 만든 센티넬 재킷은 튼튼하고 편안한 프리라이드의 정석이에요. ' +
    '내구성 있고 통기되는 80D 3L ePE GORE-TEX가 외부 요소를 막고, 따뜻한 이면 처리로 감촉이 부드러워요. ' +
    '앞서 나간 설계와 인체공학 패턴이 움직임을 막지 않고, WaterTight 겨드랑이 지퍼로 열을 빼며, ' +
    '헬멧 위로 쓰는 StormHood는 머리를 완전히 덮으면서도 시야를 넓게 지키도록 조절돼요. ' +
    '큰 포켓은 안전하게 잠기면서도 꺼내기 쉽고, RECCO® 리플렉터가 수색·구조에 도움이 돼요.\n\n' +
    '이 제품에는 PFAS를 의도적으로 넣지 않았어요.\n\n' +
    EPE_TIP,

  'arcteryx-beta-jacket-men':
    '아크테릭스 GORE-TEX 셸 중 가장 두루 쓰이는 제품이에요. 튼튼한 80D 겉감과, 가볍고 강하며 PFAS를 의도적으로 넣지 않은 ' +
    'GORE‑TEX ePE(팽창 폴리에틸렌) 멤브레인으로 만들어, 탄소 발자국을 줄이면서 오래가는 방수·방풍·투습을 줘요. ' +
    'C-KNIT 이면 처리가 착용감을 높이고, 낮게 붙는 StormHood는 한 번 당기면 조절돼 머리를 덮으면서 시야를 지켜요. ' +
    '입체 패턴이 움직임을 막지 않고, 안에 넣은 RECCO 리플렉터가 조난 수색에 도움이 돼요.',
};

/** `Product tip:` 문단. 지금은 ePE 안내 한 종류뿐이다 */
const TIP_KO = {
  'The new ePE membrane technology is lighter and thinner, but just as strong and durable as the materials we used before. You may notice the face fabric “wetting out” slightly faster in products with ePE membranes, but rest assured this does not affect the waterproofing of the membrane itself. If you notice the fabric wetting out faster than you’d like, simply wash the jacket and dry it to remove the oil contamination and bring the DWR back to its full power.':
    EPE_TIP,
};

/** 상품 설명. 슬러그로 찾는다 — 상품마다 다른 글이라 문장 단위로 나눌 수 없다. */
/*
 * 아울렛(이월) 상품은 정가 상품과 같은 문장을 쓴다. 한 벌만 두고 슬러그를 겹쳐 두면
 * 정가 쪽 문구를 고칠 때 아울렛 쪽만 옛 문장으로 남는 일이 없다.
 * Beta SL 만 원문이 조금 달라(PFC free · 더 두꺼운 옵션 안내) 따로 적는다.
 */
DESC_KO['arcteryx-alpha-sv-jacket-outlet-men'] = DESC_KO['arcteryx-alpha-sv-jacket-men'];
DESC_KO['arcteryx-beta-sl-jacket-outlet-men'] =
  '베타 SL 재킷은 베타 중 가장 가벼우면서, 산에서 실제로 벌어지는 일을 염두에 두고 만들었어요. ' +
  '두루 쓰이도록 설계해 가볍게 접히는 성질을 잃지 않으면서 방수·방풍·투습을 온전히 갖췄고요. ' +
  'GORE-TEX ePE 멤브레인은 가볍고 강하며 PFC를 쓰지 않았어요. C-KNIT 이면 처리가 착용감과 통기를 높이고, ' +
  '헬멧 위로 쓰는 StormHood는 시야를 가리지 않으면서 머리를 덮어요. 겨드랑이 지퍼로 열을 빼고, ' +
  'RECCO 리플렉터가 조난 수색에 도움이 돼요.\n\n' +
  heavier('Beta Jacket');

export function koDescription(slug, en, warn) {
  if (!en) return null;
  const hit = DESC_KO[slug];
  if (hit) return hit;
  warn?.(`아크테릭스 ${slug}: 설명 번역 없음`);
  return en;
}

export function koTip(en, warn) {
  if (!en) return null;
  const hit = TIP_KO[en];
  if (hit) return hit;
  warn?.('아크테릭스 Product tip 번역 없음');
  return en;
}
