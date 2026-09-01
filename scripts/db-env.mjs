/**
 * 스크립트에서 Supabase 에 붙기 위한 공용 부품.
 *
 * Next.js 는 `.env.local` 을 알아서 읽어 주지만 `node scripts/...` 는 아니다.
 * 이것 하나 때문에 dotenv 를 의존성에 넣을 이유는 없어서 직접 읽는다.
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 프로젝트 경로에 한글이 포함되므로 URL.pathname(퍼센트 인코딩) 대신 fileURLToPath 를 쓴다
export const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** 이미 들어 있는 환경변수를 덮지 않는다 — CI 나 셸에서 준 값이 우선이다. */
export async function loadEnv() {
  for (const name of ['.env', '.env.local']) {
    let text;
    try {
      text = await readFile(join(ROOT, name), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m) continue;
      if (process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`환경변수 ${name} 이 없다. .env.local 에 넣어라.`);
    process.exit(1);
  }
  return v;
}

/**
 * service_role 클라이언트. **RLS 를 우회한다.**
 * CLAUDE.md 가 허용한 신뢰된 서버 경로(크롤러 워커·시드)에서만 쓴다.
 * 키를 로그에 남기지 않는다.
 */
export function adminClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );
}

/**
 * DB 에 닿지 못한 이유를 분명히 말한다.
 * `fetch failed` 만 던지면 키가 틀린 건지 프로젝트가 없는 건지 알 수 없다.
 */
export function dbUnreachable(what, err) {
  console.error(`\n${what} 실패: ${err.message ?? err}`);
  if (String(err.message ?? err).includes('fetch failed')) {
    console.error('  Supabase 프로젝트 URL 이 맞는지, 프로젝트가 일시정지 상태는 아닌지 확인해라.');
  }
  process.exit(1);
}
