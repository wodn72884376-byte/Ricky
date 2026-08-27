/**
 * 통화 유틸.
 * 규칙(CLAUDE.md): KRW = 정수(원), CAD/USD = 정수(cent). 통화 연산에 float 누적 금지.
 */

/** 원 단위 표시. 예: 1234000 → "₩1,234,000" */
export function formatKrw(krw: number): string {
  return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(krw))}`;
}

/** CAD cent 표시. 예: 45999 → "CA$459.99" */
export function formatCad(cents: number): string {
  return `CA$${new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`;
}

/** unit 단위 올림. 판매가는 100원 단위로 올린다. */
export function ceilTo(value: number, unit: number): number {
  if (unit <= 0) return Math.ceil(value);
  return Math.ceil(value / unit) * unit;
}

/** 세액은 10원 미만 절사(내림)한다. */
export function floorTo(value: number, unit: number): number {
  if (unit <= 0) return Math.floor(value);
  return Math.floor(value / unit) * unit;
}

/** CAD cent → KRW 정수 */
export function cadCentsToKrw(cents: number, cadKrwRate: number): number {
  return Math.round((cents / 100) * cadKrwRate);
}

/** KRW → USD (통관 신고가 산정용, 소수 2자리 유지) */
export function krwToUsd(krw: number, usdKrwRate: number): number {
  if (usdKrwRate <= 0) throw new Error('usdKrwRate must be > 0');
  return Math.round((krw / usdKrwRate) * 100) / 100;
}
