import { describe, expect, it } from 'vitest';
import { __test__, byNewest, isRecent } from '../extract/sitemap.ts';

const { parseEntries, isIndex } = __test__;

describe('parseEntries', () => {
  it('urlset 에서 loc 와 lastmod 를 짝지어 읽는다', () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://a.com/1</loc><lastmod>2026-03-28</lastmod></url>
      <url><loc>https://a.com/2</loc></url>
    </urlset>`;
    expect(parseEntries(xml)).toEqual([
      { url: 'https://a.com/1', lastModified: '2026-03-28' },
      { url: 'https://a.com/2', lastModified: null },
    ]);
  });

  it('sitemapindex 도 같은 방식으로 읽는다', () => {
    const xml = `<sitemapindex><sitemap><loc>https://a.com/s1.xml</loc>
      <lastmod>2026-08-25</lastmod></sitemap></sitemapindex>`;
    expect(parseEntries(xml)[0]).toEqual({
      url: 'https://a.com/s1.xml',
      lastModified: '2026-08-25',
    });
  });

  it('XML 엔티티를 복원한다 — 쿼리스트링이 있는 URL 이 깨지면 안 된다', () => {
    const xml = `<urlset><url><loc>https://a.com/p?x=1&amp;y=2</loc></url></urlset>`;
    expect(parseEntries(xml)[0]?.url).toBe('https://a.com/p?x=1&y=2');
  });

  it('래퍼 없이 loc 만 있는 변형도 처리한다', () => {
    expect(parseEntries('<loc>https://a.com/1</loc>')).toHaveLength(1);
  });
});

describe('isIndex', () => {
  it('sitemapindex 를 구분한다', () => {
    expect(isIndex('<sitemapindex></sitemapindex>')).toBe(true);
    expect(isIndex('<urlset></urlset>')).toBe(false);
  });
});

describe('isRecent', () => {
  const now = Date.parse('2026-08-26T00:00:00Z');

  it('기간 내면 true', () => {
    expect(isRecent('2026-07-01', 120, now)).toBe(true);
  });

  it('기간을 벗어나면 false', () => {
    expect(isRecent('2025-01-01', 120, now)).toBe(false);
  });

  it('미래 날짜는 신제품으로 인정하지 않는다 — 잘못된 lastmod 방어', () => {
    expect(isRecent('2027-01-01', 120, now)).toBe(false);
  });

  it('lastmod 가 없거나 파싱 불가면 false', () => {
    expect(isRecent(null, 120, now)).toBe(false);
    expect(isRecent('없음', 120, now)).toBe(false);
  });
});

describe('byNewest', () => {
  it('최신순 정렬하고 lastmod 없는 항목을 뒤로 보낸다', () => {
    const entries = [
      { url: 'a', lastModified: null },
      { url: 'b', lastModified: '2026-01-01' },
      { url: 'c', lastModified: '2026-08-01' },
    ];
    expect([...entries].sort(byNewest).map((e) => e.url)).toEqual(['c', 'b', 'a']);
  });
});
