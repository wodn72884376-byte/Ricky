import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// 프로젝트 경로에 한글이 포함된다 → fileURLToPath (CLAUDE.md 코드 컨벤션)
const appSrc = fileURLToPath(new URL('../src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@app\/(.*)$/, replacement: `${appSrc}/$1` },
      { find: /^@\/(.*)$/, replacement: `${appSrc}/$1` },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
