'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NaverPayButton } from '@/components/store/naver-pay-button';
import { Button } from '@/components/ui/button';
import { add } from '@/lib/cart-store';
import { cn } from '@/lib/utils/cn';
import type { CatalogProduct } from '@/lib/catalog';
import type { StockCell } from '@/app/api/stock/[slug]/route';

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

  /*
   * 재고는 요청 시점에 읽는다.
   *
   * 이 페이지는 정적으로 생성된다 — 사진과 문구는 자주 바뀌지 않으니 그게 맞다.
   * 하지만 재고는 6시간마다 바뀌고, 신선도 게이트를 넘긴 값으로 팔면 안 된다
   * (PROJECT.md §6). 그래서 재고만 따로 가져온다.
   *
   * `null` 은 **아직 모른다**는 뜻이다. 모를 때 팔 수 있다고 하지 않는다.
   */
  const [stock, setStock] = useState<StockCell[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/stock/${product.slug}`)
      .then((r) => r.json())
      .then((j) => { if (alive) setStock(j.cells ?? []); })
      .catch(() => { if (alive) setStock([]); });
    return () => { alive = false; };
  }, [product.slug]);

  const variant = product.variants[colorIndex] ?? product.variants[0]!;

  /*
    구매 경로. **색상 전용 주소가 있으면 그것이 이긴다** — 스마트스토어에 색상마다 상품을
    따로 등록한 경우이고, 그러면 고객이 여기서 고른 색을 저쪽에서 다시 고르지 않아도 된다.

    없으면 상품 주소로 떨어진다. 그때는 색상까지 다시 골라야 하므로 안내 문구가 달라진다 —
    "다시 안 골라도 된다"고 써 놓고 고르게 만들면 그게 제일 나쁘다.
  */
  const mine = stock?.filter((c) => c.color === variant.color) ?? [];

  /*
   * 화면에 그릴 사이즈.
   *
   * 카탈로그 사이즈는 `details.txt` 에서 온 값이라 빠지는 게 있다 — 실측: 공식몰이
   * 파는 XXL 이 카탈로그엔 없어 DB 에는 들어갔는데 고객이 고를 수가 없었다.
   * 재고가 말해 주는 사이즈를 합친다. 순서는 카탈로그를 먼저 두고 새 것을 뒤에 붙인다.
   */
  const sizes = [...product.sizes, ...mine.map((c) => c.size).filter((s) => !product.sizes.includes(s))];
  /**
   * 이 색상에서 살 수 있는 사이즈. **아직 모르면 null 이다.**
   *
   * 판단은 **상품 단위**로 한다.
   *   기록이 하나도 없다 → 모른다. 게시 전이거나 한 번도 수집이 안 된 것이지 품절이
   *                       아니다. 이걸 품절로 그리면 게시 전 상품이 전부 '재입고 대기'다.
   *   기록이 있다        → 수집이 돌았다는 뜻이므로 **거기 없는 칸은 품절로 본다.**
   *                       색상 하나가 통째로 빠진 경우도 같다 — 확인되지 않은 것을
   *                       팔 수 있다고 그리는 쪽이 더 나쁘다 (PROJECT.md §6).
   */
  const sellable =
    stock === null || stock.length === 0
      ? null
      : new Set(mine.filter((c) => c.purchasable).map((c) => c.size));

  const soldOut = (s: string) => sellable !== null && !sellable.has(s);
  /** 이 색상에 팔 수 있는 사이즈가 하나도 없다 */
  const allSoldOut = sellable !== null && sizes.every(soldOut);

  const buyUrl = variant.smartstoreUrl ?? product.smartstoreUrl;
  const colorIsPicked = variant.smartstoreUrl !== null;
  const sizeIsPicked = sizes.length <= 1;

  function addToCart() {
    if (!size) {
      setError('사이즈를 선택해 주십시오.');
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
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              disabled={soldOut(s)}
              onClick={() => { setSize(s); setError(null); }}
              aria-pressed={size === s}
              aria-label={soldOut(s) ? `${s} 품절` : s}
              className={cn(
                'flex h-12 min-w-16 items-center justify-center rounded-ghost border px-3 text-util transition-colors',
                size === s
                  ? 'border-ink bg-ink text-paper'
                  : 'border-outline-strong text-ink hover:border-ink',
                // 보더 색은 바꾸지 않는다 — 재입고 시 지오메트리가 흔들리지 않게 (§14)
                soldOut(s) && 'cursor-default opacity-40 hover:border-outline-strong',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {/*
          모를 때와 품절일 때를 다르게 적는다. 둘 다 '지금은 못 산다'지만
          고객이 할 일이 다르다 — 기다리면 되는가, 다른 사이즈를 고르면 되는가.
        */}
        {stock === null ? (
          <p className="mt-3 text-meta text-muted-text">재고를 확인하고 있습니다</p>
        ) : allSoldOut ? (
          <p className="mt-3 text-meta text-muted-text">지금은 재입고를 기다리는 중입니다</p>
        ) : null}
        <Link href="/guide/sizing" className="mt-3 inline-flex text-meta text-muted-text underline underline-offset-4">
          사이즈 & 핏
        </Link>
        {error && <p role="alert" className="mt-3 text-label text-error">{error}</p>}
      </fieldset>

      <div className="mt-8 flex flex-col gap-3">
        {buyUrl ? (
          <>
            <NaverPayButton href={buyUrl} />
            {/*
              고른 값을 얼마나 들고 갈 수 있는지를 버튼 앞이 아니라 뒤에 적는다 —
              막는 게 아니라 알리는 것이므로 경고가 아니라 각주 위계다 (DESIGN.md §12-8).
            */}
            <p className="mt-2 text-meta leading-relaxed text-muted-text">
              {handoffNote({ colorIsPicked, sizeIsPicked, colorKo: variant.colorKo, size })}
            </p>
          </>
        ) : (
          /* 살 수 있는 경로가 없으면 있는 척하지 않는다 (§12-8) */
          <div className="border border-outline p-5">
            <p className="text-product font-bold text-ink">아직 판매를 준비하고 있습니다</p>
            <p className="mt-2 text-meta leading-relaxed text-muted-text">
              스마트스토어에 등록되는 대로 구매하실 수 있습니다. 급하시면 문의해 주십시오.
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

/**
 * 스마트스토어로 넘어갈 때 무엇이 들려 가고 무엇을 다시 골라야 하는지 한 문장으로 적는다.
 *
 * 네 경우가 다르고, **네 문장이 전부 사실이어야 한다.** 색상 전용 주소가 없는데
 * "바로 가요"라고 쓰면 고객은 색을 다시 고르면서 속았다고 느낀다 (DESIGN.md §12-8).
 *
 * 주소가 그 색상 페이지를 연다는 것까지만 말한다 — 옵션이 미리 선택된 채로 열리는지는
 * 스마트스토어 쪽 설정이라 우리가 보장할 수 없다.
 */
function handoffNote({
  colorIsPicked,
  sizeIsPicked,
  colorKo,
  size,
}: {
  colorIsPicked: boolean;
  sizeIsPicked: boolean;
  colorKo: string;
  size: string | null;
}): string {
  const head = '네이버 스마트스토어에서 결제합니다.';

  if (colorIsPicked) {
    if (sizeIsPicked) return `${head} ${colorKo} 페이지로 바로 갑니다.`;
    return `${head} ${colorKo} 페이지로 바로 가고, 사이즈만 그쪽에서 골라 주십시오${
      size ? ` — 지금 보고 계신 건 ${size}입니다` : ''
    }.`;
  }

  const rest = sizeIsPicked ? '색상은' : '색상·사이즈는';
  const picked = sizeIsPicked || !size ? colorKo : `${colorKo} · ${size}`;
  return `${head} ${rest} 그쪽에서 한 번 더 골라 주십시오 — 지금 보고 계신 건 ${picked}입니다.`;
}
