import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { diffCaptures, snapshot, watchCaptures, type Snapshot } from '../stock/watch.ts';
import { LOGON_SCRIPT_NAME, logonScript, startupDir, unitFile } from '../stock/autostart.ts';

const snap = (o: Record<string, number>): Snapshot => new Map(Object.entries(o));

describe('diffCaptures — 받는 중인 파일을 읽지 않는다', () => {
  /*
   * 다 받아지지 않은 JSON 을 읽으면 잘린 채 파싱에 실패해 수집분을 통째로 버린다.
   * 그래서 크기가 두 번 연속 같을 때만 처리한다.
   */
  it('처음 본 파일은 기다린다 — 아직 받는 중일 수 있다', () => {
    const d = diffCaptures(snap({}), snap({ 'ricky-stock-1.json': 100 }), new Set());
    expect(d.settled).toEqual([]);
    expect(d.growing).toEqual(['ricky-stock-1.json']);
  });

  it('크기가 그대로면 다 받아진 것으로 본다', () => {
    const d = diffCaptures(snap({ 'ricky-stock-1.json': 100 }), snap({ 'ricky-stock-1.json': 100 }), new Set());
    expect(d.settled).toEqual(['ricky-stock-1.json']);
  });

  it('크기가 늘고 있으면 아직 기다린다', () => {
    const d = diffCaptures(snap({ 'ricky-stock-1.json': 100 }), snap({ 'ricky-stock-1.json': 250 }), new Set());
    expect(d.settled).toEqual([]);
    expect(d.growing).toEqual(['ricky-stock-1.json']);
  });

  it('이미 처리한 파일은 다시 돌리지 않는다', () => {
    const cur = snap({ 'ricky-stock-1.json': 100 });
    const d = diffCaptures(cur, cur, new Set(['ricky-stock-1.json']));
    expect(d.settled).toEqual([]);
    expect(d.growing).toEqual([]);
  });

  it('여러 개가 한꺼번에 안정되면 함께 넘긴다 — 파이프라인은 한 번만 돈다', () => {
    const before = snap({ 'ricky-stock-1.json': 10, 'ricky-stock-2.json': 20 });
    const d = diffCaptures(before, before, new Set());
    expect(d.settled).toEqual(['ricky-stock-1.json', 'ricky-stock-2.json']);
  });
});

describe('snapshot', () => {
  it('수집 파일만 본다 — 다운로드 폴더에는 남의 파일이 많다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ricky-watch-'));
    await writeFile(join(dir, 'ricky-stock-1.json'), '{}');
    await writeFile(join(dir, '세금계산서.pdf'), 'x');
    await writeFile(join(dir, 'ricky-stock-1.json.crdownload'), 'x');

    expect([...(await snapshot(dir)).keys()]).toEqual(['ricky-stock-1.json']);
  });

  it('폴더가 없어도 죽지 않는다 — 다음 회차에 다시 본다', async () => {
    expect((await snapshot('/그런/폴더는/없다')).size).toBe(0);
  });
});

describe('watchCaptures', () => {
  it('켤 때 이미 있던 파일로는 돌지 않는다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ricky-watch-'));
    await writeFile(join(dir, 'ricky-stock-old.json'), '{}');
    const onSettled = vi.fn(async () => {});

    await watchCaptures({ dir, everyMs: 0, onSettled, maxTicks: 3, sleep: async () => {} });

    expect(onSettled).not.toHaveBeenCalled();
  });

  it('새 파일이 안정되면 파이프라인을 돌린다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ricky-watch-'));
    const onSettled = vi.fn(async () => {});
    let tick = 0;

    await watchCaptures({
      dir,
      everyMs: 0,
      onSettled,
      maxTicks: 4,
      sleep: async () => {
        // 첫 회차 뒤에 파일이 떨어진다. 그 다음 회차에 크기가 안정된다.
        if (tick++ === 0) await writeFile(join(dir, 'ricky-stock-new.json'), '{"a":1}');
      },
    });

    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith(['ricky-stock-new.json']);
  });

  it('파이프라인이 실패해도 감시를 멈추지 않는다 — 조용히 죽는 게 제일 나쁘다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ricky-watch-'));
    const onSettled = vi.fn(async () => {
      throw new Error('수집 실패');
    });
    let tick = 0;

    await watchCaptures({
      dir,
      everyMs: 0,
      onSettled,
      maxTicks: 6,
      sleep: async () => {
        const n = tick++;
        if (n === 0) await writeFile(join(dir, 'ricky-stock-a.json'), '{}');
        if (n === 2) await writeFile(join(dir, 'ricky-stock-b.json'), '{}');
      },
    });

    expect(onSettled).toHaveBeenCalledTimes(2);
  });
});

describe('autostart 유닛 파일', () => {
  const unit = unitFile({ cwd: '/home/x/스크래핑', node: '/usr/bin/node', tsx: '/t/cli.mjs', everySec: 20 });

  it('SIGTERM 을 실패로 기록하지 않는다 — status 가 failed 로 남으면 깨진 줄 안다', () => {
    expect(unit).toContain('SuccessExitStatus=143 SIGTERM');
  });

  it('죽으면 다시 띄운다', () => {
    expect(unit).toContain('Restart=always');
  });

  it('한글 경로를 그대로 쓴다 — 프로젝트 경로에 한글이 있다', () => {
    expect(unit).toContain('WorkingDirectory=/home/x/스크래핑');
  });

  /*
   * 실측: `schtasks /sc onlogon` 은 `/rl highest` 를 빼도 "액세스가 거부되었습니다" 로
   * 막힌다. 관리자 권한이 필요 없는 시작프로그램 폴더로 간 이유다.
   */
  it('로그온 스크립트는 WSL 만 띄운다 — 감시를 직접 부르면 로그온 세션과 함께 죽는다', () => {
    const vbs = logonScript('Ubuntu-24.04');
    expect(vbs).toContain('wsl.exe -d Ubuntu-24.04 -- true');
    expect(vbs).not.toContain('stock:watch');
  });

  it('창을 띄우지 않는다 — cmd 는 콘솔이 번쩍인다', () => {
    expect(logonScript('Ubuntu-24.04')).toContain('", 0, False');
    expect(LOGON_SCRIPT_NAME.endsWith('.vbs')).toBe(true);
  });

  it('윈도우 스크립트라 줄바꿈은 CRLF', () => {
    expect(logonScript('Ubuntu-24.04')).toContain('\r\n');
  });

  it('윈도우 사용자명은 리눅스 쪽과 다르다 — 경로를 계정별로 만든다', () => {
    expect(startupDir('kjw92')).toBe(
      '/mnt/c/Users/kjw92/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup',
    );
  });
});

describe('수집 다음은 적재다', () => {
  /*
   * 리포트만 만들고 멈추면 스토어는 옛 재고를 판다. 수집의 목적은 리포트가 아니라
   * 스토어 반영이므로, 한 회차는 Supabase 적재까지다.
   */
  const cli = readFileSync(join(import.meta.dirname, '..', 'cli.ts'), 'utf8');

  it('감시가 수집 후 적재를 부른다', () => {
    expect(cli).toContain('await loadToSupabase()');
  });

  it('DB 는 상위 프로젝트 스크립트가 만진다 — 스키마 지식을 두 벌로 두지 않는다', () => {
    expect(cli).toContain("'db:stock-load'");
  });

  it('적재가 실패해도 감시는 계속한다 — 여기서 죽으면 다음 회차가 통째로 멈춘다', () => {
    const fn = cli.slice(cli.indexOf('async function loadToSupabase'));
    expect(fn).toContain("child.on('error'");
    expect(fn).not.toMatch(/reject\(/);
  });
});

describe('고시 항목은 수집과 같은 자리에서 뽑는다', () => {
  /*
   * 따로 명령을 치게 하면 결국 안 치게 되고, 확장이 걷어 온 값이 파일에만 남는다.
   * 캡처를 읽는 자리에서 같이 뽑으면 사람이 기억할 일이 없다.
   */
  const cli = readFileSync(join(import.meta.dirname, '..', 'cli.ts'), 'utf8');

  it('수집이 캡처를 읽은 뒤 곧바로 뽑는다', () => {
    const i = cli.indexOf('importCaptures(dir,');
    const j = cli.indexOf('writeDisclosure(dir)');
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
  });
});
