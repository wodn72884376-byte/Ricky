'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { add } from '@/lib/cart-store';
import { cn } from '@/lib/utils/cn';
import type { CatalogProduct } from '@/lib/catalog';

/**
 * 색상·사이즈 선택과 구매 컨트롤.
 *
 * 레퍼런스는 `장바구니`와 `바로 구매`를 둘 다 검정으로 둔다. 우리는 그렇게 하지 않는다 —
 * DESIGN.md §4는 반전 블랙 CTA를 **화면당 하나**로 제한한다. 두 개를 나란히 검정으로 두면
 * 어느 것이 주인지 사라지고, 반전이 가진 무게도 함께 사라진다.
 * 그래서 `바로 구매`가 반전이고 `장바구니 담기`는 고스트다.
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

  function requireSize(): boolean {
    if (size) return true;
    setError('사이즈를 선택해 주세요.');
    return false;
  }

  function addToCart() {
    if (!requireSize()) return;
    add(product.slug, size, 1);
    setError(null);
    router.refresh();
  }

  function buyNow() {
    if (!requireSize()) return;
    add(product.slug, size, 1);
    router.push('/checkout');
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
        {error && (
          <p role="alert" className="mt-3 text-label text-error">{error}</p>
        )}
      </fieldset>

      <div className="mt-8 flex flex-col gap-3">
        <Button variant="inverted" size="lg" onClick={buyNow} className="w-full">
          바로 구매
        </Button>
        <Button variant="ghost" size="lg" onClick={addToCart} className="w-full">
          장바구니 담기
        </Button>
        {/* 재입고 알림은 품절일 때만 의미가 있다. 지금은 재고 연동 전이라 감춘다. */}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-meta text-muted-text">
        <span>주 3회 출고 · 영업일 4~10일</span>
        <ButtonLink href="/policy/returns" size="sm" variant="ghost" className="border-0 px-0 underline underline-offset-4">
          교환·반품 안내
        </ButtonLink>
      </div>
    </>
  );
}
