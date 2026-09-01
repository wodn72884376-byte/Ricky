# RICKY

캐나다 알버타(캘거리)에서 아크테릭스·룰루레몬·코치를 **직접 매입해** 한국 고객에게 판매하는
자사 스토어 + 운영 대시보드.

대행이 아니라 소매다. 알버타는 주 판매세(PST)가 없어 연방 GST 5%만 붙고, 그 원가 우위가
이 사업의 물리적 기반이다.

## 문서

| 문서 | 내용 |
|---|---|
| [PROJECT.md](PROJECT.md) | 사업 정책과 **절대 규칙** (가격 표기·통관·재고 신선도). 충돌 시 최우선 |
| [PRODUCT.md](PRODUCT.md) | 사용자·목적·설계 원칙·접근성 |
| [DESIGN.md](DESIGN.md) | 브랜드/UI 스펙. UI 작업 전 필독 |
| [docs/IA.md](docs/IA.md) | 페이지 인벤토리 35개, 네비게이션, URL 규칙 |
| [docs/PDP-TEMPLATE.md](docs/PDP-TEMPLATE.md) | 상품 상세 콘텐츠 구조 |
| [docs/wireframes/](docs/wireframes/) | 화면별 와이어프레임 9종 |

## 스택

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase(Postgres/Auth) · Stripe · Vercel

스토어(`/`)와 관리자(`/admin`)는 한 코드베이스이고 권한으로 분리한다.

## 시작하기

```bash
npm install                  # postinstall이 Pretendard를 public/fonts로 복사한다
cp .env.example .env.local   # Supabase·Stripe 키를 채운다
npm run dev
```

Supabase 키가 없어도 스토어 화면은 뜬다. 로그인과 `/admin`은 실제 연결이 필요하다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm test` | 단위 테스트 (가격·통관·배송 계산, 스키마 제약) |
| `npm run db:check` | 마이그레이션을 PGlite에서 **실제 실행**해 검증 |
| `npm run design:contrast` | 디자인 토큰의 WCAG 2.2 대비 검사 |
| `npm run catalog:import` | `아크테릭스/` 폴더 + 가격표 → 카탈로그·이미지 생성 |
| `npm run db:stock-check` | 재고 연동 전 과정을 PGlite에서 실행 (Supabase 없어도 됨) |
| `npm run db:stock-load` | 수집 결과 → Supabase 적재. **기본은 미리보기**, 쓰려면 `-- --commit` |
| `npm run fonts:sync` | Pretendard 재복사 |

## 재고 연동

캐나다 공식몰 재고를 스토어에 연결하는 경로다. 수집기는 `스크래핑/`에 있다.

```
스크래핑           npm run stock:all       수집 → data/연동-*.json
  ↓
상위 프로젝트      npm run db:stock-load   → supplier_listings + stock_checks
  ↓
store_variants 뷰                          요청 시점에 구매 가능 여부 판정
```

**적재는 기본이 미리보기다.** 운영 DB에 쓰는 건 되돌리기 어려워서, `--commit`을 붙여야
실제로 쓴다. 미리보기는 Supabase 없이도 무엇이 올라갈지 보여준다.

```
수집 파일 2개 → variant 51건 → 적재 후보 253행
  재고 상태: { in_stock: 247, out_of_stock: 6 }
  브랜드   : { polo: 211, lululemon: 42 }
```

### 이번 회차에 안 담긴 상품은 건드리지 않는다

수집이 실패했거나(차단·마크업 변경) 이번 조회 대상이 아니었을 뿐인데 품절로 적으면
멀쩡한 상품이 판매 중지된다. 아무것도 안 하면 그 행의 `last_success_at`이 저절로 낡아
신선도 게이트가 닫는다 — **판매를 막는 쪽으로 저절로 기우는 것이 옳은 방향이다.**

같은 이유로 `availability = 'unknown'`인 사이즈는 행을 만들지 않는다.
"확인했는데 모름"과 "확인한 적 없음"이 구분되지 않으면 뷰가 신선하다고 착각한다.

### 검증

`npm run db:stock-check`가 마이그레이션 → 카탈로그 적재 → 재고 적재 → 뷰 판정을
PGlite(WASM Postgres)에서 실제로 돌린다. **적재 변환은 실제 로더와 같은 함수를 쓴다** —
하네스가 자기만의 변환을 들고 있으면 여기서 통과해도 운영에서 깨진다.

답해야 하는 질문은 하나다: 신선도 게이트가 정말로 작동하는가.

```
신선도 게이트: 7시간 전 → 구매 가능 0 · 방금 → 182
```

## 상품 추가

```
아크테릭스/
├─ 남성/{상품명 Men's}/{시즌}-{SKU}-{상품명}-{색상}-{뷰}.avif
├─ 여성/{상품명 Women's}/...
├─ ACC_{상품명}/...
└─ 가격표 비교.xlsx        ← B열 상품명이 폴더명과 일치해야 매칭된다
```

폴더와 가격표에 넣고 `npm run catalog:import`. 원본은 건드리지 않고 결과물만 재생성한다.

생성물은 `src/lib/catalog.generated.ts`와 `public/images/products/`이며 직접 수정하지 않는다.

> **임포트 후 반드시 채울 것**
> - `originCountry` — **실물 라벨 기준.** 브랜드 국적으로 추정 금지. 캐나다산이 아니면
>   CKFTA 관세 면제를 받을 수 없다 (PROJECT.md §3.3)
> - 무게 — 배송비 산정에 필요하다. 지금은 카테고리별 추정치를 쓴다

## 배포

Netlify 설정은 [netlify.toml](netlify.toml)에 있다.

**환경변수가 없어도 빌드는 통과한다.** 시크릿은 런타임에 필요한 것이지 빌드 타임에 필요한
것이 아니어서, `src/lib/env.ts`가 import 시점이 아니라 **사용 시점에** 검증한다.
최상위에서 `parse()`를 돌리면 페이지 데이터 수집 단계에서 빌드가 통째로 터진다.

미설정 상태에서 동작하는 것: 스토어 전체 (홈·브랜드·상품·장바구니·체크아웃 화면)
동작하지 않는 것: 로그인, 주문조회, `/admin`

## 개발 전용 화면

프로덕션에서는 404다.

- `/dev/components` — 컴포넌트 프리뷰
- `/dev/admin` — 관리자 대시보드 (인증 없이)
- `/dev/order` — 주문 상세

## 반드시 지키는 것

1. **통합 단일 원화가.** "상품 원가 + 대행 수수료" 분리 표기 금지. 원가·마진·환율은 고객 API에 넣지 않는다
2. **금액은 정수.** KRW는 Stripe zero-decimal — `amount`에 원 단위 정수 그대로(×100 금지)
3. **DDU.** 판매가에 관세·부가세 미포함. 단 예상액은 결제 전에 반드시 보여준다
4. **개인통관고유부호는 마스킹해서만** 표시하고 로그에 원문을 남기지 않는다
5. **재고 미확인이면 결제를 막는다.** 마지막 성공값으로 팔지 않는다

자세한 내용은 [CLAUDE.md](CLAUDE.md).
