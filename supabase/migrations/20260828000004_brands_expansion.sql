-- =============================================================================
-- 취급 브랜드 확장: Polo Ralph Lauren · Tommy Hilfiger · Canada Goose · Nobis
--
-- 아직 매입하지 않았으므로 `active = false`로 넣는다. 스토어 목록은 열어 두되
-- 재고가 없는 상태를 그대로 노출한다 (DESIGN.md §12-8 — 모르는 것은 모른다고 쓴다).
--
-- `monitor_adapter`는 비워 둔다. 어댑터를 만들기 전에 값을 넣으면
-- 수집 워커가 존재하지 않는 어댑터를 찾는다.
-- 공식몰 URL은 캐나다(CA) 도메인 기준이다 (PROJECT.md §6).
-- =============================================================================

insert into brands (name, slug, official_site_url, monitor_adapter, active) values
  ('폴로 랄프로렌', 'polo',         'https://www.ralphlauren.ca',   null, false),
  ('타미 힐피거',   'tommy',        'https://ca.tommy.com',         null, false),
  ('캐나다구스',     'canada-goose', 'https://www.canadagoose.com/ca/en', null, false),
  ('노비스',        'nobis',        'https://ca.nobis.com',         null, false)
on conflict (slug) do nothing;
