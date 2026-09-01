import { describe, expect, it } from 'vitest';
import { parseArgs } from '../cli.ts';

describe('parseArgs — 카탈로그가 기본', () => {
  /*
   * 실측 사고(2026-08-29): `npm run stock:all` 이 카탈로그를 무시하고 브랜드별
   * 사이트맵에서 25건씩 긁어 와, 리포트가 Cerium Jacket · Proton Heavyweight Hoody 같은
   * **등록하지 않은 상품**으로 채워지고 정작 등록 상품 24건은 조회되지 않았다.
   * 우리가 파는 건 카탈로그에 있는 것뿐이므로 그게 기본이어야 한다.
   */
  it('아무 플래그 없이도 등록 상품만 조회한다', () => {
    expect(parseArgs(['stock']).catalog).toBe(true);
    expect(parseArgs(['stock', '--all']).catalog).toBe(true);
    expect(parseArgs(['stock', '--import']).catalog).toBe(true);
  });

  it('--no-catalog 로만 사이트맵 탐색으로 넘어간다', () => {
    expect(parseArgs(['stock', '--all', '--no-catalog']).catalog).toBe(false);
    expect(parseArgs(['stock', '--catalog=false']).catalog).toBe(false);
  });

  it('--catalog 를 명시해도 그대로 켬이다', () => {
    expect(parseArgs(['stock', '--catalog']).catalog).toBe(true);
  });
});
