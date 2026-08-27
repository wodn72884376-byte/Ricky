import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { Button, ButtonLink } from '@/components/ui/button';
import { CustomsCaption } from '@/components/store/price-block';
import { ProductCard } from '@/components/store/product-card';
import { WishlistButton } from '@/components/store/wishlist-button';
import { formatKrw } from '@/lib/money';
import { allProducts, byBrand, findProduct, toCardProps } from '@/lib/catalog';
import { estimateCustoms } from '@/lib/customs';
import { CUSTOMS_USD_KRW } from '@/lib/checkout';

/**
 * 상품 상세 (docs/PDP-TEMPLATE.md, docs/wireframes/03-products-slug.md).
 *
 * 콘텐츠 순서는 세레나마켓 상세페이지에서 가져왔다 — 상품 → 정품 약속 → 차별점 →
 * 구매 전 고지. 시각 언어는 RICKY 시스템이다(이모지·형광 하이라이트·필 배지 없음).
 *
 * 타입 크기는 라이브 29cm PDP 실측을 따랐다: 상품명 20px/700, 구매 CTA 14px/700.
 *
 * TODO(data): DB 연결 후 `store_variants` 뷰 + `inspection_photos` + `reviews`로 교체한다.
 * TODO(cart): 장바구니 담기는 아직 핸들러가 없다.
 */

const ORIGIN_LABEL: Record<string, string> = {
  CA: '캐나다', VN: '베트남', IT: '이탈리아', CN: '중국', KR: '한국',
};

export function generateStaticParams() {
  return allProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const p = findProduct(slug);
  return { title: p ? `${p.brand} ${p.name} — RICKY` : 'RICKY' };
}

export default async function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const variant = product.variants[0]!;
  const ckfta = product.originCountry === 'CA';
  // TODO(stock): 공급처 재고 신선도 게이트를 붙인다 (PROJECT.md §6.5)
  const purchasable = true;
  const customs = estimateCustoms({
    goodsValueKrw: product.priceKrw,
    usdKrwRate: CUSTOMS_USD_KRW,
    category: product.category,
    ckftaEligible: ckfta,
  });
  const related = byBrand(product.brandSlug)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 5)
    .map(toCardProps);

  return (
    <>
      <Container as="section" className="py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          {/* 사진 */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-skeleton">
            <Image
              src={variant.detailImages[0] ?? variant.cardImage}
              alt={`${product.name} ${variant.colorKo}`}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="object-cover"
            />
            <WishlistButton productId={product.slug} productName={product.name} />
          </div>

          {/* 구매 정보 */}
          <div className="flex flex-col">
            <Link
              href={`/brands/${product.brandSlug}`}
              className="text-subhead font-bold text-ink hover:underline"
            >
              {product.brand}
            </Link>
            <h1 className="mt-2 text-editorial font-bold">{product.name}</h1>

            <div className="mt-6 flex items-baseline gap-2">
              {product.krRetailKrw && product.krRetailKrw > product.priceKrw && (
                <span className="text-editorial font-bold text-sale">
                  {Math.round((1 - product.priceKrw / product.krRetailKrw) * 100)}%
                </span>
              )}
              <span data-numeric className="text-editorial font-bold text-ink">
                {formatKrw(product.priceKrw)}
              </span>
              {product.krRetailKrw && product.krRetailKrw > product.priceKrw && (
                <span
                  data-numeric
                  className="text-body text-muted-text"
                  aria-label={`한국 정발가 ${formatKrw(product.krRetailKrw)}`}
                >
                  국내 {formatKrw(product.krRetailKrw)}
                </span>
              )}
            </div>
            <div className="mt-2">
              <CustomsCaption customs={customs} />
            </div>

            {/* 사실 목록 — 배지가 아니라 문장으로 */}
            <dl className="mt-8 flex flex-col gap-2 border-y border-outline py-5 text-util">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-muted-text">원산지</dt>
                <dd className="text-ink">
                  {product.originCountry
                    ? (ORIGIN_LABEL[product.originCountry] ?? product.originCountry)
                    : '확인 중이에요'}
                  {ckfta && (
                    <span className="text-muted-text">
                      {' '}· 한-캐나다 FTA로 관세는 면제되고 부가세만 붙어요
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-muted-text">발송</dt>
                <dd className="text-ink">
                  주문 후 캘거리에서 매입해요. 재고를 확인하고 보내드려요.
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-muted-text">배송</dt>
                <dd className="text-ink">주 3회 출고 · 캘거리 출고 후 영업일 4~10일</dd>
              </div>
            </dl>

            {/* 사이즈 */}
            <fieldset className="mt-8">
              <legend className="text-util font-bold text-ink">사이즈</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="flex h-11 min-w-14 items-center justify-center rounded-ghost border border-outline-strong px-3 text-util text-ink transition-colors hover:border-ink"
                  >
                    {size}
                  </button>
                ))}
              </div>
              <Link
                href="/guide/sizing"
                className="mt-3 inline-flex text-meta text-muted-text underline underline-offset-4"
              >
                사이즈 가이드
              </Link>
            </fieldset>

            {/* 화면당 하나뿐인 반전 블랙 CTA (§4) */}
            <div className="mt-8 flex flex-col gap-3">
              <Button variant="inverted" size="lg" disabled={!purchasable}>
                장바구니 담기
              </Button>
              {!purchasable && (
                <p className="text-util text-muted-text">
                  재고를 확인하고 있어요. 확인되면 바로 열려요.
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* 검수 — 이 브랜드의 신뢰 증명 수단 */}
      <Container as="section" className="py-14 lg:py-20">
        <h2 className="text-editorial font-bold lg:text-headline">출고 전 검수</h2>
        <p className="mt-3 max-w-[var(--measure-prose)] text-body text-ink">
          실물 택과 시리얼, 사이즈 라벨, 봉제를 촬영해서 남겨요. 보정하지 않고 워터마크도 얹지 않아요.
          매입 영수증과 인보이스는 상자에 함께 넣어요.
        </p>
        {/* TODO(schema): inspection_photos는 적용됐지만 실제 사진이 없다. 촬영본이 생기면 갤러리로 교체 */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {['실물 택과 시리얼', '사이즈 라벨', '봉제 상태', '매입 영수증'].map((label) => (
            <figure key={label}>
              <div className="flex aspect-square items-center justify-center bg-skeleton">
                <span className="text-meta text-muted-text">촬영 예정</span>
              </div>
              <figcaption className="mt-2 text-meta text-muted-text">{label}</figcaption>
            </figure>
          ))}
        </div>
      </Container>

      {/* 구매 전 고지 */}
      <Container as="section" className="pb-14 lg:pb-20">
        <h2 className="text-editorial font-bold lg:text-headline">구매 전에 확인해 주세요</h2>
        <div className="mt-6 flex max-w-[var(--measure-prose)] flex-col gap-6 text-body text-ink">
          <div>
            <h3 className="font-bold">개인통관고유부호</h3>
            <p className="mt-1">
              세관 통관 시 검증이 강화되었어요. 수령인의 성명 · 연락처 · 통관부호 · 주소가 모두
              일치해야 하며, 하나라도 다르면 통관이 지연될 수 있어요.
            </p>
          </div>
          <div>
            <h3 className="font-bold">관세·부가세</h3>
            <p className="mt-1">
              미화 150달러 이하는 관세와 부가세가 면제돼요. 넘으면 상품가와 국제 운임을 합한 금액
              전체에 부과되고, 통관할 때 수취인이 납부해요.
            </p>
            <ButtonLink href="/guide/customs" size="md" chevron className="mt-4">
              관세 안내
            </ButtonLink>
          </div>
          <div>
            <h3 className="font-bold">판매자</h3>
            <p className="mt-1">
              RICKY는 캐나다 현지 공식 매장에서 상품을 직접 매입해 판매하는 독립 사업자예요.
              각 브랜드의 공식 수입사·총판·대리점이 아니며, 브랜드와 직접적인 제휴 관계는 없어요.
              국제 배송 중 발생한 파손·분실에 대한 1차 책임은 RICKY가 집니다.
            </p>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <Container as="section" className="pb-20">
          <h2 className="text-editorial font-bold lg:text-headline">같은 브랜드</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
