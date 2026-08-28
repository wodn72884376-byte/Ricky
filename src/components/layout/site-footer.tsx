import Link from 'next/link';
import { BRAND_COLUMNS, brandShort } from '@/lib/nav';
import { Container } from './container';

/**
 * 글로벌 푸터 (docs/IA.md §2).
 *
 * 배경 틴트 없음, 상단 보더 없음 — 푸터는 그저 타입이 조밀해진 여백이다 (DESIGN.md §4).
 * 패딩 20px 상단 / 48px 하단 — 비대칭, 하단이 넉넉하다.
 *
 * 법적 고지 문구에 한해 `~합니다` 종결을 허용한다 (§10).
 */

const COLUMNS = [
  {
    heading: 'SHOP',
    // 브랜드 목록의 출처는 nav.ts 하나다 — 푸터에 다시 적으면 반드시 어긋난다
    links: [
      ...BRAND_COLUMNS.map((brand) => ({
        label: brandShort(brand),
        href: `/brands/${brand.slug}`,
      })),
      { label: '이번 주 입고', href: '/arrivals' },
    ],
  },
  {
    heading: 'GUIDE',
    links: [
      { label: '관세 안내', href: '/guide/customs' },
      { label: '사이즈 가이드', href: '/guide/sizing' },
      { label: '검수와 정품', href: '/guide/inspection' },
    ],
  },
  {
    heading: 'HELP',
    links: [
      { label: '고객센터', href: '/support' },
      { label: '주문 조회', href: '/orders/lookup' },
      { label: '1:1 문의', href: '/support#inquiry' },
    ],
  },
  {
    heading: 'ABOUT',
    links: [
      { label: 'RICKY 소개', href: '/about' },
      { label: '이용약관', href: '/policy/terms' },
      { label: '개인정보처리방침', href: '/policy/privacy' },
      { label: '교환·반품', href: '/policy/returns' },
      { label: '배송 안내', href: '/policy/shipping' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-outline">
      <Container className="pb-16 pt-10">
        {/*
          좌: 사업자·정책 고지 (큰 비중). 우: 링크 컬럼.
          크로스보더 커머스에서 고지는 부록이 아니라 신뢰의 일부다 — 작게 두되 넓게 둔다.
        */}
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="flex flex-col gap-3 lg:w-[38%] lg:shrink-0">
            <p className="text-nav font-extrabold tracking-tight text-ink">RICKY</p>
            {/* TODO(business): 상호·알버타 사업자번호·소재지·대표·연락처 확정 후 교체 */}
            <p className="text-meta text-muted-text">
              캐나다 알버타주 캘거리 · [FILL IN: 상호 / 사업자번호 / 소재지 / 대표 / 연락처]
            </p>
            <p className="text-meta leading-relaxed text-muted-text">
              RICKY는 캐나다 현지 공식 매장에서 상품을 직접 매입해 판매하는 독립 사업자입니다.
              각 브랜드의 공식 수입사·총판·대리점이 아니며, 브랜드와 직접적인 제휴 관계는 없습니다.
            </p>
            <p className="text-meta leading-relaxed text-muted-text">
              판매가에 한국 관세·부가세는 포함되어 있지 않으며, 통관 시 수취인이 납부합니다.
              국제 배송 중 발생한 파손·분실에 대한 1차 책임은 RICKY가 부담합니다.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h2 className="text-label font-bold text-ink">{column.heading}</h2>
                <ul className="mt-1 flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex min-h-11 items-center text-label font-normal text-ink no-underline hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
