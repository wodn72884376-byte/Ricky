@AGENTS.md

# CLAUDE.md — RICKY

> 프로젝트 목적·정책의 원본은 [PROJECT.md](PROJECT.md). 충돌 시 PROJECT.md가 우선한다.
> Next.js 버전별 주의사항은 [AGENTS.md](AGENTS.md)에 있다(위에서 import).

## 한 줄 요약
RICKY — 캐나다 알버타(캘거리) 기반으로 아크테릭스·코치·룰루레몬 등 프리미엄 패션을 한국 고객에게 파는
**원화 스토어 + 운영 대시보드**. 결제는 Stripe(KRW), 재고는 **캐나다 공식몰 모니터링** 연동.

## 스택
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase(Postgres/Auth) · Stripe · Vercel
스토어(`/`)와 관리자 대시보드(`/admin`)는 **한 코드베이스**, 권한으로 분리한다.

Next 16은 breaking change가 많다. 코드 작성 전 `node_modules/next/dist/docs/` 의 해당 문서를 확인할 것.
- `middleware.ts` → **`proxy.ts`** (named export도 `proxy`), 런타임은 nodejs 고정
- `cookies()`, `headers()`, `params`, `searchParams` 는 모두 **비동기**
- Turbopack이 기본 번들러

## 절대 규칙 (Non-negotiable)

1. **가격은 통합 단일 원화가로만 노출한다.** "상품 원가 + 대행 수수료" 분리 표기·분리 청구 금지.
   원가(CAD)·마진율·환율은 관리자 전용 데이터이며 고객용 API 응답에 절대 포함하지 않는다.
   스토어는 `store_variants` 뷰를 통해서만 재고·가격을 읽는다.
   (근거: CRA '대리인' 판정 회피 — PROJECT.md §3.1)
2. **금액은 정수로 다룬다.** KRW는 Stripe의 zero-decimal currency이므로 `amount`에 원 단위 정수를
   그대로 전달한다(×100 금지). CAD는 센트 단위 정수로 저장한다. 통화 연산에 float 누적 금지.
3. **DDU** — 판매가에 한국 관세·부가세를 포함하지 않는다. 단, 예상 세액은 항상 **계산해서 보여준다**.
4. **개인통관고유부호(PCCC)** 는 주문 필수값. 형식 `P` + 12자리 숫자를 검증한다(`isValidPccc`).
   민감정보로 취급해 로그·에러 리포트에 원문을 남기지 않는다(표시는 `maskPccc`).
5. **원산지(`origin_country`)는 실물 라벨 기준으로만 입력**한다. 브랜드 국적으로 추정 금지.
   CKFTA 관세 면제는 관세만 0%이고 **부가세 10%는 부과**된다 — "완전 면세"로 표현하지 않는다.
6. **재고 신선도 게이트**: 주문매입 상품은 공급처 최근 확인 시각이 임계치(기본 6h) 이내이고
   `in_stock`일 때만 결제를 허용한다. 수집 실패 시 마지막 성공값으로 판매하지 않는다.
7. **환율은 주문 시점 스냅샷을 저장**한다. 정산·마진 계산은 항상 스냅샷 기준.
   관세 안내용 환율(관세청 고시환율)과 원가 계산용 환율(시장환율)을 분리해 저장한다.
8. **크롤러는 정중하게.** 요청 간 지연·동시성 제한·지수 백오프 필수. 로그인/결제 영역 접근 금지.
   브랜드별 어댑터로 분리하고 셀렉터/엔드포인트를 한 파일에 모은다.

## 도메인 용어
| 용어 | 의미 |
|---|---|
| 목록통관 | 총 USD 150 이하 면세 통관. 한국행 국제배송비는 기준액 계산에서 제외 |
| 합산과세 | 같은 날 같은 수취인 도착 건 합산 과세 |
| CKFTA | 한-캐나다 FTA. Made in Canada 상품 관세 0% (부가세는 부과) |
| 선매입 / 주문매입 | `preheld` / `on_demand` — 재고 보유 판매 / 주문 후 현지 매입 |
| 배대지 | 현지 배송대행지. 검수·재포장·합포장 건당 CAD $4~8 |
| 부피무게 | L×W×H 기반 체적무게. 운임은 max(실무게, 부피무게) |

## 코드 컨벤션
- 고객 대면 문구는 모두 한국어. 코드 식별자·주석은 영어, 도메인 용어는 위 표의 표기를 유지.
- 금액 표시는 `formatKrw()` (`₩1,234,000`). 직접 문자열 조합 금지.
- 세금·배송비·판매가 계산 로직은 UI가 아니라 `src/lib/pricing/`, `src/lib/customs/`,
  `src/lib/shipping/` 에 순수 함수로 두고 **단위 테스트를 반드시 작성**한다
  (USD 150 경계값, CKFTA 분기, 부피무게·대형화물 경계).
- Supabase RLS를 기본 활성화. `createAdminClient()`(service_role)는 RLS를 우회하므로
  크롤러 워커·Stripe 웹훅 등 신뢰된 서버 경로에서만 쓴다.
- 스키마를 바꾸면 `supabase/migrations/`에 새 파일을 추가하고 **`npm run db:check`로 실제 실행 검증**한다.
- 프로젝트 경로에 한글이 포함된다. Node 스크립트에서 `new URL(...).pathname` 대신 **`fileURLToPath`** 를 쓴다.
- 비밀키(Stripe secret, Supabase service role)는 서버 전용. `NEXT_PUBLIC_` 접두사 금지.

<!-- omd:start v=1 hash=672475c77b07 -->
# Design System (oh-my-design)

The authoritative brand & UI spec is **@./DESIGN.md**.
Read before any UI/styling/microcopy/motion work.

Preference log (pending corrections): @./.omd/preferences.md

Precedence: DESIGN.md > preferences.md > your defaults.
<!-- omd:end -->
