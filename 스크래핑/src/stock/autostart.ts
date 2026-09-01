/**
 * `stock:watch` 를 WSL 재시작마다 사람이 다시 켜지 않게 한다.
 *
 * 두 겹이 필요하다. 재부팅하면 **둘 다** 필요하다는 게 핵심이다.
 *
 *   1. WSL 안: systemd 사용자 서비스가 감시를 띄운다 (여기서 만든다)
 *   2. 윈도우: WSL 자체를 로그온 때 띄운다 (작업 스케줄러 — 사람이 한 번 등록)
 *
 * 2번이 없으면 1번은 소용없다. WSL 은 터미널을 열기 전까지 아예 뜨지 않기 때문이다.
 * 이걸 빼먹으면 "서비스는 등록했는데 안 돈다" 가 된다.
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const SERVICE_NAME = 'ricky-stock-watch.service';

export function unitFile(opts: { cwd: string; node: string; tsx: string; everySec: number }): string {
  return `[Unit]
Description=RICKY 재고 감시 — 수집 파일이 떨어지면 파이프라인을 돌린다
After=default.target

[Service]
Type=simple
WorkingDirectory=${opts.cwd}
ExecStart=${opts.node} ${opts.tsx} src/cli.ts watch --every=${opts.everySec}
# 크롬이 꺼져 있거나 수집이 없으면 그냥 조용히 돈다. 죽으면 다시 띄운다.
Restart=always
RestartSec=30
# systemctl stop 은 SIGTERM 이다. 이걸 실패로 기록하면 status 가 failed 로 남아
# 사람이 상태를 볼 때마다 뭔가 깨진 줄 안다.
SuccessExitStatus=143 SIGTERM
StandardOutput=append:${opts.cwd}/data/watch.log
StandardError=append:${opts.cwd}/data/watch.log

[Install]
WantedBy=default.target
`;
}

/** 로그온 때 WSL 을 띄우는 스크립트. 시작프로그램 폴더에 넣는다. */
export function logonScript(distro: string): string {
  /*
   * 작업 스케줄러(`schtasks /sc onlogon`)를 쓰지 않는다 — **관리자 권한을 요구한다.**
   * 실측: `/rl highest` 를 빼도 onlogon 트리거 자체가 "액세스가 거부되었습니다" 로 막힌다.
   * 시작프로그램 폴더는 사용자 소유라 권한이 필요 없다.
   *
   * `.cmd` 가 아니라 `.vbs` 인 이유 — cmd 는 콘솔 창이 번쩍인다. Run 의 세 번째 인자
   * 앞 `0` 이 창을 아예 띄우지 않는다.
   *
   * WSL 만 띄운다. 감시 명령을 여기서 직접 부르면 그 프로세스가 로그온 세션에 묶여
   * 죽을 때 같이 죽는다. WSL 이 뜨면 systemd 가 이어서 서비스를 올린다.
   */
  return [
    "' RICKY - WSL only. Starts the WSL VM at logon so the stock watcher (systemd) comes up.",
    "' Window style 0 = hidden. No console window appears.",
    "' To remove: delete this file.",
    `CreateObject("WScript.Shell").Run "wsl.exe -d ${distro} -- true", 0, False`,
  ].join('\r\n');
}

/** 윈도우 시작프로그램 폴더. WSL 에서는 /mnt/c 로 보인다. */
export function startupDir(winUser: string): string {
  return `/mnt/c/Users/${winUser}/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup`;
}

export const LOGON_SCRIPT_NAME = 'ricky-wsl.vbs';

/**
 * 로그온 스크립트를 시작프로그램 폴더에 넣는다.
 *
 * 윈도우 사용자명은 리눅스 쪽과 다를 수 있어(실제로 다르다: kjw921030 / kjw92)
 * `/mnt/c/Users` 를 훑어 시작프로그램 폴더가 있는 계정을 찾는다.
 * 찾지 못하면 `null` — WSL 이 아니거나 경로가 다르다.
 */
export async function installLogonScript(distro: string): Promise<string | null> {
  let users: string[];
  try {
    users = await readdir('/mnt/c/Users');
  } catch {
    return null;
  }

  for (const user of users) {
    const dir = startupDir(user);
    try {
      await stat(dir);
    } catch {
      continue;
    }
    const path = join(dir, LOGON_SCRIPT_NAME);
    // 윈도우 스크립트라 줄바꿈은 CRLF 로 둔다.
    await writeFile(path, logonScript(distro), 'utf8');
    return path;
  }
  return null;
}

export async function installService(opts: {
  cwd: string;
  node: string;
  tsx: string;
  everySec: number;
}): Promise<string> {
  const dir = join(homedir(), '.config', 'systemd', 'user');
  await mkdir(dir, { recursive: true });
  const path = join(dir, SERVICE_NAME);
  await writeFile(path, unitFile(opts), 'utf8');
  await run('systemctl', ['--user', 'daemon-reload']);
  return path;
}

/** 로그인 세션이 없어도 사용자 서비스가 돌게 한다. 이게 없으면 터미널을 닫을 때 죽는다. */
export async function lingerEnabled(user: string): Promise<boolean> {
  try {
    const { stdout } = await run('loginctl', ['show-user', user, '-p', 'Linger']);
    return stdout.trim() === 'Linger=yes';
  } catch {
    return false;
  }
}
