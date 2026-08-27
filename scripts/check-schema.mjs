/**
 * 마이그레이션 SQL을 PGlite(WASM Postgres)에서 실제로 실행해 문법/제약을 검증한다.
 * Supabase 고유 객체(auth 스키마, auth.uid(), anon/authenticated 롤)는 shim으로 대체한다.
 * 사용: npm run db:check
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 프로젝트 경로에 한글이 포함되므로 URL.pathname(퍼센트 인코딩) 대신 fileURLToPath를 쓴다
const MIGRATIONS_DIR = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));

const SUPABASE_SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  end $$;
`;

const db = new PGlite({ extensions: { pgcrypto } });
await db.exec('create extension if not exists "pgcrypto";');
await db.exec(SUPABASE_SHIM);

const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
for (const file of files) {
  const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
  try {
    await db.exec(sql);
    console.log(`  ok  ${file}`);
  } catch (err) {
    console.error(`  FAIL ${file}`);
    console.error(`       ${err.message}`);
    if (err.query) console.error(`       query: ${String(err.query).slice(0, 200)}`);
    process.exit(1);
  }
}

const { rows: tables } = await db.query(`
  select tablename from pg_tables where schemaname = 'public' order by tablename
`);
const { rows: policies } = await db.query(`select count(*)::int as n from pg_policies where schemaname='public'`);
const { rows: settings } = await db.query(`select key from settings order by key`);

console.log(`\n테이블 ${tables.length}개: ${tables.map((t) => t.tablename).join(', ')}`);
console.log(`RLS 정책 ${policies[0].n}개`);
console.log(`설정 키: ${settings.map((s) => s.key).join(', ')}`);
await db.close();
