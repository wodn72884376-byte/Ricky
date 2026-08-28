import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { ProductCard } from '@/components/store/product-card';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductDisclosureTable } from '@/components/store/product-disclosure-table';
import { Disclosure } from '@/components/store/disclosure';
import { CustomsCaption } from '@/components/store/price-block';
import { WishlistButton } from '@/components/store/wishlist-button';
import { ProductOptions } from './product-options';
import { allProducts, byBrand, findProduct, toCardProps } from '@/lib/catalog';
import { estimateCustoms } from '@/lib/customs';
import { CUSTOMS_USD_KRW } from '@/lib/checkout';
import { formatKrw } from '@/lib/money';

/**
 * 상품 상세.
 *
 * 구조는 아크테릭스 공식몰 PDP를 따랐다 — 좌측 2열 이미지 그리드 + 우측 스티키 구매 패널,
 * 그 아래 설명 · 상품 정보 고시 · 접이식 안내 · 같은 브랜드.
 *
 * 시각 언어는 RICKY 시스템이다. 레퍼런스와 다른 두 곳:
 *   - 반전 블랙 CTA는 하나뿐이다(`바로 구매`). `장바구니 담기`는 고스트다 (§4).
 *   - 상품 정보 고시에 모르는 값을 채우지 않는다.
 */


const GENDER_LABEL: Record<string, string> = { men: 'MEN', women: 'WOMEN', unisex: 'ALL' };

export function generateStaticParams() {
  return allProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const p = findProduct(slug);
  return { title: p ? `${p.name} — RICKY` : 'RICKY' };
}

export default async function ProductPage({ params, searchParams }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const sp = await searchParams;
  const raw = Number(typeof sp.color === 'string' ? sp.color : 0);
  const colorIndex = Number.isInteger(raw) && raw >= 0 && raw < product.variants.length ? raw : 0;
  const variant = product.variants[colorIndex]!;

  const ckfta = product.originCountry === 'CA';
  const customs = estimateCustoms({
    goodsValueKrw: product.priceKrw,
    usdKrwRate: CUSTOMS_USD_KRW,
    category: product.category,
    ckftaEligible: ckfta,
  });
  const discount = product.krRetailKrw && product.krRetailKrw > product.priceKrw
    ? Math.round((1 - product.priceKrw / product.krRetailKrw) * 100)
    : null;
  const related = byBrand(product.brandSlug)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 6)
    .map(toCardProps);

  return (
    <Container as="section" className="py-6 lg:py-8">
      {/* 브레드크럼 — 어디에 있는지, 어디로 돌아가는지 */}
      <nav aria-label="위치" className="text-meta text-muted-text">
        <Link href={`/brands/${product.brandSlug}`} className="hover:text-ink">{product.brand}</Link>
        <span className="mx-2">|</span>
        <span>{GENDER_LABEL[product.gender]}</span>
        <span className="mx-2">|</span>
        <span className="text-ink">{product.name}</span>
      </nav>

            {/*
        구매 영역은 지면을 다 쓰지 않는다. 사진을 화면 폭에 비례해 키우면 재킷 하나가
        1000px가 되어 읽는 화면이 아니라 전시가 된다. 갤러리를 728px로 묶어
        컷 하나가 ~360px에 머물게 한다 — 여러 컷을 한눈에 비교하는 게 목적이다.
        아래 설명·고시표·관련상품은 지면 폭을 그대로 쓴다.
      */}
      <div className="mx-auto mt-6 grid max-w-[1192px] gap-10 lg:grid-cols-[minmax(0,728px)_400px] lg:gap-16">
        <ProductGallery images={variant.detailImages} alt={`${product.name} ${variant.colorKo}`} />

        {/* 구매 패널 — 스크롤해도 따라온다. 헤더 높이만큼 띄운다. */}
        <div className="relative lg:sticky lg:top-32 lg:self-start">
          <WishlistButton
            productId={product.slug}
            productName={product.name}
            className="!absolute !right-0 !top-0 !bottom-auto"
          />

          <h1 className="pr-12 text-editorial font-bold">{product.name}</h1>
          <p className="mt-2 text-meta text-muted-text">시즌 정보: 2026/FW</p>

          <div className="mt-6 flex items-baseline gap-2">
            {discount && <span className="text-editorial font-bold text-sale">{discount}%</span>}
            <span data-numeric className="text-editorial font-bold text-ink">
              {formatKrw(product.priceKrw)}
            </span>
          </div>
          {product.krRetailKrw && (
            <p className="mt-1 text-meta text-muted-text">
              국내 정발가 <span data-numeric>{formatKrw(product.krRetailKrw)}</span>
            </p>
          )}
          <div className="mt-2">
            <CustomsCaption customs={customs} />
          </div>

          <ProductOptions product={product} colorIndex={colorIndex} />

          <div className="mt-10">
            <Disclosure title="배송 정보">
              캘거리에서 주 3회 출고해요. 출고 후 한국 자택까지 영업일 기준 4~10일 걸려요.
              국제 배송비는 무게와 부피에 따라 결제 단계에서 계산돼요.
            </Disclosure>
            <Disclosure title="관세·부가세">
              미화 150달러 이하는 관세와 부가세가 면제돼요. 넘으면 상품가와 국제 운임을 합한 금액
              전체에 부과되고, 통관할 때 받는 분이 납부해요. 판매가에는 포함되어 있지 않아요.
              {ckfta && ' 이 상품은 캐나다산이라 관세는 면제되고 부가세만 붙어요.'}
            </Disclosure>
            <Disclosure title="교환 및 반품">
              해외 배송이어도 교환과 반품이 가능해요. 국제 배송 중 발생한 파손·분실에 대한 1차
              책임은 RICKY가 집니다. 조건과 절차는 교환·반품 정책에서 확인해 주세요.
            </Disclosure>
          </div>
        </div>
      </div>

      {/* 설명 — 좌측 이름, 우측 본문. 레퍼런스와 같은 2단 구성 */}
      <section className="mt-20 grid gap-8 border-t border-outline pt-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
        <h2 className="text-editorial font-bold">{product.name}</h2>
        <div className="max-w-[var(--measure-prose)] text-body leading-relaxed text-ink">
          {/* TODO(content): 상품 설명은 아직 없다. 지어내지 않고 사실만 둔다. */}
          <p>
            캘거리 현지 공식 매장에서 직접 매입한 {product.brand} {product.name}이에요.
            {product.variants.length > 1 && ` 색상은 ${product.variants.map((v) => v.colorKo).join(', ')} 중에 고를 수 있어요.`}
          </p>
          <p className="mt-4">
            출고 전에 실물 택과 시리얼, 사이즈 라벨, 봉제를 촬영해서 남기고, 매입 영수증과
            인보이스를 상자에 함께 넣어요.
          </p>
        </div>
      </section>

      <ProductDisclosureTable product={product} />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-editorial font-bold">같은 브랜드</h2>
                  {/* 열 수를 카탈로그 그리드와 맞춘다. 4열 고정이면 넓은 화면에서 카드 하나가
            600px가 되어 본 상품보다 커진다. */}
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* 후기는 구매 확인된 것만 존재한다. 없으면 섹션을 통째로 비운다 (docs/PDP-TEMPLATE.md §5) */}
      <section className="mt-20 border-t border-outline pt-8">
        <h2 className="text-editorial font-bold">후기</h2>
        <p className="mt-3 text-body text-muted-text">아직 등록된 후기가 없어요.</p>
      </section>

      <p className="mt-16 max-w-[var(--measure-prose)] text-meta leading-relaxed text-muted-text">
        RICKY는 캐나다 현지 공식 매장에서 상품을 직접 매입해 판매하는 독립 사업자예요.
        각 브랜드의 공식 수입사·총판·대리점이 아니며, 브랜드와 직접적인 제휴 관계는 없어요.
      </p>
    </Container>
  );
}
