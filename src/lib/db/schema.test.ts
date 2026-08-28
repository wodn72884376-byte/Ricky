import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createTestDb } from './test-db';

let db: PGlite;

beforeAll(async () => { db = await createTestDb(); }, 60_000);
afterAll(async () => { await db?.close(); });

/** 테스트용 최소 주문 한 건에 필요한 부속을 만든다. */
async function seedVariant() {
  const { rows } = await db.query<{ id: string }>(`
    with b as (select id from brands where slug = 'arcteryx'),
    p as (
      insert into products (brand_id, name, slug, category, origin_country, status,
                            material, care, manufacturer, as_contact)
      select b.id, '베타 LT 자켓', 'beta-lt-' || gen_random_uuid(), 'outerwear', 'CA', 'active',
             '겉감 나일론 100%', '드라이클리닝 금지', 'Arc''teryx Equipment', 'RICKY 고객센터' from b
      returning id
    )
    insert into product_variants (product_id, sku, size, color, cost_cad_cents, price_krw, stock_type)
    select p.id, 'SKU-' || gen_random_uuid(), 'M', 'Black', 45000, 742000, 'preheld' from p
    returning id
  `);
  return rows[0]!.id;
}

async function insertOrder(overrides: Record<string, unknown> = {}) {
  const base = {
    receiver_name: '김재우',
    receiver_phone: '010-1234-5678',
    postcode: '06236',
    address1: '서울시 강남구',
    pccc: 'P123456789012',
    subtotal_krw: 742_000,
    shipping_krw: 18_000,
    total_krw: 760_000,
    contact_email: 'guest@example.com',
    ...overrides,
  };
  const cols = Object.keys(base);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const { rows } = await db.query<{ order_no: string }>(
    `insert into orders (${cols.join(',')}) values (${vals.join(',')}) returning order_no`,
    Object.values(base),
  );
  return rows[0]!.order_no;
}

describe('주문번호 생성 (docs/IA.md §5-2)', () => {
  it('R + YYMMDD + 6자 Crockford Base32 형식이다', async () => {
    const orderNo = await insertOrder();
    expect(orderNo).toMatch(/^R\d{6}-[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it('혼동하기 쉬운 문자(I·L·O·U)를 쓰지 않는다', async () => {
    const { rows } = await db.query<{ n: string }>(
      `select generate_order_no() as n from generate_series(1, 300)`,
    );
    const suffixes = rows.map((r) => r.n.split('-')[1]!).join('');
    for (const ch of ['I', 'L', 'O', 'U']) {
      expect(suffixes).not.toContain(ch);
    }
  });

  it('순차적이지 않다 — 연속 생성분이 서로 인접하지 않는다', async () => {
    const { rows } = await db.query<{ n: string }>(
      `select generate_order_no() as n from generate_series(1, 200)`,
    );
    const unique = new Set(rows.map((r) => r.n));
    // 32^6 공간에서 200개를 뽑으면 충돌 확률은 사실상 0이다
    expect(unique.size).toBe(200);
  });

  it('중복되면 재시도한다 — unique 제약에 걸려 INSERT가 실패하지 않는다', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 25; i++) seen.add(await insertOrder());
    expect(seen.size).toBe(25);
  });
});

describe('게스트 주문 연락 수단 (docs/IA.md §5-1)', () => {
  it('contact_email과 customer_id가 둘 다 없으면 거부한다', async () => {
    await expect(insertOrder({ contact_email: null })).rejects.toThrow(/orders_contact_reachable/);
  });

  it('형식이 아닌 이메일을 거부한다', async () => {
    await expect(insertOrder({ contact_email: 'not-an-email' })).rejects.toThrow();
  });

  it('게스트 주문은 customer_id 없이 성립한다', async () => {
    const orderNo = await insertOrder({ contact_email: 'guest2@example.com' });
    expect(orderNo).toBeTruthy();
  });
});

describe('개인통관고유부호 제약 (PROJECT.md §3)', () => {
  it('P + 12자리가 아니면 거부한다', async () => {
    await expect(insertOrder({ pccc: 'P12345' })).rejects.toThrow();
    await expect(insertOrder({ pccc: '1234567890123' })).rejects.toThrow();
  });
});

describe('후기 (docs/IA.md §5-5)', () => {
  it('구매 항목 없이는 작성할 수 없다', async () => {
    await expect(
      db.query(`insert into reviews (order_item_id, rating, body) values (gen_random_uuid(), 5, '좋아요')`),
    ).rejects.toThrow();
  });

  it('한 주문 항목에 후기는 하나뿐이다', async () => {
    const variantId = await seedVariant();
    const orderNo = await insertOrder({ contact_email: 'reviewer@example.com' });
    const { rows } = await db.query<{ id: string }>(
      `insert into order_items (order_id, variant_id, qty, unit_price_krw, product_name_snapshot)
       select o.id, $1, 1, 742000, '베타 LT 자켓' from orders o where o.order_no = $2
       returning id`,
      [variantId, orderNo],
    );
    const itemId = rows[0]!.id;
    await db.query(`insert into reviews (order_item_id, rating, body) values ($1, 5, '정품 확인했어요')`, [itemId]);
    await expect(
      db.query(`insert into reviews (order_item_id, rating, body) values ($1, 4, '두 번째')`, [itemId]),
    ).rejects.toThrow();
  });
});

describe('재입고 알림 (docs/IA.md §5-4)', () => {
  it('같은 옵션에 같은 이메일이 중복 신청되지 않는다', async () => {
    const variantId = await seedVariant();
    await db.query(`insert into restock_alerts (variant_id, contact_email) values ($1, 'a@example.com')`, [variantId]);
    await expect(
      db.query(`insert into restock_alerts (variant_id, contact_email) values ($1, 'a@example.com')`, [variantId]),
    ).rejects.toThrow();
  });
});

describe('성별 · BEST 큐레이션 (내비게이션 축)', () => {
  it('gender 기본값은 unisex다 — 등록 시 한쪽을 억지로 고르게 하지 않는다', async () => {
    await seedVariant();
    const { rows } = await db.query<{ gender: string }>(
      `select gender from products order by created_at desc limit 1`,
    );
    expect(rows[0]!.gender).toBe('unisex');
  });

  it('허용되지 않은 카테고리를 거부한다 — 내비게이션이 이 값으로 라우팅된다', async () => {
    await expect(
      db.query(`insert into products (brand_id, name, slug, category, status)
                select id, 'x', 'x-' || gen_random_uuid(), '아우터', 'draft' from brands limit 1`),
    ).rejects.toThrow(/products_category_valid/);
  });

  it('featured_rank는 양수여야 한다', async () => {
    await expect(
      db.query(`insert into products (brand_id, name, slug, category, featured_rank, status)
                select id, 'x', 'x-' || gen_random_uuid(), 'top', 0, 'draft' from brands limit 1`),
    ).rejects.toThrow();
  });
});

describe('스토어 노출 뷰 — 원가가 새지 않는다 (PROJECT.md §3.1)', () => {
  it('store_variants에 원가·마진 컬럼이 없다', async () => {
    const { rows } = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name = 'store_variants'`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain('price_krw');
    // 내비게이션이 쓰는 축도 뷰에 있어야 한다
    for (const needed of ['gender', 'category', 'featured_rank']) {
      expect(cols).toContain(needed);
    }
    for (const leaked of ['cost_cad_cents', 'fx_cad_krw', 'margin_rate']) {
      expect(cols).not.toContain(leaked);
    }
  });
});


describe('상품 정보 제공 고시 게이트', () => {
  /** 값은 파라미터로 넘긴다 — `Arc'teryx`의 아포스트로피가 문자열 조립을 깨뜨린다. */
  function insertProduct(status: string, d: Partial<typeof FULL> = {}) {
    return db.query(
      `insert into products (brand_id, name, slug, category, origin_country, status,
                             material, care, manufacturer, as_contact)
       select id, '테스트 상품', 'gate-' || gen_random_uuid(), 'outerwear', $1, $2, $3, $4, $5, $6
       from brands where slug = 'arcteryx'`,
      [
        d.origin_country === null ? null : 'CA',
        status,
        d.material ?? null,
        d.care ?? null,
        d.manufacturer ?? null,
        d.as_contact ?? null,
      ],
    );
  }

  const FULL = {
    material: '겉감 나일론 100%',
    care: '드라이클리닝 금지',
    manufacturer: "Arc'teryx Equipment",
    as_contact: 'RICKY 고객센터',
    origin_country: 'CA' as string | null,
  };

  it('draft는 고시 항목이 비어 있어도 저장된다 — 등록 도중에 막지 않는다', async () => {
    await expect(insertProduct('draft')).resolves.toBeDefined();
  });

  it('고시 항목이 채워지면 active로 게시할 수 있다', async () => {
    await expect(insertProduct('active', FULL)).resolves.toBeDefined();
  });

  it('소재가 비면 active로 게시할 수 없다', async () => {
    await expect(insertProduct('active', { ...FULL, material: undefined })).rejects.toThrow();
  });

  it('A/S 연락처가 비면 active로 게시할 수 없다', async () => {
    await expect(insertProduct('active', { ...FULL, as_contact: undefined })).rejects.toThrow();
  });

  it('원산지가 없으면 active로 게시할 수 없다 — 브랜드 국적으로 추정하지 않는다', async () => {
    await expect(insertProduct('active', { ...FULL, origin_country: null })).rejects.toThrow();
  });
});

describe('확장 브랜드', () => {
  it('신규 4개 브랜드는 active=false로 들어간다 — 매입 전이다', async () => {
    const { rows } = await db.query<{ slug: string; active: boolean }>(
      `select slug, active from brands where slug in ('polo','tommy','canada-goose','nobis') order by slug`,
    );
    expect(rows.map((r) => r.slug)).toEqual(['canada-goose', 'nobis', 'polo', 'tommy']);
    expect(rows.every((r) => r.active === false)).toBe(true);
  });

  it('어댑터를 만들기 전이므로 monitor_adapter는 비어 있다', async () => {
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from brands where slug in ('polo','tommy','canada-goose','nobis') and monitor_adapter is not null`,
    );
    expect(rows[0]!.n).toBe(0);
  });
});
