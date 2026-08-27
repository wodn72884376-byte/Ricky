/**
 * 브랜드 어댑터 인터페이스 (PROJECT.md §6.3 2번).
 * 신규 브랜드는 이 인터페이스만 구현하면 파이프라인에 붙는다.
 */
import type { BrandKey, Listing, Region } from '../core/types.ts';

export type DiscoverOptions = {
  /** 최대 수집 상품 수 */
  limit: number;
  /** true 면 사이트맵 lastmod 가 최근인 것만 남긴다 */
  newOnly?: boolean;
  fresh?: boolean;
};

export type BrandAdapter = {
  brand: BrandKey;

  /**
   * 카탈로그에서 상품 URL 목록을 발견한다.
   * 사이트맵이 1순위, 카테고리 페이지 렌더링이 대안이다.
   */
  discover(region: Region, opts: DiscoverOptions): Promise<Array<{ url: string; lastModified: string | null }>>;

  /**
   * 상품 상세 1건을 수집한다.
   * 통화가 지역 통화와 다르면 null 을 돌려준다 (PROJECT.md §6.3 4번).
   */
  fetchListing(url: string, region: Region, opts?: { fresh?: boolean; lastModified?: string | null }): Promise<Listing | null>;

  /** 한국 공식몰에서 이름으로 상품을 찾는다. 지원하지 않으면 null. */
  searchKr?(query: string, opts?: { fresh?: boolean }): Promise<Listing | null>;
};
