/**
 * 공식몰 PDP 하나를 상위 프로젝트의 **상품 폴더**로 받아 온다.
 *
 * 카탈로그 임포터(`scripts/import-catalog.mjs`)는 `아크테릭스/{남성|여성}/{상품}/` 안의
 * 이미지 파일명에서 SKU·색상·뷰를 읽는다. 지금까지 그 폴더는 사람이 손으로 채웠는데,
 * 아울렛처럼 상품이 수시로 들고 나는 곳에서는 그 방식이 곧 병목이 된다.
 *
 * 여기서 하는 일은 **받아 적는 것뿐이다.**
 *   1. PDP 를 읽어 색상·사이즈·가격을 얻는다 (재고 수집과 같은 어댑터를 쓴다)
 *   2. 색상마다 대표 이미지 주소에서 형제 뷰(Back/Side/Hover…)를 유추해 내려받는다
 *   3. 가격을 `가격.txt` 에 적는다 — 「가격표 비교.xlsx」에 행이 없는 상품용이다
 *
 * 파일명은 **CDN 이 쓰는 이름 그대로**다. 그 이름이 이미 임포터의 규칙과 같다
 * (`S26-X000009906-Beta-AR-Jacket-Stone-Red-Dk-Stone-Front-View.jpg`).
 * 우리가 이름을 새로 지으면 규칙이 두 벌이 된다.
 *
 * 값을 지어내지 않는다. 원산지·소재는 여기서 건드리지 않는다 —
 * 그건 `src/details/run.ts` 가 상품 단위로 따로 읽는다.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdapter } from '../adapters/index.ts';
import { runtime } from '../config/runtime.ts';
import { log } from '../core/logger.ts';
import { isAllowed, withPoliteness } from '../core/politeness.ts';
import type { Listing } from '../core/types.ts';

const APP_DIR = fileURLToPath(runtime.paths.app);

/**
 * 내려받아 볼 뷰. 임포터의 `VIEWS` 중 아크테릭스 CDN 이 실제로 들고 있는 것들이다.
 * 없는 뷰는 403/404 로 떨어지고 그건 오류가 아니다 — 상품마다 컷 수가 다르다.
 */
export const VIEW_SUFFIXES = [
  'Front-View',
  'Hover',
  'Back-View',
  'Side-View',
  'Fabric-Detail',
  'Hood',
  'Full-Body',
] as const;

/** 임포터가 폴더명에서 성별을 읽는다. URL 이 답을 준다 — 이름으로 추측하지 않는다. */
export function genderDirOf(url: string): '남성' | '여성' | null {
  if (/\/mens?\//i.test(url)) return '남성';
  if (/\/womens?\//i.test(url)) return '여성';
  return null;
}

/**
 * 대표 이미지 주소에서 뷰 접미사를 떼어 낸 기준 주소.
 *
 * `…-Stone-Red-Dk-Stone-Front-View.jpg` → `…-Stone-Red-Dk-Stone` + `.jpg`.
 * 아는 접미사가 없으면 확장자만 뗀다 — 그 경우 형제 뷰는 유추하지 않는다.
 */
export function imageBaseOf(url: string): { base: string; ext: string; known: boolean } | null {
  const m = /^(.*)(\.[a-z]+)$/i.exec(url);
  if (!m) return null;
  const [, withoutExt = '', ext = ''] = m;
  for (const v of VIEW_SUFFIXES) {
    if (withoutExt.endsWith(`-${v}`)) {
      return { base: withoutExt.slice(0, -(v.length + 1)), ext, known: true };
    }
  }
  return { base: withoutExt, ext, known: false };
}

/**
 * 색상 하나에 대해 시도할 이미지 주소들.
 *
 * 뷰 접미사가 없는 대표 이미지도 있다(`…-Sabre-SV-Jacket-Black.jpg`). 그때도 형제 뷰를
 * 붙여 본다 — 접미사가 없다고 컷이 하나뿐인 것은 아니다. 없는 뷰는 그냥 안 받아진다.
 */
export function candidateUrls(imageUrl: string): string[] {
  const parsed = imageBaseOf(imageUrl);
  if (!parsed) return [imageUrl];
  const views = VIEW_SUFFIXES.map((v) => `${parsed.base}-${v}${parsed.ext}`);
  return parsed.known ? views : [imageUrl, ...views];
}

/**
 * 저장할 파일명. **상품코드는 PDP 가 말한 값으로 바로잡는다.**
 *
 * CDN 파일명의 코드가 이 상품의 것이 아닐 때가 있다 — 실측: 아울렛 Alpha SV(X000009989)
 * 의 대표 이미지가 정가 상품 X000009899 의 컷을 가리켰다(Beta SL 도 10553↔10552).
 * 임포터는 이 파일명에서 SKU 를 읽어 재고를 붙이므로, 그대로 두면 색상은 멀쩡한데
 * 재고가 영영 안 붙는다. 이름은 우리 규칙이고, 코드의 정답은 PDP 에 있다.
 */
export function targetFileName(url: string, productCode: string | null): string {
  const name = url.split('/').pop()!;
  if (!productCode) return name;
  return name.replace(/X\d{6,}/, productCode);
}

/**
 * `가격.txt` 본문.
 *
 * 색상마다 값이 같으면 한 줄로 적는다 — 사람이 고칠 파일이라 짧을수록 낫다.
 * 아울렛은 같은 상품 안에서도 색상마다 값이 갈리므로(실측: Beta AR 420 vs 588)
 * 그때는 색상별로 적는다.
 */
export const PRICE_FILE = '가격.txt';

const PRICE_HEAD =
  '# 공식몰에서 읽은 판매가(CAD). 「가격표 비교.xlsx」에 행이 있으면 그것이 이긴다.\n' +
  '# 색상마다 값이 다르면 `색상: 448CAD` 로 적는다.\n';

export function priceFileText(
  colours: { label: string; cad: number | null }[],
  opts: { perColour?: boolean; existing?: string | null } = {},
): string | null {
  const priced = colours.filter((c) => c.cad !== null) as { label: string; cad: number }[];
  if (priced.length === 0) return opts.existing ?? null;

  /*
   * 이미 있는 파일은 **사람이 고쳤을 수 있다.** 같은 색상이 적혀 있으면 그 값을 남긴다 —
   * 다시 받아 왔다고 손으로 정한 값을 덮으면, 고쳐 둔 것이 조용히 사라진다.
   */
  const kept = (opts.existing ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const has = (label: string) =>
    kept.some((l) => l.toLowerCase().startsWith(`${label.toLowerCase()}:`));

  const distinct = new Set(priced.map((c) => c.cad));
  const perColour = opts.perColour || distinct.size > 1 || kept.length > 0;

  if (!perColour) return `${PRICE_HEAD}${priced[0]!.cad}CAD\n`;

  const added = priced.filter((c) => !has(c.label)).map((c) => `${c.label}: ${c.cad}CAD`);
  const lines = [...kept, ...added];
  return lines.length === 0 ? null : PRICE_HEAD + lines.map((l) => `${l}\n`).join('');
}


async function download(url: string): Promise<Buffer | null> {
  if (!(await isAllowed(url))) {
    log.warn(`robots 가 막은 이미지: ${url}`);
    return null;
  }
  return withPoliteness(url, async () => {
    const res = await fetch(url, {
      headers: { 'user-agent': runtime.userAgent, accept: 'image/*' },
      signal: AbortSignal.timeout(runtime.requestTimeoutMs),
    });
    // 없는 뷰는 403/404 다. 상품마다 컷 수가 다른 것뿐이라 오류로 다루지 않는다.
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  });
}

export type IntakeResult = {
  url: string;
  /** 만들어진 폴더의 상위 프로젝트 기준 상대 경로 */
  dir: string;
  productName: string;
  productCode: string | null;
  colours: { label: string; cad: number | null; files: string[] }[];
  skipped: string[];
  error?: string;
};

export type IntakeOptions = {
  /** 폴더명을 직접 준다. 기존 상품에 색상만 더할 때(합치기) 쓴다. */
  into?: string;
  /** 이미지·파일을 쓰지 않고 무엇을 할지만 보여 준다. */
  dryRun?: boolean;
};

/**
 * PDP 한 건을 상품 폴더로 받아 적는다.
 *
 * 이미 있는 폴더에 넣으면 **색상이 더해진다** — 같은 이름의 상품이 세대별로 따로
 * 팔릴 때(아울렛) 한 상품의 색상으로 접기 위해서다. 파일명이 SKU 를 들고 있으므로
 * 세대가 섞여도 임포터가 색상마다 옳은 상품코드를 붙인다.
 */
export async function intakeProduct(url: string, opts: IntakeOptions = {}): Promise<IntakeResult> {
  const gender = genderDirOf(url);
  if (!gender) {
    return {
      url, dir: '', productName: '', productCode: null, colours: [], skipped: [],
      error: 'URL 에서 성별을 읽지 못했다 (/mens/ · /womens/ 가 없다)',
    };
  }

  let listing: Listing | null;
  try {
    listing = await getAdapter('arcteryx').fetchListing(url, 'CA', { fresh: true });
  } catch (err) {
    return {
      url, dir: '', productName: '', productCode: null, colours: [], skipped: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!listing) {
    return {
      url, dir: '', productName: '', productCode: null, colours: [], skipped: [],
      error: '상품 데이터를 얻지 못했다 (차단 또는 마크업 변경)',
    };
  }

  const folder = opts.into ?? listing.name;
  const relDir = join('아크테릭스', gender, folder);
  const absDir = join(APP_DIR, relDir);

  /*
   * 색상마다 대표 이미지가 하나씩 온다(JSON-LD variant.image). 사이즈 행이 여러 개라
   * 같은 색상이 반복되므로 첫 값만 쓴다. 가격도 색상 단위로 갈린다.
   */
  const byColour = new Map<string, { image: string | null; cad: number | null }>();
  for (const v of listing.variants) {
    const label = v.color?.trim() || '기본';
    const seen = byColour.get(label);
    if (!seen) {
      byColour.set(label, {
        image: v.imageUrl,
        cad: v.priceMinor === null ? null : v.priceMinor / 100,
      });
      continue;
    }
    if (!seen.image && v.imageUrl) seen.image = v.imageUrl;
    if (seen.cad === null && v.priceMinor !== null) seen.cad = v.priceMinor / 100;
  }

  /*
   * 이미 이미지가 있는 폴더에 넣는 것이면 **합치기**다. 그때 가격은 색상별로 적는다 —
   * 한 줄짜리 상품 가격을 쓰면 원래 있던 색상들 값까지 이 값으로 덮인다.
   */
  const merging = (await readdir(absDir).catch(() => [])).some((f) =>
    /\.(avif|jpe?g|png|webp)$/i.test(f),
  );

  const result: IntakeResult = {
    url,
    dir: relDir,
    productName: listing.name,
    productCode: listing.productCode,
    colours: [],
    skipped: [],
  };

  if (!opts.dryRun) await mkdir(absDir, { recursive: true });

  for (const [label, info] of byColour) {
    const files: string[] = [];
    if (!info.image) {
      result.skipped.push(`${label}: 이미지 주소 없음`);
    } else if (opts.dryRun) {
      files.push(...candidateUrls(info.image).map((u) => targetFileName(u, listing.productCode)));
    } else {
      for (const candidate of candidateUrls(info.image)) {
        const buf = await download(candidate);
        if (!buf) continue;
        const name = targetFileName(candidate, listing.productCode);
        await writeFile(join(absDir, name), buf);
        files.push(name);
      }
      if (files.length === 0) result.skipped.push(`${label}: 이미지를 하나도 못 받았다`);
    }
    result.colours.push({ label, cad: info.cad, files });
  }

  const target = join(absDir, PRICE_FILE);
  const existing = await readFile(target, 'utf8').catch(() => null);
  const priceText = priceFileText(
    result.colours.map((c) => ({ label: c.label, cad: c.cad })),
    { perColour: merging, existing },
  );
  if (priceText && !opts.dryRun && priceText !== existing) await writeFile(target, priceText);

  return result;
}
