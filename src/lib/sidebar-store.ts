/**
 * 관리자 사이드바 접힘 상태.
 *
 * localStorage는 React 바깥의 외부 스토어이므로 `useSyncExternalStore`로 읽는다.
 * 새로고침해도 접힘 상태가 유지돼야 한다 — 운영자는 하루에 수십 번 이 화면을 연다.
 */

const KEY = 'ricky.admin.sidebar';
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) for (const l of listeners) l();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** 기본은 펼침. 처음 오는 운영자에게 라벨이 보여야 한다. */
export function isOpen(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'closed';
  } catch {
    return true;
  }
}

export function isOpenOnServer(): boolean {
  return true;
}

export function toggle(): void {
  try {
    localStorage.setItem(KEY, isOpen() ? 'closed' : 'open');
  } catch {
    /* 저장 실패해도 이번 세션은 동작한다 */
  }
  for (const l of listeners) l();
}
