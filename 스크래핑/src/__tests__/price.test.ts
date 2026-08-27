import { describe, expect, it } from 'vitest';
import { currencyMatches, parseAvailability, parseCadCents, parseKrw } from '../extract/price.ts';

describe('parseCadCents', () => {
  it('통화 기호와 천단위 쉼표를 처리한다', () => {
    expect(parseCadCents('CA$1,234.50')).toBe(123450);
    expect(parseCadCents('$459.99')).toBe(45999);
    expect(parseCadCents('1234.5')).toBe(123450);
  });

  it('소수점이 없으면 cent 를 00 으로 채운다', () => {
    expect(parseCadCents('520')).toBe(52000);
  });

  it('JSON-LD 가 number 로 주는 경우도 정수 cent 로 만든다', () => {
    expect(parseCadCents(520)).toBe(52000);
    expect(parseCadCents(459.99)).toBe(45999);
  });

  it('부동소수 오차를 남기지 않는다', () => {
    // 0.1 + 0.2 류의 누적 오차가 금액에 스며들면 안 된다 (CLAUDE.md 규칙 2)
    expect(Number.isInteger(parseCadCents('1099.99'))).toBe(true);
    expect(parseCadCents('1099.99')).toBe(109999);
  });

  it('값이 없으면 null', () => {
    expect(parseCadCents(null)).toBeNull();
    expect(parseCadCents('가격문의')).toBeNull();
  });
});

describe('parseKrw', () => {
  it('원화 표기를 정수 원으로 만든다', () => {
    expect(parseKrw('₩1,234,000')).toBe(1234000);
    expect(parseKrw('1,234,000원')).toBe(1234000);
    expect(parseKrw('1234000')).toBe(1234000);
  });

  it('KRW 는 소수를 만들지 않는다', () => {
    expect(Number.isInteger(parseKrw('890000') ?? 0)).toBe(true);
  });

  it('값이 없으면 null', () => {
    expect(parseKrw(null)).toBeNull();
    expect(parseKrw('품절')).toBeNull();
  });
});

describe('currencyMatches', () => {
  it('지역 통화가 아니면 수집분을 무효 처리할 수 있게 false 를 준다', () => {
    expect(currencyMatches('CAD', 'CAD')).toBe(true);
    expect(currencyMatches('USD', 'CAD')).toBe(false);
    expect(currencyMatches(null, 'CAD')).toBe(false);
  });
});

describe('parseAvailability', () => {
  it('schema.org URL 을 내부 어휘로 옮긴다', () => {
    expect(parseAvailability('https://schema.org/InStock')).toBe('in_stock');
    expect(parseAvailability('https://schema.org/OutOfStock')).toBe('out_of_stock');
    expect(parseAvailability('https://schema.org/LimitedAvailability')).toBe('low_stock');
    expect(parseAvailability('https://schema.org/Discontinued')).toBe('discontinued');
  });

  it('예약/백오더는 임박으로 다룬다 — 즉시 매입이 불가능하기 때문이다', () => {
    expect(parseAvailability('https://schema.org/PreOrder')).toBe('low_stock');
    expect(parseAvailability('https://schema.org/BackOrder')).toBe('low_stock');
  });

  it('모르는 값은 unknown', () => {
    expect(parseAvailability(null)).toBe('unknown');
    expect(parseAvailability('weird')).toBe('unknown');
  });
});
