'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, SelectField, TextAreaField } from '@/components/ui/field';
import { AlertLine } from '@/components/ui/states';
import { CUSTOMS_USD_KRW } from '@/lib/checkout';
import { estimateCustoms } from '@/lib/customs';
import { formatCad, formatKrw } from '@/lib/money';
import { DEFAULT_PRICING_CONFIG, computeNetMargin, computeSalePrice } from '@/lib/pricing';
import { quoteShipping } from '@/lib/shipping';
import { createProduct } from './actions';
import { INITIAL_STATE } from './state';

/**
 * 상품 등록 폼 (docs/wireframes/09-admin-products-new.md).
 *
 * 원가 → 판매가 → 배송비 → 예상 세액을 입력하는 동안 계속 다시 계산해서 보여준다.
 * 운영자가 저장하고 나서야 마진을 알게 되면 이미 늦다.
 *
 * **여기 보이는 원가·마진율·환율은 관리자 전용이다.** 같은 값을 고객 화면에
 * 옮기지 않는다 (PROJECT.md §3.1 — 고객에게는 통합 단일 원화가 하나뿐이다).
 */

const CATEGORY_OPTIONS = [
  { value: 'outerwear', label: '아우터' },
  { value: 'top', label: '상의' },
  { value: 'bottom', label: '하의' },
  { value: 'bag', label: '가방' },
  { value: 'wallet', label: '지갑' },
  { value: 'shoes', label: '신발' },
  { value: 'accessory', label: '악세서리' },
];

const GENDER_OPTIONS = [
  { value: 'unisex', label: '공용' },
  { value: 'men', label: '남성' },
  { value: 'women', label: '여성' },
];

const STOCK_OPTIONS = [
  { value: 'on_demand', label: '주문매입 — 주문 후 현지에서 매입해요' },
  { value: 'preheld', label: '선매입 — 이미 캘거리에 재고가 있어요' },
];

/** 0.28 × 100 = 28.000000000000004. 비율을 화면에 쓸 때는 반드시 통과시킨다. */
const pct = (rate: number) => String(Math.round(rate * 1000) / 10);

type Calc = {
  unitCostCad: string;
  cadKrwRate: string;
  marginPercent: string;
  krRetailKrw: string;
  weightG: string;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  category: string;
  originCountry: string;
  sizes: string;
  colors: string;
};

const INITIAL_CALC: Calc = {
  unitCostCad: '',
  cadKrwRate: '1000',
  marginPercent: pct(DEFAULT_PRICING_CONFIG.defaultMarginRate),
  krRetailKrw: '',
  weightG: '',
  lengthMm: '',
  widthMm: '',
  heightMm: '',
  category: 'outerwear',
  originCountry: '',
  sizes: '',
  colors: '',
};

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const countList = (raw: string) =>
  new Set(raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)).size;

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-outline pt-8">
      <h2 className="text-editorial font-bold text-ink">{title}</h2>
      {note && <p className="mt-1 text-meta text-muted-text">{note}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

/** 산출 결과 한 줄. 숫자 열은 tabular-nums 우측 정렬 (DESIGN.md §3) */
function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-outline py-2.5">
      <span className="text-meta text-muted-text">{label}</span>
      <span data-numeric className={strong ? 'text-editorial font-bold text-ink' : 'text-product text-ink'}>
        {value}
      </span>
    </div>
  );
}

export function ProductForm({ brands }: { brands: { value: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(createProduct, INITIAL_STATE);
  const [calc, setCalc] = useState<Calc>(INITIAL_CALC);

  const set = (key: keyof Calc) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCalc((prev) => ({ ...prev, [key]: e.target.value }));

  const err = (name: string) => state.fieldErrors?.[name];

  // ── 실시간 산출 ───────────────────────────────────────────────
  const cadCents = Math.round(num(calc.unitCostCad) * 100);
  const rate = num(calc.cadKrwRate);
  const priced = cadCents > 0 && rate > 0;

  const sale = computeSalePrice({
    unitCostCadCents: Math.max(cadCents, 0),
    cadKrwRate: Math.max(rate, 1),
    marginRate: num(calc.marginPercent) / 100,
  });

  const dims =
    num(calc.lengthMm) > 0 && num(calc.widthMm) > 0 && num(calc.heightMm) > 0
      ? { lengthMm: num(calc.lengthMm), widthMm: num(calc.widthMm), heightMm: num(calc.heightMm) }
      : undefined;
  const ship = quoteShipping(Math.max(num(calc.weightG), 0), dims);

  const customs = estimateCustoms({
    goodsValueKrw: sale.priceKrw,
    internationalShippingKrw: ship.shippingKrw,
    usdKrwRate: CUSTOMS_USD_KRW,
    category: calc.category,
    ckftaEligible: calc.originCountry.trim().toUpperCase() === 'CA',
  });

  const margin = computeNetMargin({
    priceKrw: sale.priceKrw,
    costKrw: sale.costKrw,
    shippingCostKrw: ship.shippingKrw,
    shippingChargedKrw: ship.shippingKrw,
  });

  const variantCount = countList(calc.sizes) * countList(calc.colors);
  const retail = num(calc.krRetailKrw);
  const gapRate = retail > sale.priceKrw ? 1 - sale.priceKrw / retail : 0;

  if (state.status === 'ok' && state.created) {
    const c = state.created;
    return (
      <div className="max-w-[var(--measure-prose)]">
        <h1 className="text-headline font-bold text-ink">등록했어요</h1>
        <dl className="mt-8 border-t border-outline">
          <Line label="상품명" value={c.name} />
          <Line label="옵션" value={`${c.variants}개`} />
          <Line label="상태" value={c.published ? '판매 중' : '임시저장 (비공개)'} />
        </dl>
        {!c.published && (
          <p className="mt-5 text-body text-muted-text">
            임시저장 상태예요. 고시 항목을 채우고 게시하면 스토어에 올라가요.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/admin/products/new" variant="inverted" size="md">
            계속 등록하기
          </ButtonLink>
          {c.published && (
            <ButtonLink href={`/products/${c.slug}`} size="md" chevron>
              상품 페이지 보기
            </ButtonLink>
          )}
          <ButtonLink href="/admin" size="md">
            대시보드로
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-16">
      <div className="flex min-w-0 flex-col gap-10">
        <div>
          <h1 className="text-headline font-bold text-ink">상품 등록</h1>
          <p className="mt-1 text-body text-muted-text">
            원가를 넣으면 판매가와 마진을 바로 계산해 드려요.
          </p>
        </div>

        {state.status === 'error' && state.message && (
          <p role="alert" className="border border-outline p-4 text-body text-error">
            {state.message}
          </p>
        )}

        <Section title="기본 정보">
          <Row>
            <SelectField label="브랜드" name="brandSlug" required options={brands} error={err('brandSlug')} />
            <SelectField
              label="카테고리"
              name="category"
              required
              options={CATEGORY_OPTIONS}
              value={calc.category}
              onChange={set('category')}
              error={err('category')}
            />
          </Row>
          <Row>
            <Field label="상품명 (한국어)" name="name" required placeholder="베타 LT 자켓" error={err('name')} />
            <Field label="상품명 (영문)" name="nameEn" placeholder="Beta LT Jacket" error={err('nameEn')} />
          </Row>
          <Row>
            <Field
              label="URL 주소"
              name="slug"
              required
              placeholder="beta-lt-jacket"
              hint="영소문자·숫자·하이픈만 써요. 등록 후에는 바꾸지 않는 편이 좋아요."
              error={err('slug')}
            />
            <SelectField label="성별" name="gender" options={GENDER_OPTIONS} error={err('gender')} />
          </Row>
          <SelectField
            label="판매 방식"
            name="stockType"
            options={STOCK_OPTIONS}
            hint="주문매입은 공급처 재고가 최근에 확인됐을 때만 결제가 열려요."
            error={err('stockType')}
          />
          <TextAreaField
            label="상품 설명"
            name="description"
            placeholder="어떤 상품이고 누구에게 맞는지 한두 문단으로 적어 주세요."
            error={err('description')}
          />
        </Section>

        <Section title="옵션" note="사이즈와 색상을 콤마로 구분해 적으면 조합만큼 옵션이 만들어져요.">
          <Row>
            <Field
              label="사이즈"
              name="sizes"
              required
              placeholder="XS, S, M, L, XL"
              value={calc.sizes}
              onChange={set('sizes')}
              error={err('sizes')}
            />
            <Field
              label="색상"
              name="colors"
              required
              placeholder="Black, Deep Cove"
              value={calc.colors}
              onChange={set('colors')}
              error={err('colors')}
            />
          </Row>
        </Section>

        <Section title="원가와 가격" note="이 값들은 관리자 전용이에요. 고객 화면에는 판매가 하나만 나가요.">
          <Row>
            <Field
              label="매입가 (CAD, 세전)"
              name="unitCostCad"
              type="number"
              step="0.01"
              required
              placeholder="450.00"
              hint={`알버타는 PST가 없어 GST ${pct(DEFAULT_PRICING_CONFIG.gstRate)}%만 붙어요.`}
              value={calc.unitCostCad}
              onChange={set('unitCostCad')}
              error={err('unitCostCad')}
            />
            <Field
              label="적용 환율 (CAD/KRW)"
              name="cadKrwRate"
              type="number"
              step="0.1"
              required
              hint={`환율 버퍼 ${pct(DEFAULT_PRICING_CONFIG.fxBufferRate)}%가 자동으로 더해져요.`}
              value={calc.cadKrwRate}
              onChange={set('cadKrwRate')}
              error={err('cadKrwRate')}
            />
          </Row>
          <Row>
            <Field
              label="마진율 (%)"
              name="marginPercent"
              type="number"
              step="1"
              required
              hint={`최소 ${pct(DEFAULT_PRICING_CONFIG.minMarginRate)}% 아래로 내려가면 경보가 떠요.`}
              value={calc.marginPercent}
              onChange={set('marginPercent')}
              error={err('marginPercent')}
            />
            <Field
              label="한국 정발가 (원)"
              name="krRetailKrw"
              type="number"
              step="1000"
              hint="확인된 경우에만 넣어요. 추정치를 넣지 않아요."
              value={calc.krRetailKrw}
              onChange={set('krRetailKrw')}
              error={err('krRetailKrw')}
            />
          </Row>
        </Section>

        <Section title="무게와 치수" note="운임은 실무게와 부피무게 중 무거운 값으로 계산돼요.">
          <Row>
            <Field
              label="실무게 (g)"
              name="weightG"
              type="number"
              required
              placeholder="650"
              value={calc.weightG}
              onChange={set('weightG')}
              error={err('weightG')}
            />
            <div className="grid grid-cols-3 gap-3">
              <Field label="가로 (mm)" name="lengthMm" type="number" value={calc.lengthMm} onChange={set('lengthMm')} />
              <Field label="세로 (mm)" name="widthMm" type="number" value={calc.widthMm} onChange={set('widthMm')} />
              <Field label="높이 (mm)" name="heightMm" type="number" value={calc.heightMm} onChange={set('heightMm')} />
            </div>
          </Row>
        </Section>

        <Section
          title="상품 정보 제공 고시"
          note="전자상거래법상 필수 항목이에요. 비어 있으면 임시저장만 되고 게시되지 않아요."
        >
          <Row>
            <Field
              label="원산지 (2자리 국가코드)"
              name="originCountry"
              placeholder="VN"
              hint="실물 라벨 기준이에요. 브랜드 국적으로 추정하지 않아요."
              value={calc.originCountry}
              onChange={set('originCountry')}
              error={err('originCountry')}
            />
            <Field label="HS 코드" name="hsCode" placeholder="6201.40" error={err('hsCode')} />
          </Row>
          <Row>
            <Field
              label="소재"
              name="material"
              placeholder="겉감 나일론 100% / 안감 폴리에스터 100%"
              hint="케어 라벨의 혼용률을 그대로 옮겨요."
              error={err('material')}
            />
            <Field label="제조자" name="manufacturer" placeholder="Arc'teryx Equipment" error={err('manufacturer')} />
          </Row>
          <Row>
            <Field label="취급 시 주의사항" name="care" placeholder="30도 이하 손세탁, 표백 금지" error={err('care')} />
            <Field
              label="A/S 책임자 및 연락처"
              name="asContact"
              placeholder="RICKY 고객센터 · help@example.com"
              error={err('asContact')}
            />
          </Row>
        </Section>

        <div className="flex flex-wrap gap-3 border-t border-outline pt-8">
          <Button type="submit" name="publish" value="active" variant="inverted" size="lg" disabled={pending}>
            {pending ? '저장 중' : '등록하고 게시'}
          </Button>
          <Button type="submit" name="publish" value="draft" variant="ghost" size="lg" disabled={pending}>
            임시저장
          </Button>
          <Link href="/admin" className="flex min-h-11 items-center px-2 text-product text-muted-text hover:text-ink">
            취소
          </Link>
        </div>
      </div>

      {/* 산출 패널. 그림자 없이 보더와 여백으로만 분리한다 (DESIGN.md §6) */}
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="border border-outline p-6">
          <h2 className="text-label font-bold text-ink">산출 결과</h2>

          {!priced ? (
            <p className="mt-4 text-body text-muted-text">매입가와 환율을 넣으면 계산해 드려요.</p>
          ) : (
            <>
              <dl className="mt-4">
                <Line label="매입원가 (GST·핸들링 포함)" value={formatCad(sale.landedCostCadCents)} />
                <Line label="원화 원가 (환율 버퍼 포함)" value={formatKrw(sale.costKrw)} />
                <Line label="판매가" value={formatKrw(sale.priceKrw)} strong />
                {retail > sale.priceKrw && (
                  <Line label="정발가 대비" value={`${Math.round(gapRate * 100)}% 저렴`} />
                )}
              </dl>

              <h3 className="mt-8 text-label font-bold text-ink">배송</h3>
              <dl className="mt-2">
                <Line label="적용 무게" value={`${ship.chargeableWeightG.toLocaleString('ko-KR')}g`} />
                <Line label="배송비" value={formatKrw(ship.shippingKrw)} />
                {ship.oversize && <Line label="대형 화물" value="할증 대상" />}
              </dl>

              <h3 className="mt-8 text-label font-bold text-ink">고객 부담 예상 세액</h3>
              <dl className="mt-2">
                <Line
                  label={customs.dutyFree ? '목록통관 (면세)' : '과세 예상'}
                  value={customs.dutyFree ? '0원' : formatKrw(customs.totalTaxKrw)}
                />
                {!customs.dutyFree && customs.ckftaApplied && (
                  <Line label="CKFTA 관세 0%" value="부가세는 부과" />
                )}
              </dl>

              <h3 className="mt-8 text-label font-bold text-ink">순마진</h3>
              <dl className="mt-2">
                <Line label="Stripe 수수료" value={formatKrw(margin.stripeFeeKrw)} />
                <Line label="순이익" value={formatKrw(margin.netProfitKrw)} strong />
                <Line label="순마진율" value={`${(margin.netMarginRate * 100).toFixed(1)}%`} />
              </dl>

              {margin.belowMinMargin && (
                <div className="mt-4">
                  <AlertLine
                    message="최소 마진율 미달"
                    detail={`기준 ${pct(DEFAULT_PRICING_CONFIG.minMarginRate)}%`}
                  />
                </div>
              )}

              <p className="mt-6 text-meta leading-relaxed text-muted-text">
                옵션 {variantCount || 0}개가 만들어져요. 세액은 관세청 고시환율{' '}
                <span data-numeric>{CUSTOMS_USD_KRW.toLocaleString('ko-KR')}</span>원 기준 예상치예요.
              </p>
            </>
          )}
        </div>
      </aside>
    </form>
  );
}
