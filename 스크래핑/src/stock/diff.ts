/**
 * 재고 변화 감지 — 순수 함수 (PROJECT.md §6.6).
 *
 * 재고 조회는 스냅샷 하나만으로는 쓸모가 절반이다. 판매 판단을 바꾸는 건
 * "지금 품절"이 아니라 "방금 품절됐다" / "재입고됐다" / "가격이 올랐다"이다.
 *
 * 대조 키는 SKU 다. SKU 가 없는 사이트를 대비해 (상품코드 + 색상 + 사이즈)를
 * 대체 키로 쓴다 — 이 조합이 곧 색상·사이즈 구분의 정의이기도 하다.
 */
import type { Availability } from '../core/types.ts';
import type { StockRow } from './types.ts';

export type StockEventType =
  | 'oos' // 재고 → 품절
  | 'restock' // 품절 → 재고
  | 'low_stock' // 재고 → 임박
  | 'price_up'
  | 'price_down'
  | 'added' // 새 variant (신규 색상·사이즈 편성)
  | 'removed'; // 사라진 variant (단종 의심)

export type StockEvent = {
  type: StockEventType;
  brand: StockRow['brand'];
  productName: string;
  productUrl: string;
  sku: string | null;
  colour: string | null;
  size: string;
  before: string | null;
  after: string | null;
  /** 가격 변동폭 (CAD cent). 가격 이벤트에만 채워진다. */
  deltaCents?: number;
  occurredAt: string;
};

/** variant 대조 키. SKU 우선, 없으면 상품코드+색상+사이즈. */
export function variantKey(row: StockRow): string {
  if (row.sku) return `sku:${row.sku.replace(/\s+/g, ' ').trim()}`;
  return `cs:${row.productCode ?? row.productUrl}|${row.colour ?? ''}|${row.size.label}`;
}

const isAvailable = (a: Availability) => a === 'in_stock';

/**
 * 이전 스냅샷과 현재를 비교해 이벤트를 낸다.
 *
 * 주의: 수집 실패한 상품은 `previous`/`current` 어느 쪽에도 넣지 않아야 한다.
 * 실패를 "사라짐"으로 읽으면 멀쩡한 상품에 단종 이벤트가 뜬다 (§6.3 5번).
 */
export function diffStock(
  previous: StockRow[],
  current: StockRow[],
  now = new Date().toISOString(),
): StockEvent[] {
  /*
   * 이번에 조회한 상품만 비교한다.
   *
   * 조회 대상이 매번 같지 않다 — 자동 수집은 아크테릭스·코치, 북마클릿 수집은 폴로처럼
   * 서로 다른 묶음이 번갈아 들어온다. 전체를 맞대면 "이번에 안 본 상품"이 전부
   * '사라짐'으로, 새 상품이 전부 '신규'로 잡혀 진짜 변화가 노이즈에 묻힌다.
   * (실측: 폴로 70개를 아크테릭스·코치 99개와 맞대 가짜 이벤트 169건이 났다.)
   *
   * 안 본 상품은 사라진 게 아니라 안 본 것이다.
   */
  const checkedProducts = new Set(current.map((r) => r.productUrl));
  const scopedPrevious = previous.filter((r) => checkedProducts.has(r.productUrl));

  const prev = new Map(scopedPrevious.map((r) => [variantKey(r), r]));
  const cur = new Map(current.map((r) => [variantKey(r), r]));
  const events: StockEvent[] = [];

  const base = (r: StockRow) => ({
    brand: r.brand,
    productName: r.productName,
    productUrl: r.productUrl,
    sku: r.sku,
    colour: r.colour,
    size: r.size.label,
    occurredAt: now,
  });

  for (const [key, c] of cur) {
    const p = prev.get(key);

    if (!p) {
      events.push({ ...base(c), type: 'added', before: null, after: c.availability });
      continue;
    }

    // 재고 상태 변화
    if (p.availability !== c.availability) {
      const type: StockEventType | null = !isAvailable(p.availability) && isAvailable(c.availability)
        ? 'restock'
        : isAvailable(p.availability) && c.availability === 'low_stock'
          ? 'low_stock'
          : isAvailable(p.availability) && !isAvailable(c.availability)
            ? 'oos'
            : null;

      if (type) {
        events.push({ ...base(c), type, before: p.availability, after: c.availability });
      }
    }

    // 가격 변화 — 마진에 직결되므로 방향까지 남긴다
    if (p.priceCents !== null && c.priceCents !== null && p.priceCents !== c.priceCents) {
      events.push({
        ...base(c),
        type: c.priceCents > p.priceCents ? 'price_up' : 'price_down',
        before: String(p.priceCents),
        after: String(c.priceCents),
        deltaCents: c.priceCents - p.priceCents,
      });
    }
  }

  for (const [key, p] of prev) {
    if (!cur.has(key)) {
      events.push({ ...base(p), type: 'removed', before: p.availability, after: null });
    }
  }

  return events;
}

/** 운영자가 먼저 봐야 하는 순서. 판매 가능 여부를 바꾸는 것이 위다. */
const PRIORITY: Record<StockEventType, number> = {
  oos: 0,
  restock: 1,
  price_up: 2,
  low_stock: 3,
  removed: 4,
  added: 5,
  price_down: 6,
};

export function sortEvents(events: StockEvent[]): StockEvent[] {
  return [...events].sort(
    (a, b) => PRIORITY[a.type] - PRIORITY[b.type] || a.productName.localeCompare(b.productName),
  );
}

export const EVENT_LABEL: Record<StockEventType, string> = {
  oos: '품절',
  restock: '재입고',
  low_stock: '재고 임박',
  price_up: '가격 인상',
  price_down: '가격 인하',
  added: '신규 편성',
  removed: '목록에서 사라짐',
};
