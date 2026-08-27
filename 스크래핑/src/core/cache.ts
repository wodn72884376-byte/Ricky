/**
 * 파일 기반 HTTP 응답 캐시.
 * 개발 중 같은 페이지를 반복 요청하지 않는 것이 가장 확실한 "정중한 크롤링"이다.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { runtime } from '../config/runtime.ts';

// 프로젝트 경로에 한글이 포함된다 → new URL().pathname 대신 fileURLToPath (CLAUDE.md 코드 컨벤션)
const CACHE_DIR = fileURLToPath(runtime.paths.cache);

const keyOf = (url: string, salt = '') =>
  createHash('sha1').update(`${url} ${salt}`).digest('hex').slice(0, 32);

export async function readCache(url: string, salt = ''): Promise<string | null> {
  const file = join(CACHE_DIR, `${keyOf(url, salt)}.txt`);
  try {
    const s = await stat(file);
    if (Date.now() - s.mtimeMs > runtime.cacheTtlMs) return null;
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

export async function writeCache(url: string, body: string, salt = ''): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(join(CACHE_DIR, `${keyOf(url, salt)}.txt`), body, 'utf8');
}
