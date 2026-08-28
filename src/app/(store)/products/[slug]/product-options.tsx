'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NaverPayButton } from '@/components/store/naver-pay-button';
import { Button } from '@/components/ui/button';
import { add } from '@/lib/cart-store';
import { cn } from '@/lib/utils/cn';
import type { CatalogProduct } from '@/lib/catalog';

/**
 * 색상·사이즈 선택과 구매 컨트롤.
 *
 * **결제는 스마트스토어가 한다** (2026-08-28 운영자 결정). 자체 장바구니도 결제도 없다 —
 * 구매 버튼은 이 상품의 스마트스토어 페이지를 새 탭으로 연다.
 *
 * 그래서 사이즈·색상 선택은 **주문을 만들지 않는다.** 고객이 스마트스토어에서 다시 고르므로
 * 여기서 고른 값은 참고용이고, 화면은 그 사실을 숨기지 않는다.
 *
 * 장바구니는 남는다. 결제는 상품 하나씩 일어나지만, 배송비가 상품마다 정해져 있어서
 * 담아 두면 총액을 미리 알 수 있다 — 담는 것과 결제하는 것을 분리한 셈이다.
 */
export function ProductOptions({
  product,
  colorIndex,
}: {
  product: CatalogProduct;
  colorIndex: number;
}) {
  const router = useRouter();
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0]! : null,
  );
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants[colorIndex] ?? product.variants[0]!;

  function addToCart() {
    if (!size) {
      setError('사이즈를 선택해 주세요.');
      return;
    }
    add(product.slug, size, variant.color, 1);
    setError(null);
    router.refresh();
  }

  return (
    <>
      {/* 색상 — 스와치는 링크다. URL이 바뀌어야 공유했을 때 같은 색이 열린다. */}
      {product.variants.length > 1 && (
        <div className="mt-8">
          <p className="text-util text-ink">
            색상: <span className="font-bold">{variant.colorKo}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((v, i) => (
              <Link
                key={v.sku}
                href={`/products/${product.slug}?color=${i}`}
                scroll={false}
                aria-current={i === colorIndex ? 'true' : undefined}
                className={cn(
                  'relative size-14 overflow-hidden border transition-colors',
                  i === colorIndex ? 'border-ink' : 'border-outline hover:border-ink',
                )}
              >
                <span className="sr-only">{v.colorKo}</span>
                {/* 색 이름만으로는 무슨 색인지 모른다. 실제 상품 컷을 스와치로 쓴다. */}
                <Image src={v.cardImage} alt="" fill sizes="56px" className="object-cover" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <fieldset className="mt-8">
        <legend className="text-util font-bold text-ink">사이즈</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setSize(s); setError(null); }}
              aria-pressed={size === s}
              className={cn(
                'flex h-12 min-w-16 items-center justify-center rounded-ghost border px-3 text-util transition-colors',
                size === s
                  ? 'border-ink bg-ink text-paper'
                  : 'border-outline-strong text-ink hover:border-ink',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Link href="/guide/sizing" className="mt-3 inline-flex text-meta text-muted-text underline underline-offset-4">
          사이즈 & 핏
        </Link>
        {error && <p role="alert" className="mt-3 text-label text-error">{error}</p>}
      </fieldset>

      <div className="mt-8 flex flex-col gap-3">
        {product.smartstoreUrl ? (
          <>
            <NaverPayButton href={product.smartstoreUrl} />
            {/*
              고른 값을 들고 갈 수 없다는 사실을 버튼 앞이 아니라 뒤에 적는다 —
              막는 게 아니라 알리는 것이므로 경고가 아니라 각주 위계다 (DESIGN.md §12-8).
            */}
            <p className="mt-2 text-meta leading-relaxed text-muted-text">
              네이버 스마트스토어에서 결제해요. 색상{product.sizes.length > 1 && '·사이즈'}은 그쪽에서 한 번 더
              골라 주세요{size && ` — 지금 보고 계신 건 ${variant.colorKo}${product.sizes.length > 1 ? ` · ${size}` : ''}예요`}.
            </p>
          </>
        ) : (
          /* 살 수 있는 경로가 없으면 있는 척하지 않는다 (§12-8) */
          <div className="border border-outline p-5">
            <p className="text-product font-bold text-ink">아직 판매를 준비하고 있어요</p>
            <p className="mt-2 text-meta leading-relaxed text-muted-text">
              스마트스토어에 등록되는 대로 구매하실 수 있어요. 급하시면 문의해 주세요.
            </p>
            <Link
              href="/support#inquiry"
              className="mt-3 inline-flex text-meta text-ink underline underline-offset-4"
            >
              1:1 문의
            </Link>
          </div>
        )}

        {/* 담기는 구매 경로와 무관하다 — 아직 못 사는 상품도 담아 두고 총액을 볼 수 있다 */}
        <Button variant="ghost" size="lg" onClick={addToCart} className="w-full">
          장바구니 담기
        </Button>
      </div>

      {/*
        구매 CTA 바로 아래 각주.
        배송 문구와 링크가 서로 떨어져 있으면 링크가 어디에도 안 붙은 것처럼 보인다 —
        같은 블록으로 묶고 행간만으로 나눈다 (2026-08-28 운영자 지적).
      */}
      <div className="mt-4 text-meta leading-relaxed text-muted-text">
        <p>주 3회 출고 · 영업일 7~14일 · 상품 1개씩 주문</p>
        <p className="mt-0.5">
          <Link href="/policy/returns" className="text-ink underline underline-offset-4">
            교환·반품 안내
          </Link>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <Link href="/policy/shipping" className="text-ink underline underline-offset-4">
            배송 안내
          </Link>
        </p>
      </div>
    </>
  );
}
