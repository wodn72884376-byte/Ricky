/**
 * 마크다운 리포트.
 *
 * 이 리포트는 "무엇을 매입할지" 판단하는 문서다. 따라서 결론(소싱 후보 순위)이 맨 위,
 * 근거(인기 신호·가격 비교)가 그다음, 수집 품질(실패·미매칭)이 마지막에 온다.
 */
import { BRANDS } from '../config/brands.ts';
import type { BrandRunResult, ComparisonRow } from '../core/types.ts';
import type { FxSnapshot } from '../fx/rates.ts';
import type { BrandSignals } from '../signals/collect.ts';

const krw = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `₩${n.toLocaleString('ko-KR')}`;

const cad = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? '—' : `CA$${(cents / 100).toFixed(2)}`;

const pct = (r: number | null | undefined, digits = 1) =>
  r === null || r === undefined ? '—' : `${(r * 100).toFixed(digits)}%`;

const avail: Record<string, string> = {
  in_stock: '재고',
  low_stock: '임박',
  out_of_stock: '품절',
  discontinued: '단종',
  unknown: '미확인',
};

/** 소싱 매력도 = 절감률이 크고 인기도가 높고 재고가 있는 것 */
export function sourcingScore(r: ComparisonRow): number {
  if (r.savingRate === null || r.savingRate <= 0) return 0;
  const pop = (r.popularity?.score ?? 0) / 100;
  const stock = r.caAvailability === 'in_stock' ? 1 : r.caAvailability === 'low_stock' ? 0.6 : 0.1;
  // 절감률은 0.4(40%)에서 포화시킨다. 그 이상은 대개 매칭 오류다.
  const saving = Math.min(1, r.savingRate / 0.4);
  return Math.round((saving * 0.5 + pop * 0.3 + stock * 0.2) * 1000) / 10;
}

export function renderReport(
  results: BrandRunResult[],
  signalsByBrand: Map<string, BrandSignals>,
  fx: FxSnapshot,
  meta: { startedAt: string; durationMs: number; newOnly: boolean; limit: number },
): string {
  const out: string[] = [];
  const rows = results.flatMap((r) => r.rows);
  const priced = rows.filter((r) => r.savingRate !== null).sort((a, b) => sourcingScore(b) - sourcingScore(a));

  const date = new Date(meta.startedAt).toISOString().slice(0, 16).replace('T', ' ');

  out.push('# RICKY 소싱 리서치 리포트');
  out.push('');
  out.push(`> 생성: ${date} UTC · 소요 ${(meta.durationMs / 1000).toFixed(0)}초`);
  out.push(
    `> 환율 스냅샷: CAD/KRW **${fx.cadKrw.toFixed(2)}** (버퍼 +${(0.02 * 100).toFixed(0)}% → ${fx.cadKrwBuffered.toFixed(2)}) · USD/KRW ${fx.usdKrw.toFixed(2)} · 출처 ${fx.source}`,
  );
  out.push(`> 대상: ${results.map((r) => BRANDS[r.brand].labelKo).join(' · ')} · 브랜드당 최대 ${meta.limit}건${meta.newOnly ? ' · 신제품만' : ''}`);
  out.push('');
  out.push(
    '**판매가는 통합 단일 원화가다.** 이 리포트의 원가(CAD)·마진·환율은 운영 내부 데이터이며 스토어에 노출하지 않는다 (CLAUDE.md 규칙 1).',
  );
  out.push('');

  // -------------------------------------------------------------------------
  out.push('## 1. 소싱 우선순위 TOP 30');
  out.push('');
  if (priced.length === 0) {
    out.push('_가격 비교가 성립한 상품이 없다. 6절 수집 품질을 확인할 것._');
  } else {
    out.push('| # | 브랜드 | 상품 | CA가 | 예상 판매가 | 국내 비교가 | 절감률 | 인기 | 재고 |');
    out.push('|---:|---|---|---:|---:|---:|---:|---:|---|');
    priced.slice(0, 30).forEach((r, i) => {
      const baseline = r.savingBaseline === 'kr_official' ? r.krOfficialKrw : r.krLowestKrw;
      const baseLabel = r.savingBaseline === 'kr_official' ? '공식' : '최저';
      const name = r.caUrl ? `[${trim(r.productName, 40)}](${r.caUrl})` : trim(r.productName, 40);
      // 세일가 기준 절감률은 세일이 끝나면 사라진다. 정가를 함께 보여 판단을 흐리지 않는다.
      const caCell = r.caOnSale
        ? `${cad(r.caPriceCents)}<br>_세일 (정가 ${cad(r.caListPriceCents)})_`
        : cad(r.caPriceCents);
      out.push(
        `| ${i + 1} | ${BRANDS[r.brand].labelKo} | ${name}${r.isNew ? ' 🆕' : ''} | ${caCell} | ${krw(r.estimatedSaleKrw)} | ${krw(baseline)}<br>_${baseLabel}_ | **${pct(r.savingRate)}** | ${r.popularity?.score ?? '—'} | ${avail[r.caAvailability] ?? '—'} |`,
      );
    });
  }
  out.push('');
  out.push(
    '- **예상 판매가** = §5 공식 `ceil100( (CA가×1.05 + 핸들링 CA$6) × 환율×1.02 × (1+마진 28%) )`. 국제배송비·관세·부가세는 별도다(DDU).',
  );
  out.push('- **절감률**은 예상 판매가를 국내 비교가와 견준 값이다. 국내 공식가가 있으면 그것을, 없으면 네이버쇼핑 최저가를 기준으로 삼는다.');
  out.push('');

  // -------------------------------------------------------------------------
  out.push('## 2. 브랜드별 한국 인기도 신호');
  out.push('');
  if (signalsByBrand.size === 0) {
    out.push('_이번 실행에서는 인기도 신호를 수집하지 않았다 (네이버 API 키 미설정 또는 `--no-signals`)._');
    out.push('');
    out.push('`.env` 에 `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` 을 넣으면 이 절이 채워지고,');
    out.push('1절 순위에도 인기도 가중치가 반영된다. 발급: https://developers.naver.com/apps (무료)');
  } else {
    out.push(
      '네이버 블로그·카페 언급량과 검색어 트렌드 기준. 점수는 언급량 30% + 증가세 30% + 최신성 20% + 유통폭 20%.',
    );
    out.push('');
    out.push('| 브랜드 | 검색어 | 점수 | 검색 증가율 | 블로그 | 카페 | 최근1년 비중 | 쇼핑 등록 |');
    out.push('|---|---|---:|---:|---:|---:|---:|---:|');

    for (const result of results) {
      const sig = signalsByBrand.get(result.brand);
      if (!sig) continue;
      const paired = sig.scores.map((s, i) => ({ s, raw: sig.signals[i] }));
      paired.sort((a, b) => b.s.score - a.s.score);
      for (const { s, raw } of paired) {
        if (!raw) continue;
        const arrow = s.momentumPct > 5 ? '▲' : s.momentumPct < -5 ? '▼' : '–';
        out.push(
          `| ${BRANDS[result.brand].labelKo} | ${s.query} | **${s.score}** | ${arrow} ${s.momentumPct}% | ${raw.blogTotal.toLocaleString()} | ${raw.cafeTotal.toLocaleString()} | ${pct(raw.recentBlogRatio, 0)} | ${raw.shoppingTotal === null ? '—' : raw.shoppingTotal.toLocaleString()} |`,
        );
      }
    }
    out.push('');
    out.push(
      '> 검색 증가율은 최근 3개월 평균을 직전 3개월과 비교한 값이다. 데이터랩 ratio 는 절대 검색량이 아니라 기간 내 상대값이다.',
    );
  }
  out.push('');

  // -------------------------------------------------------------------------
  out.push('## 3. 브랜드별 신제품');
  out.push('');
  for (const result of results) {
    const cfg = BRANDS[result.brand];
    const news = result.caListings
      .filter((l) => result.rows.find((r) => r.caUrl === l.url)?.isNew)
      .slice(0, 15);

    out.push(`### ${cfg.labelKo} (${cfg.label})`);
    out.push('');
    if (news.length === 0) {
      out.push('_최근 출시로 판정된 상품 없음._');
    } else {
      out.push('| 상품 | CA가 | 재고 | 출시/갱신 | 색상수 |');
      out.push('|---|---:|---|---|---:|');
      for (const l of news) {
        const when = l.releaseDate ?? l.lastModified ?? '—';
        const colors = new Set(l.variants.map((v) => v.color).filter(Boolean)).size;
        out.push(
          `| [${trim(l.name, 45)}](${l.url}) | ${cad(l.priceMinor)} | ${avail[l.availability] ?? '—'} | ${when.slice(0, 10)} | ${colors || '—'} |`,
        );
      }
    }
    out.push('');
  }

  // -------------------------------------------------------------------------
  out.push('## 4. 캐나다 공식몰 취급 여부');
  out.push('');
  out.push('한국에서 관측된 인기 상품이 캐나다 공식몰에 실제로 있는지 확인한 결과다.');
  out.push('');
  out.push('| 브랜드 | 국내 관측 상품 | CA 공식몰 | 매칭 |');
  out.push('|---|---|---|---|');

  for (const result of results) {
    const cfg = BRANDS[result.brand];
    const sample = result.rows.filter((r) => r.matchMethod !== 'unmatched').slice(0, 6);
    const missing = result.rows.filter((r) => r.matchMethod === 'unmatched' && r.krLowestKrw !== null).slice(0, 3);

    for (const r of sample) {
      out.push(
        `| ${cfg.labelKo} | ${trim(r.productName, 38)} | ✅ ${r.caUrl ? `[상품](${r.caUrl})` : '있음'} | ${r.matchMethod === 'product_code' ? '상품코드' : `유사도 ${r.matchConfidence}`} |`,
      );
    }
    for (const r of missing) {
      out.push(`| ${cfg.labelKo} | ${trim(r.productName, 38)} | ❌ 미확인 | 후보 유사도 ${r.matchConfidence} |`);
    }
  }
  out.push('');

  // -------------------------------------------------------------------------
  out.push('## 5. CA / KR 가격 비교 전체');
  out.push('');
  out.push('| 브랜드 | 상품 | CA (CAD) | CA 원화환산 | 예상 판매가 | KR 공식 | KR 최저 | 절감 |');
  out.push('|---|---|---:|---:|---:|---:|---:|---:|');
  for (const r of rows.slice(0, 120)) {
    out.push(
      `| ${BRANDS[r.brand].labelKo} | ${trim(r.productName, 36)} | ${cad(r.caPriceCents)} | ${krw(r.caPriceKrw)} | ${krw(r.estimatedSaleKrw)} | ${krw(r.krOfficialKrw)} | ${krw(r.krLowestKrw)} | ${pct(r.savingRate)} |`,
    );
  }
  if (rows.length > 120) out.push(`\n_외 ${rows.length - 120}건은 CSV 참고._`);
  out.push('');

  // -------------------------------------------------------------------------
  out.push('## 6. 수집 품질');
  out.push('');
  out.push('| 브랜드 | CA 수집 | KR 수집 | 가격비교 성립 | 오류 |');
  out.push('|---|---:|---:|---:|---:|');
  for (const r of results) {
    const ok = r.rows.filter((x) => x.savingRate !== null).length;
    out.push(
      `| ${BRANDS[r.brand].labelKo} | ${r.caListings.length} | ${r.krListings.length} | ${ok} | ${r.errors.length} |`,
    );
  }
  out.push('');

  const errored = results.filter((r) => r.errors.length > 0);
  if (errored.length > 0) {
    out.push('<details><summary>오류 상세</summary>');
    out.push('');
    for (const r of errored) {
      out.push(`**${BRANDS[r.brand].labelKo}**`);
      out.push('');
      for (const e of r.errors.slice(0, 20)) out.push(`- ${e}`);
      out.push('');
    }
    out.push('</details>');
    out.push('');
  }

  out.push('---');
  out.push('');
  out.push('### 이 리포트를 읽을 때 주의할 점');
  out.push('');
  out.push('1. **원산지는 참고값이다.** CKFTA 관세 0% 판정은 실물 라벨을 확인한 뒤에만 내린다. 캐나다 브랜드라도 생산지가 제3국이면 특혜 대상이 아니다 (CLAUDE.md 규칙 5).');
  out.push('2. **CKFTA 는 관세만 0%다.** 부가세 10% 는 그대로 부과되므로 "완전 면세"로 안내하면 안 된다.');
  out.push('3. **예상 판매가에 관세·부가세는 없다(DDU).** 다만 고객에게는 예상 세액을 항상 계산해 보여준다 (CLAUDE.md 규칙 3).');
  out.push('4. **재고는 이 리포트 생성 시점 값이다.** 실제 판매 개시 전에는 §6.5 신선도 게이트(기본 6시간)를 통과해야 한다.');
  out.push('5. **매칭 신뢰도 1.0 미만은 사람이 확인한다.** 이름 유사도 매칭은 색상·시즌 차이를 구분하지 못할 수 있다.');

  return out.join('\n');
}

function trim(s: string, n: number): string {
  const clean = s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
  return clean.length > n ? `${clean.slice(0, n - 1)}…` : clean;
}
