/**
 * 마이그레이션을 실제로 실행한 인메모리 Postgres(PGlite)를 만든다.
 * Supabase 고유 객체(auth 스키마, auth.uid(), anon/authenticated 롤)는 shim으로 대체한다.
 *
 * RLS 정책 자체는 여기서 검증하지 않는다 — PGlite는 단일 슈퍼유저로 돌아서
 * 정책이 강제되지 않는다. 여기서 검증하는 것은 스키마 제약·기본값·함수의 동작이다.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 프로젝트 경로에 한글이 포함되므로 URL.pathname 대신 fileURLToPath를 쓴다
const MIGRATIONS_DIR = fileURLToPath(new URL('../../../supabase/migrations/', import.meta.url));

const SUPABASE_SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    -- 소셜 로그인이 넘겨주는 프로필. handle_new_user() 가 이걸 읽는다.
    raw_user_meta_data jsonb not null default '{}'::jsonb
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

export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec('create extension if not exists "pgcrypto";');
  await db.exec(SUPABASE_SHIM);

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await db.exec(await readFile(join(MIGRATIONS_DIR, file), 'utf8'));
  }
  return db;
}
