/**
 * 날짜 표시.
 *
 * **표준 시간대를 반드시 명시한다.** 서버는 UTC로 돌고(Vercel) 고객은 한국에 있다 —
 * 생략하면 한국 시각 오전 9시 이전의 주문이 하루 앞선 날짜로 보이고,
 * 서버 렌더와 클라이언트 렌더가 갈려 하이드레이션이 어긋난다.
 */
const KST = 'Asia/Seoul';

/** `2026년 8월 27일`. 파싱할 수 없는 값은 빈 문자열이다 — 화면에 `Invalid Date`를 두지 않는다. */
export function formatKoDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/** `2026년 8월 27일 14:32`. 검수 사진 촬영 시각처럼 시각까지 필요한 곳에 쓴다. */
export function formatKoDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * 경과 시간. `3일 전` · `2시간 전` · `방금`.
 *
 * 관리자 표에서 **방치된 건을 눈에 띄게 하려고** 쓴다 (docs/wireframes/08-admin.md §2).
 * 절대 시각보다 "얼마나 지났나"가 처리 판단에 직접 쓰이는 값이다.
 *
 * 서버에서만 부르는 것을 전제로 한다 — 클라이언트에서 같이 렌더하면 `now` 가 달라
 * 하이드레이션이 어긋난다.
 */
export function formatElapsed(value: string | Date, now: Date = new Date()): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';

  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  const months = Math.floor(days / 30);
  return months < 12 ? `${months}개월 전` : `${Math.floor(months / 12)}년 전`;
}
