/**
 * 수집 파일에서 고시 항목을 뽑아 상위 프로젝트가 읽을 파일로 만든다.
 *
 *   다운로드 폴더의 ricky-stock-*.json  →  스마일리키/scripts/product-disclosure.json
 *
 * 확장이 6시간마다 여는 페이지에서 이미 걷어 온 값이라 **추가 요청이 없다.**
 * `official-urls.json` 과 같은 자리에 두는 이유도 같다 — 카탈로그 임포트가
 * 손으로 관리하는 값을 먼저 읽고, 없으면 여기서 채운다.
 *
 * 원산지는 참고값으로만 싣는다(규칙 5). 실물 라벨을 확인한 사람이 덮어쓸 수 있게
 * 원문(`originText`)을 함께 남긴다.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { runtime } from '../config/runtime.ts';
import { log } from '../core/logger.ts';
import { CAPTURE_FILE_PREFIX, type DocSection, type StockCapture } from '../stock/bookmarklet.ts';
import { readDisclosure } from './disclose.ts';

export type DisclosureFile = Record<
  string,
  { material?: string; care?: string; origin?: string; originText?: string; source: string }
>;

/** 캡처 하나에서 (슬러그 → 구획) 을 뽑는다. 목록수집은 파일 하나에 여러 상품이 들어 있다. */
export function sectionsBySlug(capture: StockCapture): Map<string, DocSection[]> {
  const out = new Map<string, DocSection[]>();
  for (const item of capture.batch ?? []) {
    const b = item as { slug?: string; sections?: DocSection[] };
    if (!b.slug || !b.sections?.length) continue;
    // 나중에 받은 것이 이긴다 — 페이지가 바뀌면 새 값이 맞다.
    out.set(b.slug, b.sections);
  }
  return out;
}

export async function collectDisclosure(dir: string): Promise<DisclosureFile> {
  const files = (await readdir(dir))
    .filter((f) => f.startsWith(CAPTURE_FILE_PREFIX) && f.endsWith('.json'))
    .sort();

  const bySlug = new Map<string, DocSection[]>();
  for (const f of files) {
    try {
      const capture = JSON.parse(await readFile(join(dir, f), 'utf8')) as StockCapture;
      for (const [slug, sections] of sectionsBySlug(capture)) bySlug.set(slug, sections);
    } catch {
      // 형식이 다른 파일은 조용히 넘긴다 — import 쪽이 이미 세고 있다
    }
  }

  const out: DisclosureFile = {};
  for (const [slug, sections] of bySlug) {
    const d = readDisclosure(sections);
    if (!d.material && !d.care && !d.origin) continue;
    out[slug] = {
      ...(d.material ? { material: d.material } : {}),
      ...(d.care ? { care: d.care } : {}),
      ...(d.origin ? { origin: d.origin } : {}),
      ...(d.originText ? { originText: d.originText } : {}),
      source: 'collected',
    };
  }
  return out;
}

export async function writeDisclosure(dir: string): Promise<{ path: string; count: number }> {
  const data = await collectDisclosure(dir);
  const path = join(fileURLToPath(runtime.paths.app), 'scripts', 'product-disclosure.json');

  const withNote = {
    _주석: [
      '확장·북마클릿이 상품 페이지에서 걷어 온 고시 항목. npm run disclose 로 다시 만든다.',
      'scripts/official-urls.json 과 달리 이 파일은 자동 생성이다 — 손으로 고치면 다음 실행에 덮인다.',
      '원산지(origin)는 브랜드 페이지가 말한 값이지 실물 라벨이 아니다. CKFTA 판정에 쓰기 전에',
      '실물 라벨을 확인하고, 확인한 값은 원본 폴더의 details.txt 에 적어라 (CLAUDE.md 규칙 5).',
    ],
    ...data,
  };

  await writeFile(path, `${JSON.stringify(withNote, null, 2)}\n`, 'utf8');
  const count = Object.keys(data).length;
  log.ok(`고시 항목 ${count}건 → ${path}`);
  return { path, count };
}
