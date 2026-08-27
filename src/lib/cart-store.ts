'use client';

/**
 * 장바구니. `variantId`와 수량만 저장한다.
 *
 * **가격을 저장하지 않는다.** 오래된 가격으로 결제되면 마진이 깨진다 (docs/IA.md §5-6).
 * 화면에 뜨는 금액은 항상 현재 카탈로그에서 다시 읽는다.
 *
 * 비회원 주문을 허용하므로 localStorage가 출발점이다.
 * TODO(sync): 로그인 시 서버 장바구니와 병합. 찜(wishlist)과 같은 시점에 처리한다.
 */

const KEY = 'ricky.cart';

export type CartLine = { id: string; size: string | null; qty: number };

const listeners = new Set<() => void>();
let cached: CartLine[] | null = null;

function load(): CartLine[] {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    cached = Array.isArray(parsed) ? parsed : [];
  } catch {
    cached = [];
  }
  return cached;
}

function save(lines: CartLine[]) {
  cached = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* 저장 실패해도 이번 세션은 동작한다 */
  }
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cached = null;
      for (const l of listeners) l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getLines(): CartLine[] {
  return load();
}

/** 서버 렌더 시에는 비어 있다. 장바구니는 브라우저에만 있다. */
const EMPTY: CartLine[] = [];
export function getLinesOnServer(): CartLine[] {
  return EMPTY;
}

function keyOf(line: { id: string; size: string | null }) {
  return `${line.id}::${line.size ?? ''}`;
}

export function add(id: string, size: string | null, qty = 1): void {
  const lines = [...load()];
  const found = lines.find((l) => keyOf(l) === keyOf({ id, size }));
  // 같은 옵션이면 수량을 더한다. 한 상품에 최대 10개 — 개인 사용 목적 통관 범위를 넘지 않게.
  if (found) found.qty = Math.min(found.qty + qty, 10);
  else lines.push({ id, size, qty: Math.min(qty, 10) });
  save(lines);
}

export function setQty(id: string, size: string | null, qty: number): void {
  const next = load()
    .map((l) => (keyOf(l) === keyOf({ id, size }) ? { ...l, qty: Math.max(1, Math.min(qty, 10)) } : l));
  save(next);
}

export function remove(id: string, size: string | null): void {
  save(load().filter((l) => keyOf(l) !== keyOf({ id, size })));
}

export function clear(): void {
  save([]);
}

export function count(): number {
  return load().reduce((sum, l) => sum + l.qty, 0);
}
