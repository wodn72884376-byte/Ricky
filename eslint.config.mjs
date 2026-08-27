import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 스크래핑/은 자체 tsconfig·자체 린트 설정을 가진 별도 패키지다 (ricky-sourcing)
    "스크래핑/**",
    ".omd/**",
  ]),
]);

export default eslintConfig;
