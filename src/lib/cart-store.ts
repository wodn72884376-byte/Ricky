'use client';

/**
 * 장바구니. 상품·옵션 식별자와 수량만 저장한다.
 *
 * **가격을 저장하지 않는다.** 오래된 가격으로 결제되면 마진이 깨진다 (docs/IA.md §5-6).
 * 화면에 뜨는 금액은 항상 현재 카탈로그에서 다시 읽는다.
 *
 * 로그인 전에도 담을 수 있어야 하므로 localStorage가 출발점이다 — 주문은 회원 전용이지만
 * 담는 것까지 막으면 로그인할 이유를 보기 전에 벽을 세우는 셈이다.
 * TODO(sync): 로그인 시 서버 장바구니와 병합한다.
 */

const KEY = 'ricky.cart';

/**
 * `color`는 variant의 영문 색상명이다. 인덱스로 두면 카탈로그를 다시 생성할 때
 * 순서가 밀려 다른 색이 담긴다. 코치처럼 **색상마다 값이 다른 상품**이 있으므로
 * 색상 없이는 금액을 정할 수 없다.
 */
export type CartLine = { id: string; size: string | null; color?: string | null; qty: number };

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

function keyOf(line: { id: string; size: string | null; color?: string | null }) {
  return `${line.id}::${line.size ?? ''}::${line.color ?? ''}`;
}

export function add(id: string, size: string | null, color: string | null, qty = 1): void {
  const lines = [...load()];
  const found = lines.find((l) => keyOf(l) === keyOf({ id, size, color }));
  // 같은 옵션이면 수량을 더한다. 한 상품에 최대 10개 — 개인 사용 목적 통관 범위를 넘지 않게.
  if (found) found.qty = Math.min(found.qty + qty, 10);
  else lines.push({ id, size, color, qty: Math.min(qty, 10) });
  save(lines);
}

export function setQty(id: string, size: string | null, color: string | null, qty: number): void {
  const next = load().map((l) =>
    keyOf(l) === keyOf({ id, size, color }) ? { ...l, qty: Math.max(1, Math.min(qty, 10)) } : l,
  );
  save(next);
}

export function remove(id: string, size: string | null, color: string | null): void {
  save(load().filter((l) => keyOf(l) !== keyOf({ id, size, color })));
}

export function clear(): void {
  save([]);
}

export function count(): number {
  return load().reduce((sum, l) => sum + l.qty, 0);
}
