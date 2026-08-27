/**
 * 찜 목록의 클라이언트 저장소.
 *
 * `localStorage`는 React 바깥의 외부 스토어이므로 `useSyncExternalStore`로 읽는다.
 * effect에서 setState로 끌어오면 하이드레이션 직후 한 번 더 렌더되고, 탭 간 동기화도 안 된다.
 *
 * 비회원도 찜할 수 있어야 해서 여기 둔다 — `wishlists` 테이블은 `customer_id`가 필수라
 * 회원 전용이다 (docs/IA.md §5-4).
 *
 * TODO(sync): 로그인 시 이 목록을 `wishlists`로 병합한다.
 */

const KEY = 'ricky.wishlist';

const listeners = new Set<() => void>();

/** 같은 탭 안의 변경을 알린다. 다른 탭은 `storage` 이벤트가 처리한다. */
function emit() {
  for (const listener of listeners) listener();
}

function readAll(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // 프라이빗 모드·저장소 차단에서도 화면은 정상 동작해야 한다
    return [];
  }
}

/**
 * 스냅샷 캐시. `useSyncExternalStore`는 getSnapshot이 같은 값을 반환해야
 * 무한 렌더에 빠지지 않으므로, 원본 문자열이 바뀔 때만 새로 파싱한다.
 */
let cachedRaw: string | null = null;
let cachedIds: string[] = [];

function snapshotIds(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cachedIds;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = readAll();
  }
  return cachedIds;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) emit();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function isSaved(productId: string): boolean {
  return snapshotIds().includes(productId);
}

/** SSR 스냅샷. 서버는 저장소를 모르므로 항상 미저장으로 그린다. */
export function isSavedOnServer(): boolean {
  return false;
}

export function toggle(productId: string): void {
  const ids = snapshotIds();
  const next = ids.includes(productId)
    ? ids.filter((id) => id !== productId)
    : [...ids, productId];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패는 조용히 넘긴다 — 찜은 부가 기능이다 */
  }
  emit();
}
