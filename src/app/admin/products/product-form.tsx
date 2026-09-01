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
import { INITIAL_STATE, STATUS_LABEL, type FormState } from './state';

/**
 * 상품 등록·수정 폼 (docs/wireframes/09-admin-products-new.md).
 *
 * 원가 → 판매가 → 배송비 → 예상 세액을 입력하는 동안 계속 다시 계산해서 보여준다.
 * 운영자가 저장하고 나서야 마진을 알게 되면 이미 늦다.
 *
 * **여기 보이는 원가·마진율·환율은 관리자 전용이다.** 같은 값을 고객 화면에
 * 옮기지 않는다 (PROJECT.md §3.1 — 고객에게는 통합 단일 원화가 하나뿐이다).
 *
 * 등록과 수정이 같은 컴포넌트를 쓴다. 두 벌로 두면 한쪽에만 필드를 더하게 되고,
 * 그러면 등록은 되는데 고칠 수 없는 항목이 생긴다.
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
  { value: 'kids', label: '아동' },
  { value: 'men', label: '남성' },
  { value: 'women', label: '여성' },
];

const STOCK_OPTIONS = [
  { value: 'on_demand', label: '주문매입 — 주문 후 현지에서 매입해요' },
  { value: 'preheld', label: '선매입 — 이미 캘거리에 재고가 있어요' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '판매 중 — 스토어에 보여요' },
  { value: 'draft', label: '임시저장 — 비공개예요' },
  { value: 'paused', label: '일시중지 — 잠깐 내려요' },
  { value: 'archived', label: '보관 — 목록에서 접어 둬요' },
];

/** 0.28 × 100 = 28.000000000000004. 비율을 화면에 쓸 때는 반드시 통과시킨다. */
const pct = (rate: number) => String(Math.round(rate * 1000) / 10);

/** 폼이 다루는 값은 전부 문자열이다 — `''`와 `0`을 구분해야 하기 때문이다. */
export type FormDefaults = {
  brandSlug: string;
  name: string;
  nameEn: string;
  slug: string;
  category: string;
  gender: string;
  stockType: string;
  description: string;
  featuredRank: string;
  unitCostCad: string;
  cadKrwRate: string;
  marginPercent: string;
  krRetailKrw: string;
  shippingKrw: string;
  smartstoreUrl: string;
  weightG: string;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  originCountry: string;
  hsCode: string;
  material: string;
  care: string;
  manufacturer: string;
  asContact: string;
  sizes: string;
  colors: string;
  publish: string;
};

export const EMPTY_DEFAULTS: FormDefaults = {
  brandSlug: '',
  name: '',
  nameEn: '',
  slug: '',
  category: 'outerwear',
  gender: 'unisex',
  stockType: 'on_demand',
  description: '',
  featuredRank: '',
  unitCostCad: '',
  cadKrwRate: '1000',
  marginPercent: pct(DEFAULT_PRICING_CONFIG.defaultMarginRate),
  krRetailKrw: '',
  shippingKrw: '',
  smartstoreUrl: '',
  weightG: '',
  lengthMm: '',
  widthMm: '',
  heightMm: '',
  originCountry: '',
  hsCode: '',
  material: '',
  care: '',
  manufacturer: '',
  asContact: '',
  sizes: '',
  colors: '',
  publish: 'draft',
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

export function ProductForm({
  mode,
  brands,
  action,
  defaults = EMPTY_DEFAULTS,
  current,
}: {
  mode: 'create' | 'edit';
  brands: { value: string; label: string }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: FormDefaults;
  /** 수정 화면에서만. 지금 저장돼 있는 값 — 폼이 되돌릴 수 없는 것들을 대신 보여준다 */
  current?: { priceKrw: number; variantCount: number; slug: string };
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [calc, setCalc] = useState<FormDefaults>(defaults);
  const editing = mode === 'edit';

  const set = (key: keyof FormDefaults) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCalc((prev) => ({ ...prev, [key]: e.target.value }));

  const err = (name: string) => state.fieldErrors?.[name];

  // ── 실시간 산출 ───────────────────────────────────────────────
  const cadCents = Math.round(num(calc.unitCostCad) * 100);
  const rate = num(calc.cadKrwRate);
  const repricing = cadCents > 0 && rate > 0;

  const sale = computeSalePrice({
    unitCostCadCents: Math.max(cadCents, 0),
    cadKrwRate: Math.max(rate, 1),
    marginRate: num(calc.marginPercent) / 100,
  });

  // 수정 중에 원가를 비워 두면 판매가는 지금 값 그대로다 — 마진 계산도 그 값을 쓴다.
  const priceKrw = repricing ? sale.priceKrw : (current?.priceKrw ?? 0);

  const dims =
    num(calc.lengthMm) > 0 && num(calc.widthMm) > 0 && num(calc.heightMm) > 0
      ? { lengthMm: num(calc.lengthMm), widthMm: num(calc.widthMm), heightMm: num(calc.heightMm) }
      : undefined;
  const autoShip = quoteShipping(Math.max(num(calc.weightG), 0), dims);
  // 입력값이 있으면 그게 배송비다. 계산값은 참고용으로만 남는다.
  const shippingOverridden = calc.shippingKrw.trim() !== '';
  const ship = shippingOverridden
    ? { ...autoShip, shippingKrw: Math.max(num(calc.shippingKrw), 0) }
    : autoShip;

  const customs = estimateCustoms({
    goodsValueKrw: priceKrw,
    internationalShippingKrw: ship.shippingKrw,
    usdKrwRate: CUSTOMS_USD_KRW,
    category: calc.category,
    ckftaEligible: calc.originCountry.trim().toUpperCase() === 'CA',
  });

  const margin = computeNetMargin({
    priceKrw,
    costKrw: sale.costKrw,
    shippingCostKrw: ship.shippingKrw,
    shippingChargedKrw: ship.shippingKrw,
  });

  const variantCount = countList(calc.sizes) * countList(calc.colors);
  const retail = num(calc.krRetailKrw);
  const gapRate = retail > priceKrw && priceKrw > 0 ? 1 - priceKrw / retail : 0;

  if (state.status === 'ok' && state.saved) {
    const c = state.saved;
    return (
      <div className="max-w-[var(--measure-prose)]">
        <h1 className="text-headline font-bold text-ink">{editing ? '저장했어요' : '등록했어요'}</h1>
        <dl className="mt-8 border-t border-outline">
          <Line label="상품명" value={c.name} />
          <Line label="옵션" value={`${c.variants}개`} />
          <Line label="상태" value={STATUS_LABEL[c.status] ?? c.status} />
        </dl>
        {c.status !== 'active' && (
          <p className="mt-5 text-body text-muted-text">
            지금은 스토어에 보이지 않아요. 고시 항목과 스마트스토어 주소를 채우고 판매 중으로 바꾸면 올라가요.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/admin/products" variant="inverted" size="md">
            상품 목록
          </ButtonLink>
          {c.status === 'active' && (
            <ButtonLink href={`/products/${c.slug}`} size="md" chevron>
              상품 페이지 보기
            </ButtonLink>
          )}
          <ButtonLink href="/admin/products/new" size="md">
            새로 등록하기
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-16">
      <div className="flex min-w-0 flex-col gap-10">
        <div>
          <h1 className="text-headline font-bold text-ink">{editing ? '상품 수정' : '상품 등록'}</h1>
          <p className="mt-1 text-body text-muted-text">
            {editing
              ? '고친 값은 저장하는 즉시 스토어에 반영돼요.'
              : '원가를 넣으면 판매가와 마진을 바로 계산해 드려요.'}
          </p>
        </div>

        {state.status === 'error' && state.message && (
          <p role="alert" className="border border-outline p-4 text-body text-error">
            {state.message}
          </p>
        )}

        <Section title="기본 정보">
          <Row>
            <SelectField
              label="브랜드"
              name="brandSlug"
              required
              options={brands}
              defaultValue={defaults.brandSlug || undefined}
              error={err('brandSlug')}
            />
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
            <Field
              label="상품명 (한국어)"
              name="name"
              required
              placeholder="베타 LT 자켓"
              defaultValue={defaults.name}
              error={err('name')}
            />
            <Field
              label="상품명 (영문)"
              name="nameEn"
              placeholder="Beta LT Jacket"
              defaultValue={defaults.nameEn}
              error={err('nameEn')}
            />
          </Row>
          <Row>
            <Field
              label="URL 주소"
              name="slug"
              required
              placeholder="beta-lt-jacket"
              hint={
                editing
                  ? '바꾸면 예전 주소가 끊겨요. 이미 공유된 링크가 있다면 그대로 두는 편이 좋아요.'
                  : '영소문자·숫자·하이픈만 써요. 등록 후에는 바꾸지 않는 편이 좋아요.'
              }
              defaultValue={defaults.slug}
              error={err('slug')}
            />
            <SelectField
              label="성별"
              name="gender"
              options={GENDER_OPTIONS}
              defaultValue={defaults.gender}
              error={err('gender')}
            />
          </Row>
          <Row>
            <SelectField
              label="판매 방식"
              name="stockType"
              options={STOCK_OPTIONS}
              defaultValue={defaults.stockType}
              hint="주문매입은 공급처 재고가 최근에 확인됐을 때만 결제가 열려요."
              error={err('stockType')}
            />
            <Field
              label="BEST 노출 순서"
              name="featuredRank"
              type="number"
              min={0}
              placeholder="1"
              hint="비워 두면 BEST에 넣지 않아요. 숫자가 작을수록 앞에 나와요."
              defaultValue={defaults.featuredRank}
              error={err('featuredRank')}
            />
          </Row>
          <TextAreaField
            label="상품 설명"
            name="description"
            placeholder="어떤 상품이고 누구에게 맞는지 한두 문단으로 적어 주세요."
            defaultValue={defaults.description}
            error={err('description')}
          />
        </Section>

        <Section
          title="옵션"
          note={
            editing
              ? '목록에서 지운 조합은 판매를 멈추고 숨겨요. 이미 주문에 쓰인 기록이 있어 삭제하지는 않아요.'
              : '사이즈와 색상을 콤마로 구분해 적으면 조합만큼 옵션이 만들어져요.'
          }
        >
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

        <Section
          title="원가와 가격"
          note={
            editing
              ? '환율과 마진율은 저장하지 않아서 되돌려 놓을 수가 없어요. 비워 두면 지금 판매가를 그대로 둬요.'
              : '이 값들은 관리자 전용이에요. 고객 화면에는 판매가 하나만 나가요.'
          }
        >
          {editing && current && (
            <p className="text-body text-muted-text">
              지금 판매가는 <span data-numeric className="font-bold text-ink">{formatKrw(current.priceKrw)}</span>
              이에요. 아래 셋을 모두 채우면 다시 계산해서 옵션 {current.variantCount}개에 같이 적용해요.
            </p>
          )}
          <Row>
            <Field
              label="매입가 (CAD, 세전)"
              name="unitCostCad"
              type="number"
              step="0.01"
              required={!editing}
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
              required={!editing}
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
              required={!editing}
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

        <Section title="무게와 치수" note="무게와 치수는 실제 포장 기준으로 넣어요. 통관 신고와 마진 계산에 쓰여요.">
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
          title="배송비"
          note="이 상품 한 점을 보낼 때 고객에게 청구할 금액이에요. 상품 상세에 그대로 표시돼요."
        >
          <Row>
            <Field
              label="배송비 (원)"
              name="shippingKrw"
              type="number"
              placeholder={String(autoShip.shippingKrw)}
              hint={
                shippingOverridden
                  ? `무게 기준 계산값은 ${formatKrw(autoShip.shippingKrw)}예요.`
                  : `비워 두면 무게 기준 계산값 ${formatKrw(autoShip.shippingKrw)}을 써요. 0을 넣으면 무료배송이에요.`
              }
              value={calc.shippingKrw}
              onChange={set('shippingKrw')}
              error={err('shippingKrw')}
            />
            <div />
          </Row>
        </Section>

        <Section
          title="구매 경로"
          note="결제는 스마트스토어에서 일어나요. 이 주소가 없으면 살 수 있는 경로가 없어서 게시되지 않아요."
        >
          <Row>
            <Field
              label="스마트스토어 상품 주소"
              name="smartstoreUrl"
              type="url"
              placeholder="https://smartstore.naver.com/ricky/products/1234567890"
              hint="상품 상세 페이지 주소예요. 스토어 첫 화면이 아니라 이 상품 페이지여야 해요."
              value={calc.smartstoreUrl}
              onChange={set('smartstoreUrl')}
              error={err('smartstoreUrl')}
            />
            <div />
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
            <Field label="HS 코드" name="hsCode" placeholder="6201.40" defaultValue={defaults.hsCode} error={err('hsCode')} />
          </Row>
          <Row>
            <Field
              label="소재"
              name="material"
              placeholder="겉감 나일론 100% / 안감 폴리에스터 100%"
              hint="케어 라벨의 혼용률을 그대로 옮겨요."
              defaultValue={defaults.material}
              error={err('material')}
            />
            <Field
              label="제조자"
              name="manufacturer"
              placeholder="Arc'teryx Equipment"
              defaultValue={defaults.manufacturer}
              error={err('manufacturer')}
            />
          </Row>
          <Row>
            <Field
              label="취급 시 주의사항"
              name="care"
              placeholder="30도 이하 손세탁, 표백 금지"
              defaultValue={defaults.care}
              error={err('care')}
            />
            <Field
              label="A/S 책임자 및 연락처"
              name="asContact"
              placeholder="RICKY 고객센터 · help@example.com"
              defaultValue={defaults.asContact}
              error={err('asContact')}
            />
          </Row>
        </Section>

        {editing ? (
          <Section title="상태" note="보관은 삭제가 아니에요. 주문 기록이 걸려 있어 상품을 지우지는 않아요.">
            <Row>
              <SelectField
                label="판매 상태"
                name="publish"
                options={STATUS_OPTIONS}
                defaultValue={defaults.publish}
                error={err('publish')}
              />
              <div />
            </Row>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" variant="inverted" size="lg" disabled={pending}>
                {pending ? '저장 중' : '저장'}
              </Button>
              {current && (
                <ButtonLink href={`/products/${current.slug}`} size="lg" chevron>
                  스토어에서 보기
                </ButtonLink>
              )}
              <Link
                href="/admin/products"
                className="flex min-h-11 items-center px-2 text-product text-muted-text hover:text-ink"
              >
                취소
              </Link>
            </div>
          </Section>
        ) : (
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
        )}
      </div>

      {/* 산출 패널. 그림자 없이 보더와 여백으로만 분리한다 (DESIGN.md §6) */}
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="border border-outline p-6">
          <h2 className="text-label font-bold text-ink">산출 결과</h2>

          {priceKrw <= 0 ? (
            <p className="mt-4 text-body text-muted-text">매입가와 환율을 넣으면 계산해 드려요.</p>
          ) : (
            <>
              <dl className="mt-4">
                {repricing ? (
                  <>
                    <Line label="매입원가 (GST·핸들링 포함)" value={formatCad(sale.landedCostCadCents)} />
                    <Line label="원화 원가 (환율 버퍼 포함)" value={formatKrw(sale.costKrw)} />
                  </>
                ) : (
                  <Line label="원가" value="입력 안 함" />
                )}
                <Line label={repricing && editing ? '새 판매가' : '판매가'} value={formatKrw(priceKrw)} strong />
                {retail > priceKrw && <Line label="정발가 대비" value={`${Math.round(gapRate * 100)}% 저렴`} />}
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
                {!customs.dutyFree && customs.ckftaApplied && <Line label="CKFTA 관세 0%" value="부가세는 부과" />}
              </dl>

              {repricing && (
                <>
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
                </>
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
