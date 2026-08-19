import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Match the file scope of eslint-config-next's "next" config object,
    // which is what registers the react-hooks plugin these rules need.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Migrated from .eslintignore:
    "node_modules/**",
    "dist/**",
    "src/presentation/components/ui/**",
    "**/*.js",
    // Node maintenance scripts (CommonJS by design).
    "scripts/**/*.cjs",
  ]),
]);

export default eslintConfig;
