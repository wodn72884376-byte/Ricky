/**
 * 가격 문자열 → 정수 minor unit.
 *
 * CLAUDE.md 규칙 2: KRW = 원 단위 정수, CAD = cent 단위 정수.
 * 파싱 단계에서 float 을 만들지 않도록, 소수점 자릿수를 문자열에서 직접 읽어 정수화한다.
 */

/** "CA$1,234.50" / "$1,234.50 CAD" / "1234.5" → 123450 */
export function parseCadCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) ? Math.round(input * 100) : null;
  }
  const m = input.replace(/[\s ]/g, '').match(/(\d[\d,]*)(?:[.](\d{1,2}))?/);
  if (!m || !m[1]) return null;
  const whole = m[1].replace(/,/g, '');
  const frac = (m[2] ?? '').padEnd(2, '0');
  const cents = Number(whole) * 100 + Number(frac);
  return Number.isFinite(cents) ? cents : null;
}

/** "₩1,234,000" / "1,234,000원" / "1234000" → 1234000 */
export function parseKrw(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input) : null;

  // 한국 사이트는 "1,234,000원" 또는 "₩1,234,000" 이 대부분이고 소수점은 쓰지 않는다.
  const cleaned = input.replace(/[\s ]/g, '');
  const m = cleaned.match(/(\d[\d,]*)/);
  if (!m || !m[1]) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * 페이지에서 읽은 값이 실제로 그 지역 통화인지 확인한다.
 * PROJECT.md §6.3 4번: 통화가 CAD 가 아니면 해당 수집분은 무효 처리한다.
 */
export function currencyMatches(raw: string | null | undefined, expected: 'CAD' | 'KRW'): boolean {
  if (!raw) return false;
  const v = raw.trim().toUpperCase();
  return v === expected;
}

/** schema.org availability URL → 내부 어휘 */
export function parseAvailability(
  raw: string | null | undefined,
): 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'unknown' {
  if (!raw) return 'unknown';
  const v = raw.toLowerCase();
  if (v.includes('discontinued')) return 'discontinued';
  if (v.includes('limitedavailability') || v.includes('lowstock')) return 'low_stock';
  if (v.includes('backorder') || v.includes('presale') || v.includes('preorder')) return 'low_stock';
  if (v.includes('outofstock') || v.includes('soldout')) return 'out_of_stock';
  if (v.includes('instock') || v.includes('onlineonly') || v.includes('instoreonly'))
    return 'in_stock';
  return 'unknown';
}
