import { notFound } from 'next/navigation';
import { AdminSidebar, AdminTopBar } from '@/components/admin/admin-sidebar';
import { ProductFilters } from '@/components/admin/product-filters';
import { ProductTable, type AdminProductRow } from '@/components/admin/product-table';
import { ButtonLink } from '@/components/ui/button';

/**
 * 상품 목록 화면 미리보기. **개발 환경 전용** — 프로덕션에서는 404다.
 *
 * `/admin/products`는 세션과 Supabase를 요구해서 DB 연결 전에는 표를 볼 수 없다.
 * 아래 행은 **화면 확인용 가짜 데이터**다 — 상태와 게시 조건이 각각 어떻게
 * 보이는지 확인하려고 다섯 가지 경우를 하나씩 넣었다.
 */
export const dynamic = 'force-static';

const FULL = {
  smartstore_url: 'https://smartstore.naver.com/ricky/products/1',
  origin_country: 'CA',
  material: '겉감 나일론 100%',
  care: '30도 이하 손세탁',
  manufacturer: "Arc'teryx Equipment",
  as_contact: 'RICKY 고객센터',
};

const EMPTY = {
  smartstore_url: null,
  origin_country: null,
  material: null,
  care: null,
  manufacturer: null,
  as_contact: null,
};

const ROWS: AdminProductRow[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: '베타 LT 자켓',
    slug: 'beta-lt-jacket',
    category: 'outerwear',
    gender: 'men',
    status: 'active',
    featured_rank: 1,
    shipping_krw: 28000,
    ...FULL,
    official_url: 'https://arcteryx.com/ca/en/shop/mens/beta-jacket-0868',
    brands: { name: "Arc'teryx", official_site_url: 'https://arcteryx.com' },
    product_variants: [
      { price_krw: 712000, active: true, smartstore_url: 'https://smartstore.naver.com/ricky/products/11' },
      { price_krw: 712000, active: true, smartstore_url: 'https://smartstore.naver.com/ricky/products/12' },
      { price_krw: 712000, active: false, smartstore_url: null },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: '브루클린 숄더백 28',
    slug: 'brooklyn-shoulder-bag-28',
    category: 'bag',
    gender: 'women',
    status: 'draft',
    featured_rank: null,
    shipping_krw: null,
    ...EMPTY,
    official_url: 'https://www.coach.com/ca/products/brooklyn-shoulder-bag-28/CE587.html',
    brands: { name: 'Coach', official_site_url: 'https://www.coach.com/ca' },
    product_variants: [{ price_krw: 398000, active: true, smartstore_url: null }],
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: '얼라인 하이라이즈 팬츠 25',
    slug: 'align-hr-pant-25',
    category: 'bottom',
    gender: 'women',
    status: 'active',
    featured_rank: null,
    shipping_krw: 0,
    ...FULL,
    official_url: null,
    brands: { name: 'lululemon', official_site_url: 'https://shop.lululemon.com' },
    /* 섞인 상태 — 안 채운 색은 다른 색 페이지로 떨어진다. 경고 위계를 미리 본다. */
    product_variants: [
      { price_krw: 148000, active: true, smartstore_url: 'https://smartstore.naver.com/ricky/products/31' },
      { price_krw: 148000, active: true, smartstore_url: null },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: '아틈 SL 후디',
    slug: 'atom-sl-hoody',
    category: 'outerwear',
    gender: 'unisex',
    status: 'paused',
    featured_rank: null,
    shipping_krw: 24000,
    ...FULL,
    smartstore_url: null,
    official_url: 'https://arcteryx.com/ca/en/shop/womens/atom-hoody-9557',
    brands: { name: "Arc'teryx", official_site_url: 'https://arcteryx.com' },
    product_variants: [{ price_krw: 386000, active: true, smartstore_url: null }],
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: '시그니처 짚 어라운드 월렛',
    slug: 'signature-zip-around-wallet',
    category: 'wallet',
    gender: 'women',
    status: 'archived',
    featured_rank: null,
    shipping_krw: 16000,
    ...FULL,
    official_url: null,
    brands: { name: 'Coach', official_site_url: null },
    product_variants: [{ price_krw: 172000, active: true, smartstore_url: null }],
  },
];

export default function AdminProductsPreview() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar email="wodn72884376@gmail.com" />
        <main className="flex-1 px-6 py-8">
          <p className="mb-8 border border-outline px-4 py-3 text-meta text-muted-text">
            개발 미리보기 — 아래 다섯 건은 화면 확인용 가짜 데이터예요. 실제 화면은{' '}
            <code>/admin/products</code>예요.
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-headline font-bold text-ink">상품</h1>
              <p className="mt-1 text-body text-muted-text">등록한 상품을 여기서 고치고 상태를 바꿔요.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* 미리보기에서는 내려받아도 가짜 데이터가 아니라 진짜 DB 를 부른다 — 눌러 볼 것은 모양뿐이다 */}
              <ButtonLink href="/admin/products/export" variant="ghost" size="md" prefetch={false}>
                상품 엑셀
              </ButtonLink>
              <ButtonLink href="/admin/products/export?grain=variant" variant="ghost" size="md" prefetch={false}>
                옵션 엑셀
              </ButtonLink>
              <ButtonLink href="/admin/products/new" variant="inverted" size="md">
                상품 등록
              </ButtonLink>
            </div>
          </div>

          <div className="mt-8">
            <ProductFilters q="" brand="" status="" />
          </div>

          <p className="mt-8 text-meta text-muted-text">
            <span data-numeric>{ROWS.length}</span>개
          </p>
          <div className="mt-3">
            <ProductTable rows={ROWS} />
          </div>
        </main>
      </div>
    </div>
  );
}
