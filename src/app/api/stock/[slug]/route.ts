import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 한 상품의 실시간 재고.
 *
 * 상품 상세는 정적으로 생성된다 — 사진과 문구는 자주 바뀌지 않기 때문이다.
 * 재고는 다르다. 6시간마다 수집한 값이 DB 에 들어오고, 신선도 게이트(기본 6h)를
 * 넘기면 팔면 안 된다(PROJECT.md §6). 그래서 재고만 요청 시점에 따로 읽는다.
 *
 * **`store_variants` 뷰로만 읽는다** (CLAUDE.md 규칙 1). 원가·마진·환율은 그 뷰에
 * 없으므로 이 응답에 섞일 수 없다.
 */
export const dynamic = 'force-dynamic';

export type StockCell = {
  color: string;
  size: string;
  purchasable: boolean;
  /** 공급처를 마지막으로 확인한 시각. 없으면 한 번도 못 받은 것이다. */
  checkedAt: string | null;
};

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const db = await createClient();

  const { data, error } = await db
    .from('store_variants')
    .select('color, size, purchasable, supplier_checked_at, products!inner(slug)')
    .eq('products.slug', slug);

  if (error) {
    /*
     * 재고를 모를 때 "있다"고 답하지 않는다 — 그 답으로 품절 상품이 팔린다.
     * 빈 목록은 화면에서 '재고를 확인하고 있어요'로 읽힌다.
     */
    return NextResponse.json(
      { cells: [], degraded: true },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  }

  // 뷰 타입상 색상·사이즈가 nullable 이다. 어느 칸인지 모르는 값은 쓸 데가 없다.
  const cells: StockCell[] = (data ?? []).flatMap((r) =>
    r.color === null || r.size === null
      ? []
      : [{
          color: r.color,
          size: r.size,
          purchasable: r.purchasable === true,
          checkedAt: r.supplier_checked_at,
        }],
  );

  return NextResponse.json(
    { cells, degraded: false },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
}
