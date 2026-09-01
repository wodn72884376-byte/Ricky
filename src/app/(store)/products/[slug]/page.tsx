import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { ProductCard } from '@/components/store/product-card';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductDisclosureTable } from '@/components/store/product-disclosure-table';
import { ProductSpecs } from '@/components/store/product-specs';
import { ProductDetails } from '@/components/store/product-details';
import { Disclosure } from '@/components/store/disclosure';
import { ProductOptions } from './product-options';
import { allProducts, byBrand, findProduct, hasVariantPricing, priceOf, shippingKrwOf, toCardProps } from '@/lib/catalog';
import { brandHref, type Gender } from '@/lib/nav';
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


const GENDER_LABEL: Record<string, string> = { men: 'MEN', women: 'WOMEN', unisex: 'ALL', kids: 'KIDS' };

/**
 * 브레드크럼이 돌아갈 목록.
 *
 * `unisex` 는 남녀 양쪽에 있으므로 아무 쪽이나 되고 남성으로 보낸다.
 * **아동은 아동으로 보내야 한다** — 남성 목록으로 보내면 그 상품이 거기 없어서
 * 빈 화면이거나 다른 상품 사이에서 길을 잃는다.
 */
const breadcrumbGender = (g: string): Gender => (g === 'women' || g === 'kids' ? g : 'men');

export function generateStaticParams() {
  return allProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const p = findProduct(slug);
  // 없는 상품이면 페이지가 notFound() 를 부르지만 메타데이터는 그 전에 만들어진다
  return { title: p ? p.name : '없는 상품입니다' };
}

export default async function ProductPage({ params, searchParams }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const sp = await searchParams;
  const raw = Number(typeof sp.color === 'string' ? sp.color : 0);
  const colorIndex = Number.isInteger(raw) && raw >= 0 && raw < product.variants.length ? raw : 0;
  const variant = product.variants[colorIndex]!;

  // 코치는 소재가 다르면 값이 다르다. 고른 색상의 값으로 계산한다.
  const priceKrw = priceOf(product, variant);
  const ckfta = product.originCountry === 'CA';
  // 상품마다 정해진 고정 금액이다 — 추정이 아니라 이 상품의 배송비다.
  const shippingKrw = shippingKrwOf(product);
  const discount = product.krRetailKrw && product.krRetailKrw > priceKrw
    ? Math.round((1 - priceKrw / product.krRetailKrw) * 100)
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
        <Link
          href={brandHref(product.brandSlug, breadcrumbGender(product.gender))}
          className="hover:text-ink"
        >
          {GENDER_LABEL[product.gender]}
        </Link>
        <span className="mx-2">|</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      {/*
        갤러리는 남는 폭을 전부 쓰고, 컷을 **가로로** 늘어놓는다 (2026-08-28 운영자 요청).
        2열 세로 그리드는 폭을 728px로 묶어야 컷이 안 부푸는데, 그러면 넓은 화면에서
        이 섹션만 좌우가 텅 빈다 — 지면에 폭 캡을 두지 않는 이 시스템과 어긋난다(§5).
        가로로 흘리면 폭이 넓어질수록 컷이 커지는 게 아니라 **더 많이 보인다.**
      */}
      {/*
        갤러리 컬럼을 남는 폭의 80%로 잡는다. 이전에는 컬럼을 1fr로 두고 사진만 80%로 줄였는데,
        그러면 구매 패널은 지면 오른쪽 끝에 그대로 남아 사진과 패널 사이가 텅 비었다
        (2026-08-28 운영자 지적). 컬럼 자체를 줄이면 패널이 사진 바로 옆으로 따라온다 —
        남는 20%는 지면 오른쪽 여백이 된다.
        (grid의 flex factor 합이 1보다 작으면 남는 공간을 다 쓰지 않는다. `justify-start`가 그 공간을 뒤로 보낸다.)
      */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_400px] lg:justify-start lg:gap-12">
        <ProductGallery images={variant.detailImages} alt={`${product.name} ${variant.colorKo}`} />

        {/* 구매 패널 — 스크롤해도 따라온다. 헤더 높이만큼 띄운다. */}
        <div className="relative lg:sticky lg:top-32 lg:self-start">
          <h1 className="text-editorial font-bold">{product.name}</h1>
          <p className="mt-2 text-meta text-muted-text">시즌 정보: 2026/FW</p>

          <div className="mt-6 flex items-baseline gap-2">
            {discount && <span className="text-editorial font-bold text-sale">{discount}%</span>}
            <span data-numeric className="text-editorial font-bold text-ink">
              {formatKrw(priceKrw)}
            </span>
            {/*
              할인율을 쓰면 기준가를 함께 밝혀야 한다(표시광고법). 정발가 줄은 없앴지만
              취소선으로 이 자리에 남긴다 — % 옆에 기준이 없으면 그 숫자는 의미가 없다.
            */}
            {discount && product.krRetailKrw && (
              <span
                data-numeric
                className="text-meta text-muted-text line-through"
                aria-label={`국내 정발가 ${formatKrw(product.krRetailKrw)}`}
              >
                {formatKrw(product.krRetailKrw)}
              </span>
            )}
          </div>
          {hasVariantPricing(product) && (
            <p className="mt-1 text-meta text-muted-text">고른 색상의 가격입니다. 소재에 따라 달라집니다.</p>
          )}
          {/*
            가격 아래 각주는 **배송비 하나**다 (2026-08-28 운영자 요청).
            세액은 아래 접이식 `관세·부가세`와 장바구니·결제에서 계속 보여준다 — DDU 고지는 유지된다.
          */}
          <p className="mt-1 text-meta text-muted-text">
            배송비 <span data-numeric>{formatKrw(shippingKrw)}</span>
          </p>

          <ProductOptions product={product} colorIndex={colorIndex} />

          <div className="mt-10">
            <Disclosure title="배송 정보">
              캘거리에서 주 3회 출고합니다. 출고 후 한국 자택까지 영업일 기준 7~14일 걸립니다.
              국제 배송비는 무게와 부피에 따라 결제 단계에서 계산됩니다.
            </Disclosure>
            <Disclosure title="관세·부가세">
              미화 150달러 이하는 관세와 부가세가 면제됩니다. 넘으면 상품가와 국제 운임을 합한 금액
              전체에 부과되고, 통관할 때 받는 분이 납부합니다. 판매가에는 포함되어 있지 않습니다.
              {ckfta && ' 이 상품은 캐나다산이라 관세는 면제되고 부가세만 붙습니다.'}
            </Disclosure>
            <Disclosure title="교환 및 반품">
              해외 배송이어도 교환과 반품이 가능합니다. 국제 배송 중 발생한 파손·분실에 대한 1차
              책임은 RICKY가 집니다. 조건과 절차는 교환·반품 정책에서 확인해 주십시오.
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
            캘거리 현지 공식 매장에서 직접 매입한 {product.brand} {product.name}입니다.
            {product.variants.length > 1 && ` 색상은 ${product.variants.map((v) => v.colorKo).join(', ')} 중에 고를 수 있습니다.`}
          </p>
          <p className="mt-4">
            출고 전에 실물 택과 시리얼, 사이즈 라벨, 봉제를 촬영해서 남기고, 매입 영수증과
            인보이스를 상자에 함께 넣습니다.
          </p>
        </div>
      </section>

      {/* 공식몰 상품 상세 — 상품 단위 (아크테릭스) */}
      <ProductDetails product={product} />

      {/* 상품 사양 — 선택한 색상 기준 (코치). 법정 고시 표보다 위에 둔다 */}
      <ProductSpecs variant={variant} />

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
        <p className="mt-3 text-body text-muted-text">아직 등록된 후기가 없습니다.</p>
      </section>

      <p className="mt-16 max-w-[var(--measure-prose)] text-meta leading-relaxed text-muted-text">
        RICKY는 캐나다 현지 공식 매장에서 상품을 직접 매입해 판매하는 독립 사업자입니다.
        각 브랜드의 공식 수입사·총판·대리점이 아니며, 브랜드와 직접적인 제휴 관계는 없습니다.
      </p>
    </Container>
  );
}
