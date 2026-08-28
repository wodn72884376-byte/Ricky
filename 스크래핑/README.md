# RICKY 소싱 리서치 파이프라인

한국 인기도 신호 × 캐나다 공식몰 신제품 × CA/KR 가격 비교를 자동화한다.
PROJECT.md §6(공급처 모니터링)의 **상류 단계** — 이미 등록한 SKU를 감시하는 게 아니라,
**무엇을 팔지 발굴**하는 단계다.

```
[1] 한국 인기도 신호      네이버 블로그·카페 언급량 + 검색어 트렌드 (API HUB)
        ↓
[2] 캐나다 공식몰 카탈로그  사이트맵(lastmod) → 신제품 판정 → JSON-LD로 가격·재고·variant
        ↓
[3] 매칭                  상품코드 정확 매칭 → 실패 시 한/영 토큰 유사도
        ↓
[4] 한국 가격             브랜드 한국 공식몰 정가
        ↓
[5] 리포트                마진 산출 → 소싱 우선순위 (Markdown + CSV + JSON)
```

---

## 준비

```bash
cd 스크래핑
npm install
npm run browsers                   # Playwright Chromium

# WSL/리눅스는 시스템 라이브러리가 추가로 필요하다 (1회, sudo)
sudo npx playwright install-deps chromium
#  또는: sudo apt-get install -y libnss3 libnspr4 libasound2t64

cp .env.example .env               # 네이버 API 키 입력
```

### 네이버 API 키 — 2026년 이관 주의

네이버가 검색·데이터랩 API 를 개발자센터에서 **NAVER API HUB(네이버 클라우드)** 로 옮겼다.
그래서 developers.naver.com 애플리케이션 등록 화면의 "사용 API" 드롭다운에는
**검색·데이터랩이 나오지 않는다.** 목록에 없는 게 정상이며, 신규 발급은 HUB 에서 받는다.

| API | 상태 |
|---|---|
| 블로그·카페글·뉴스 검색 | API HUB 로 이관 |
| 검색어 트렌드(데이터랩) | API HUB 로 이관 |
| **쇼핑 검색** | **2026-07-31 종료 · 공식 대체 없음** |

- 신규 발급: https://www.ncloud.com/product/applicationService/naverApiHub
  → `.env` 의 `NAVER_HUB_KEY_ID` / `NAVER_HUB_KEY`
- 기존 developers.naver.com 키가 있으면 **2027-06-30 까지** 그대로 쓸 수 있다
  → `.env` 의 `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

둘 중 무엇이 설정됐는지는 코드가 자동 판별해 도메인과 인증 헤더를 바꾼다.
`npm run doctor` 가 실제로 한 번 호출해 키가 통하는지까지 확인한다.

**쇼핑 검색 종료의 영향** — 국내 "최저가" 축이 사라졌다. 국내 가격 비교는
브랜드 한국 공식몰 정가만 쓴다. 인기도 점수는 유통폭(commerce) 축을 빼고
남은 가중치를 재정규화하므로, 축이 없다고 점수가 깎이지는 않는다.

## 재고 조회 (색상 × 사이즈)

캐나다 공식몰의 **variant 단위** 재고를 조회한다 (PROJECT.md §6).
상품 하나가 아니라 색상 × 사이즈 조합 하나하나가 수집 단위다 — 실제 매입이 일어나는 단위이기 때문이다.

```bash
cp watchlist.example.txt watchlist.txt   # 감시할 상품 URL 을 적는다
npm run stock -- --watch                 # 목록만 조회 (운영에서 쓰는 방식)

npm run stock -- --brand=arcteryx,coach --limit=10   # 카탈로그 최신순 N개
```

산출물은 `data/재고-{타임스탬프}.{md,csv,json}` 세 벌이다.
실행할 때마다 **직전 스냅샷과 대조해 변화를 뽑는다.**

```
| 유형      | 상품                    | 색상   | 사이즈 | 변화                          |
| 품절      | Proton Heavyweight Hoody | Azalea | S     | in_stock → out_of_stock       |
| 재입고    | Beta Jacket Men's       | Black  | XS    | out_of_stock → in_stock       |
| 가격 인상 | Denim Hooded Zip Jacket | Khaki  | XXL   | CA$120.00 → CA$167.50 (+47.50)|
```

마크다운 리포트는 색상 × 사이즈 격자로 그린다 (● 재고 · ◐ 임박 · ○ 품절 · · 미편성).

```
| 색상 \ 사이즈 | XS | S | M | L | XL | XXL | XXXL |
| Black         | ●  | ● | ● | ● | ●  | ●   | ●    |
| Sea Salt      | ●  | ● | ○ | ● | ●  | ●   | ●    |
```

### 사이즈를 어디서 읽는가

브랜드마다 사이즈가 든 자리가 다르다. `src/stock/normalize.ts` 가 이 차이를 흡수한다.

| 대상 | size 필드 | 실제 사이즈 |
|---|---|---|
| Arc'teryx 전 품목 | `"XS"` … `"XXXL"` | size 필드가 정본 |
| Coach 의류 | `"M"` | size 필드 = SKU 토큰 |
| **Coach 신발** | `"extra wide"` (폭 라벨) | **SKU 안에만** — `CCN27 CBD  9.5 D` → `9.5 D` |
| Coach 가방·지갑 | `"large wristlet"` (분류 라벨) | 사이즈 개념 없음 → `-` |

Coach 신발에서 size 필드만 믿으면 9.5 와 10 이 똑같이 "extra wide" 로 뭉개져
사이즈별 재고 조회가 성립하지 않는다. 그래서 SKU 를 파싱해 치수와 폭을 되찾는다.

### 같은 색상·사이즈가 둘 이상일 때

Coach 는 스타일코드가 다른 관련 상품을 한 페이지에 묶어 둔다.
Reagan Penny Loafer 페이지에는 `CAP31` / `CCN27` / `CW699` 세 스타일이 들어 있고,
`CAP31`의 "Black 7 D"와 `CW699`의 "Black 7 D"는 **재고가 서로 다르다.**
그래서 (색상, 사이즈)가 겹치면 스타일코드로 먼저 갈라 매트릭스를 여러 개 그린다.
하나로 뭉개면 한 쪽이 조용히 사라진다.

### 실패는 품절이 아니다

차단·마크업 변경으로 수집이 실패하면 `error` 로 분리해 보고하고, variant 를 0개로 두지 않는다.
실패를 품절로 읽으면 멀쩡한 상품이 판매 중지되고, 마지막 성공값으로 계속 팔면
주문 후 매입 실패로 이어진다 (PROJECT.md §6.3 5번).

---

## 사용

```bash
npm run doctor                       # ① 엔드포인트 생존 확인 — 항상 먼저
npm run stock  -- --watch            # 재고 조회 (색상 × 사이즈) ← 위 절 참조
npm run signals -- --brand=coach     # 한국 인기도 신호만
npm run catalog -- --brand=tommy --new   # 캐나다 카탈로그만
npm run scan    -- --limit=40        # 전체 → data/ 에 리포트 생성
```

| 옵션 | 뜻 |
|---|---|
| `--brand=<key[,key]>` | `arcteryx tommy polo canadagoose lululemon coach tumi`. 기본 전체 |
| `--limit=<n>` | 브랜드당 수집 상품 수 (기본 25) |
| `--new` | 최근 120일 내 신제품만 |
| `--fresh` | 캐시 무시 |
| `--no-signals` | 네이버 인기도 신호 생략 |
| `--no-kr` | 한국 가격 수집 생략 |
| `--watch[=파일]` | 재고 조회 대상을 URL 목록으로 지정 (기본 `watchlist.txt`) |

산출물은 `data/` 에 세 벌로 떨어진다 — 사람이 읽는 `.md`, 엑셀용 `.csv`, 재처리용 `.json`.

---

## 브랜드별 접근 현황 (2026-08-26 실측)

`doctor` 가 매번 다시 재는 값이다. 사이트 방어 정책은 수시로 바뀐다.

| 브랜드 | CA 수집 | 재고 조회 | KR 수집 | 가격 비교 |
|---|---|---|---|---|
| **코치** | ✅ HTTP · 1,748건 | ✅ 색상×사이즈 | ✅ HTTP · 559건 | ✅ **정확 매칭 230건** |
| **아크테릭스** | ✅ 브라우저 · 462건 | ✅ 색상×사이즈 | ❌ SPA | CA 단독 |
| **타미힐피거** | ✅ HTTP · 8,901건 | ⚠️ 미검증 | ❌ 해외 IP 차단 | CA 단독 |
| **폴로** | ❌ PerimeterX 캡차 | ❌ | ✅ HTTP · 4,531건 | KR 단독 |
| **룰루레몬** | ❌ Akamai | ❌ | ❌ Akamai | 불가 |
| **캐나다구스** | ❌ Kasada | ❌ | ❌ SPA | 불가 |
| **투미** | ❌ 연결 차단 | ❌ | ⚠️ HTTP · 사이트맵 없음 | 불가 |

수치는 2026-08-26 실측이다. `npm run doctor` 가 매번 다시 잰다.
차단 페이지는 HTTP 200 으로 오기 때문에 내용까지 검사해 판정한다 —
"바이트가 왔다"를 성공으로 세면 진단이 통째로 거짓이 된다.

**코치가 가장 신뢰도가 높다.** CA와 KR이 같은 상품 코드(`CAM16.html`)를 쓰기 때문에
이름을 맞혀 추측할 필요 없이 ID로 바로 대조된다. 랄프로렌·투미도 같은 구조지만
CA 쪽 수집을 뚫어야 한다.

---

## 설계 판단

**왜 커뮤니티를 직접 긁지 않는가**
더쿠·디시·클리앙 직접 크롤링은 약관상 회색지대이고 노이즈가 크다. 네이버 검색 API의
블로그·카페 문서 수는 공식·무료·합법이면서 국내 언급량의 대리 지표로 충분히 기능한다.

**왜 브랜드별 CSS 셀렉터를 7벌 만들지 않는가**
7개 브랜드는 서로 다른 커머스 플랫폼 위에 있지만 SEO 때문에 대부분 schema.org
`Product`/`ProductGroup`을 심는다. 셀렉터는 분기마다 깨지지만 이 마크업은 SEO 자산이라
잘 바뀌지 않는다. 그래서 JSON-LD를 1순위로 두고 실패한 브랜드만 개별 처리한다.

**왜 카테고리 페이지 대신 사이트맵인가**
무한 스크롤을 긁는 것보다 상대 서버에 훨씬 가볍고, `lastmod`라는 신제품 신호를 덤으로 준다.
정렬 전에 잘라내지 않는다 — 그러면 "신제품"이 카탈로그 앞부분의 최신일 뿐이게 된다.

**인기도를 언급량만으로 재지 않는 이유**
"최근 1~2년 인기"를 물었으므로 총량만 보면 오래된 스테디셀러가 이긴다.
언급량 30% + 검색 증가세 30% + 최신성 20% + 유통폭 20%로 나눠 신규 부상을 잡아낸다.

**정가와 세일가를 반드시 분리한다**
코치는 `ProductGroup.offers`에 정가(CA$360)를, variant에 세일가(CA$180)를 싣는다.
최저가만 보면 "48% 싸다"가 사실은 특정 컬러웨이 세일이라는 걸 놓친다. 매입 판단이
달라지므로 리포트에 정가를 함께 적는다.

---

## 프로젝트 규칙과의 연결

- **통합 단일가** — 리포트의 원가(CAD)·마진·환율은 운영 내부 데이터다. 스토어에 노출하지 않는다 (CLAUDE.md 규칙 1)
- **정수 금액** — KRW는 원 단위 정수, CAD는 cent 단위 정수. 파싱 단계에서 float을 만들지 않는다 (규칙 2)
- **판매가 산출** — 앱의 `src/lib/pricing` 을 그대로 재사용한다. 계산 로직을 두 곳에 두지 않는다 (PROJECT.md §5)
- **원산지** — `originCountryHint` 는 페이지 텍스트에서 긁은 참고값이다.
  CKFTA 판정은 실물 라벨 확인 후에만 한다 (규칙 5)
- **정중한 크롤링** — robots.txt 준수, 호스트별 지연 2.5초·동시성 2, 429는 15초부터 지수 백오프.
  랄프로렌은 robots가 `*/search*`를 막으므로 검색 경로를 쓰지 않는다 (규칙 8)
- **한글 경로** — Node 스크립트는 `new URL().pathname` 대신 `fileURLToPath` 를 쓴다

## 구조

```
src/
  config/brands.ts     브랜드 레지스트리 — 엔드포인트·URL 패턴을 여기 한 곳에 모은다
  core/                politeness(robots·지연·백오프) · fetcher · browser · cache
  extract/             jsonld · sitemap · price · blockpage   ← 사이트 무관 순수 추출기
  adapters/generic.ts  사이트맵 + JSON-LD 범용 어댑터 (7개 브랜드 중 6개 커버)
  signals/             네이버 API 클라이언트 + 인기도 점수(순수 함수)
  match/               상품명 정규화 · CA↔KR 매칭(순수 함수)
  stock/               재고 조회 — 사이즈·색상 정규화 · 변화 감지(순수 함수) · 매트릭스 리포트
  report/              markdown · csv
  pipeline.ts          오케스트레이션
```

계산·정규화·점수·차단판별·재고대조는 전부 순수 함수로 두고 단위 테스트를 붙였다 (`npm test`, 140개).

## 마크업이 바뀌면

1. `npm run doctor` 로 어디가 깨졌는지 본다
2. `src/config/brands.ts` 의 해당 브랜드 항목만 고친다 — 어댑터 로직에 URL은 없다
3. `npm test && npm run typecheck`

## 알려진 한계

**4개 브랜드는 봇 차단으로 CA 수집이 불가능하다** (룰루레몬·캐나다구스·투미, 폴로 CA).
헤드리스 브라우저로는 뚫리지 않는다 — 신형 헤드리스(full Chromium)로 바꿔
룰루레몬의 HTTP2 오류까지는 해소했지만, Akamai 가 세션을 곧바로 끊는다.
실효성 있는 선택지는 셋이다.

1. **브랜드 제휴/어필리에이트 피드** — PROJECT.md §6.3 이 이미 권고하는 방향이다.
   합법적이고 안정적이며, 장기적으로 유일하게 지속 가능한 경로다.
2. **상용 언블로킹 프록시** (Bright Data, ScrapingBee 등) — 비용이 든다.
3. **수동 입력** — 해당 브랜드는 가격을 대시보드에서 직접 관리한다.

그 밖에:

- **국내 최저가 축이 없다.** 네이버 쇼핑 검색 API 종료(2026-07-31) 이후
  가격을 주는 공개 API 가 없다. 대체 소스가 생기면 `lookupKrLowest()` 하나만 채우면 된다.
- **이름 유사도 매칭(신뢰도 1.0 미만)은 사람이 확인해야 한다.** 색상·시즌 차이를 구분하지 못한다.
- 재고는 리포트 생성 시점 값이다. 실제 판매 개시 전에는 §6.5 신선도 게이트(6시간)를 통과해야 한다.
