-- =============================================================================
-- 기본 설정 및 브랜드 시드
-- =============================================================================

insert into settings (key, value) values
  -- 판매가 산출 (PROJECT.md §5)
  ('pricing', jsonb_build_object(
      'default_margin_rate', 0.28,        -- 기본 마진율
      'min_margin_rate',     0.12,        -- 이 밑으로 떨어지면 판매 일시중지 + 승인 요청
      'fx_buffer_rate',      0.02,        -- 환율 변동 버퍼
      'stripe_fee_rate',     0.029,       -- Stripe 카드 수수료
      'stripe_fee_fixed_krw', 400,
      'stripe_fx_fee_rate',  0.02,        -- KRW 결제 → CAD 정산 환전 수수료
      'gst_rate',            0.05,        -- 알버타: GST 5%만 (PST 없음)
      'handling_fee_cad_cents', 600,      -- 배대지 검수/재포장 건당 약 $6
      'round_to_krw',        100          -- 판매가 100원 단위 올림
  )),

  -- 통관 (PROJECT.md §3.2)
  ('customs', jsonb_build_object(
      'duty_free_threshold_usd', 150,     -- 캐나다발 목록통관 면세 한도 (미국은 200)
      'vat_rate',               0.10,
      'default_duty_rate',      0.13,     -- 의류 통상 13%
      'duty_rates', jsonb_build_object(
          'outerwear', 0.13,
          'top',       0.13,
          'bottom',    0.13,
          'bag',       0.08,
          'shoes',     0.13,
          'accessory', 0.08
      )
  )),

  -- 공급처 재고 신선도 게이트 (PROJECT.md §6.5)
  ('stock_freshness', jsonb_build_object('hours', 6)),

  -- 폴링 주기 (분) (PROJECT.md §6.4)
  ('monitor', jsonb_build_object(
      'interval_minutes', jsonb_build_object('hot', 20, 'normal', 360, 'cold', 1440),
      'max_concurrency',       2,
      'min_delay_ms',       3000,         -- 정중한 크롤링: 요청 간 최소 지연
      'max_fail_before_alert', 3
  )),

  -- 국제 배송 (PROJECT.md §3.5)
  ('shipping', jsonb_build_object(
      'volumetric_divisor',   6000,       -- 부피무게 = L×W×H(cm) / 6000
      'oversize_max_side_mm', 1000,       -- 최장변 1m 초과 시 할증
      'oversize_fee_krw',    30000,
      'rate_per_500g_krw',    4500,
      'base_fee_krw',         5000,
      'lead_time_business_days', jsonb_build_object('min', 4, 'max', 10)
  ))
on conflict (key) do nothing;

insert into brands (name, slug, official_site_url, monitor_adapter) values
  ('아크테릭스', 'arcteryx',   'https://arcteryx.com/ca/en',        'arcteryx'),
  ('룰루레몬',   'lululemon',  'https://shop.lululemon.com/en-ca',  'lululemon'),
  ('코치',       'coach',      'https://canada.coach.com',          'coach')
on conflict (slug) do nothing;
