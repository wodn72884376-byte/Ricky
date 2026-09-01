/**
 * 크롬 확장을 만들어 낸다.
 *
 * 북마클릿과 마찬가지로 **대상이 안에 박힌다.** 카탈로그가 바뀌면 다시 만들어
 * 다시 불러와야 한다 — 지문(`catalogFp`)을 함께 심어 두므로 낡으면 수집 때 알려 준다.
 *
 * 대상은 `data/supplier-urls.json` 이 해석해 둔 공식몰 URL 이다. 감시 목록을 따로
 * 손으로 들고 있으면 반드시 카탈로그와 어긋난다 (src/stock/catalog.ts 와 같은 이유).
 * URL 이 아직 없는 상품은 확장이 갈 곳을 모른다 — 북마클릿으로 한 번 받아 두면
 * `learnUrls` 가 배우고, 그 다음부터 확장이 맡는다.
 *
 * **대상은 `automation: 'bookmarklet'` 브랜드만이다.** 아크테릭스·코치는 서버에서
 * 그냥 받아지므로(`stock:all`) 확장까지 열면 같은 페이지를 두 번 긁는 셈이다 —
 * 회차가 길어지고 사용자 브라우저로 남의 사이트를 괜히 두드리게 된다.
 * 정 필요하면 `--all` 로 전부 넣을 수 있다.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { BRANDS } from '../config/brands.ts';
import { CATALOG } from '@app/lib/catalog.generated.ts';
import type { BrandKey } from '../core/types.ts';
import { runtime } from '../config/runtime.ts';
import { catalogTargets, resolveTargetUrls } from '../stock/catalog.ts';
import { CAPTURE_VERSION, collectorSource, targetsFingerprint } from '../stock/bookmarklet.ts';
import { COLLECTOR_TAIL } from './collector.ts';
import { BACKGROUND_SOURCE } from './background.ts';
import { POPUP_HTML, POPUP_JS } from './popup.ts';
import { manifest } from './manifest.ts';

export type ExtensionTarget = {
  slug: string;
  url: string;
  brand: string;
  name: string;
  /**
   * 이 페이지에서 고시 항목(소재·취급주의·원산지)도 걷을지.
   *
   * 재고는 6시간마다 바뀌지만 소재는 안 바뀐다. 매 회차 걷으면 캡처 파일만 커지고
   * 같은 값을 다시 읽는다. **카탈로그에 아직 빈 항목이 있는 상품만** 켠다 —
   * 채워지면 다음 `npm run extension` 에서 저절로 꺼진다.
   */
  needsDetails?: true;
};

export type BuildResult = {
  dir: string;
  targets: ExtensionTarget[];
  /** 카탈로그에 있지만 URL 을 몰라 확장이 갈 수 없는 상품 */
  missing: { brand: string; name: string }[];
  /** 고시 항목을 걷을 상품 수. 0 이면 그 수집은 하지 않는다. */
  needDetails: number;
  hosts: string[];
  /** 서버에서 자동으로 받아지므로 확장에 넣지 않은 브랜드 */
  skipped: string[];
};

export async function buildExtension(
  opts: { fresh?: boolean; all?: boolean } = {},
): Promise<BuildResult> {
  const all = await resolveTargetUrls(catalogTargets(), { fresh: opts.fresh });

  /*
   * 서버에서 받아지는 브랜드는 확장이 맡을 이유가 없다. `stock:all` 이 이미 한다.
   * 기본값이 'auto' 이므로 명시적으로 막힌 브랜드만 남는다.
   */
  const { kept: resolved, skipped } = splitByAutomation(all, opts.all ?? false);

  /*
   * 고시 항목이 아직 빈 상품. 이것만 구획을 걷는다.
   * 원산지는 실물 라벨 기준이라(규칙 5) 카탈로그에 있으면 그것이 답이고, 덮지 않는다.
   */
  const incomplete = new Set(
    CATALOG.filter((p) => !p.material || !p.care || !p.originCountry).map((p) => p.slug),
  );

  const targets: ExtensionTarget[] = [];
  const missing: BuildResult['missing'] = [];
  for (const t of resolved) {
    if (t.urls.length === 0) {
      missing.push({ brand: BRANDS[t.brand].labelKo, name: t.name });
      continue;
    }
    // 한 상품이 페이지 여러 개일 수 있다 (캐나다구스 디스크). 전부 대상이다.
    const needsDetails = incomplete.has(t.slug);
    for (const url of t.urls) {
      targets.push({
        slug: t.slug,
        url,
        brand: t.brand,
        name: t.name,
        ...(needsDetails ? { needsDetails: true as const } : {}),
      });
    }
  }

  /*
   * 호스트 권한은 **실제 대상이 있는 오리진만** 적는다.
   * 브랜드 전체를 적으면 쓰지도 않는 사이트 권한을 사용자에게 요구하게 된다.
   */
  const hosts = [...new Set(targets.map((t) => `${new URL(t.url).origin}/*`))].sort();

  const dir = join(fileURLToPath(runtime.paths.data), 'extension');
  await mkdir(dir, { recursive: true });

  await writeFile(join(dir, 'manifest.json'), manifest({ hosts, version: buildVersion() }), 'utf8');

  await writeFile(
    join(dir, 'background.js'),
    [
      `const TARGETS = ${JSON.stringify(targets, null, 2)};`,
      `const CAPTURE_VERSION = ${CAPTURE_VERSION};`,
      `const TARGETS_FP = ${JSON.stringify(targetsFingerprint(targets.map((t) => t.url)))};`,
      BACKGROUND_SOURCE,
    ].join('\n'),
    'utf8',
  );

  // 추출 규칙은 북마클릿과 같은 소스에서 온다 — 두 벌로 두면 결과가 조용히 갈린다.
  await writeFile(join(dir, 'collector.js'), `${collectorSource()}\n${COLLECTOR_TAIL}`, 'utf8');
  await writeFile(join(dir, 'popup.html'), POPUP_HTML, 'utf8');
  await writeFile(join(dir, 'popup.js'), POPUP_JS, 'utf8');

  const needDetails = new Set(targets.filter((t) => t.needsDetails).map((t) => t.slug)).size;
  return { dir, targets, missing, hosts, skipped, needDetails };
}

/**
 * 확장이 맡을 대상과, 서버가 맡으므로 뺀 브랜드를 가른다.
 *
 * 확장은 사용자의 진짜 브라우저로 남의 사이트를 여는 것이다. 서버에서 이미 받아지는
 * 페이지를 또 여는 건 두 번 긁는 것일 뿐 얻는 게 없다.
 */
export function splitByAutomation<T extends { brand: BrandKey }>(
  all: T[],
  includeAuto: boolean,
): { kept: T[]; skipped: string[] } {
  if (includeAuto) return { kept: all, skipped: [] };
  const kept = all.filter((t) => BRANDS[t.brand].ca.automation === 'bookmarklet');
  const skipped = [
    ...new Set(
      all.filter((t) => BRANDS[t.brand].ca.automation !== 'bookmarklet').map((t) => BRANDS[t.brand].labelKo),
    ),
  ].sort();
  return { kept, skipped };
}

/** 크롬은 버전에 숫자와 점만 받는다. 다시 만들 때마다 올라가야 재설치가 인식된다. */
function buildVersion(): string {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}.${d.getHours() * 60 + d.getMinutes()}`;
}
