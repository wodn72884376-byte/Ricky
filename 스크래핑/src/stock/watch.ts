/**
 * 다운로드 폴더를 지켜보다가 수집 파일이 떨어지면 파이프라인을 돌린다.
 *
 * 확장이 수집을 마치면 `ricky-stock-*.json` 이 다운로드 폴더에 떨어진다. 그때
 * `stock:all` 을 사람이 다시 쳐야 하는 게 성가시다는 요구에서 나왔다.
 *
 * **왜 감시(inotify)가 아니라 폴링인가.** 크롬은 윈도우에서 돌고 다운로드 폴더는
 * `/mnt/c/...` 다. WSL2 의 drvfs 는 **윈도우 쪽 변경에 inotify 를 올려 주지 않는다** —
 * `fs.watch` 를 걸면 조용히 아무 일도 일어나지 않는다. 켜 뒀는데 안 도는 게 제일
 * 나쁜 실패라 처음부터 폴링으로 간다.
 *
 * 확장이 프로세스를 직접 띄울 수는 없다(MV3 는 네이티브 메시징 호스트를 따로
 * 설치해야 한다). 그래서 '파일이 떨어지는 것'을 신호로 쓴다 — 북마클릿으로 손수
 * 받은 파일도 똑같이 잡히는 게 덤이다.
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { CAPTURE_FILE_PREFIX } from './bookmarklet.ts';
import { log } from '../core/logger.ts';

/** 파일 이름 → 크기. 크기가 두 번 연속 같으면 다 받아졌다고 본다. */
export type Snapshot = Map<string, number>;

export type Diff = {
  /** 크기가 안정된 새 파일 — 이제 읽어도 된다 */
  settled: string[];
  /** 아직 받는 중이거나 이번에 처음 본 파일 — 다음 회차에 다시 본다 */
  growing: string[];
};

/**
 * 이번에 처리할 파일을 고른다.
 *
 * 받는 중인 파일을 읽으면 JSON 이 잘려 수집분을 통째로 버리게 된다. 그래서
 * **한 회차를 기다려 크기가 그대로일 때만** 처리한다.
 */
export function diffCaptures(prev: Snapshot, cur: Snapshot, processed: Set<string>): Diff {
  const settled: string[] = [];
  const growing: string[] = [];

  for (const [name, size] of cur) {
    if (processed.has(name)) continue;
    const before = prev.get(name);
    if (before !== undefined && before === size) settled.push(name);
    else growing.push(name);
  }

  return { settled: settled.sort(), growing: growing.sort() };
}

/** 다운로드 폴더에서 수집 파일만 훑는다. */
export async function snapshot(dir: string): Promise<Snapshot> {
  const out: Snapshot = new Map();
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return out; // 폴더가 잠깐 없을 수 있다 — 다음 회차에 다시 본다
  }

  for (const name of names) {
    if (!name.startsWith(CAPTURE_FILE_PREFIX) || !name.endsWith('.json')) continue;
    try {
      out.set(name, (await stat(join(dir, name))).size);
    } catch {
      // 훑는 사이에 사라졌다 — 무시한다
    }
  }
  return out;
}

export type WatchOptions = {
  dir: string;
  /** 폴링 간격(ms). 기본 20초 — 사람이 기다리는 일이 아니라 자주 볼 이유가 없다. */
  everyMs?: number;
  /** 파일이 안정되면 부르는 것. 여기서 파이프라인을 돌린다. */
  onSettled: (files: string[]) => Promise<void>;
  /** 시험용. 몇 회차 돌고 멈춘다. */
  maxTicks?: number;
  sleep?: (ms: number) => Promise<void>;
};

export async function watchCaptures(opts: WatchOptions): Promise<void> {
  const everyMs = opts.everyMs ?? 20_000;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  /*
   * 켤 때 이미 있던 파일은 처리한 것으로 친다. 안 그러면 켤 때마다 예전 수집분으로
   * 파이프라인이 한 번 돈다 — 새로 수집된 게 없는데 리포트만 쌓인다.
   */
  const processed = new Set<string>((await snapshot(opts.dir)).keys());
  let prev = await snapshot(opts.dir);

  log.info(
    `지켜보는 중: ${opts.dir}\n` +
      `  ${everyMs / 1000}초마다 ${CAPTURE_FILE_PREFIX}*.json 을 확인한다 (이미 있는 ${processed.size}개는 건너뛴다).\n` +
      '  멈추려면 Ctrl+C.',
  );

  for (let tick = 0; opts.maxTicks === undefined || tick < opts.maxTicks; tick += 1) {
    await sleep(everyMs);

    const cur = await snapshot(opts.dir);
    const { settled } = diffCaptures(prev, cur, processed);
    prev = cur;
    if (settled.length === 0) continue;

    for (const f of settled) processed.add(f);
    log.ok(`새 수집 파일 ${settled.length}개 — 파이프라인을 돌린다`);

    try {
      await opts.onSettled(settled);
    } catch (err) {
      /*
       * 한 번 실패했다고 감시를 끄지 않는다. 켜 두는 게 목적인데 조용히 죽으면
       * 사용자는 돌고 있는 줄 안다.
       */
      log.error(`파이프라인 실패 — 계속 지켜본다: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
