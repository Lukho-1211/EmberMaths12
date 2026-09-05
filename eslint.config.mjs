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
    // Local Supabase CLI scratch files
    "supabase/.temp/**",
    // Vendored PDF.js worker (copied from pdfjs-dist/legacy)
    "public/**/*.min.mjs",
    "public/**/*.min.js",
  ]),
]);

export default eslintConfig;
