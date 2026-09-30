// Single ESLint config for the whole monorepo (flat config, ESLint 10).
// Rules are layered: base for every package, then environment-specific blocks.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist/**", "**/node_modules/**", "server/src/generated/**", "server/prisma/migrations/**"]),

  // Base: all TypeScript/JavaScript files
  {
    files: ["**/*.{js,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      // Allow intentionally unused args/vars when prefixed with _ (e.g. errorHandler's _req)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Enforce `import type` for type-only imports (matches verbatimModuleSyntax)
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Backend + shared package: Node runtime
  {
    files: ["server/**/*.ts", "packages/**/*.ts", "*.js"],
    languageOptions: { globals: globals.node },
  },

  // Frontend: browser runtime + React rules
  {
    files: ["ui/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["ui/vite.config.ts"],
    languageOptions: { globals: globals.node },
  },

  // Must be last: turns off rules that conflict with Prettier formatting
  prettier,
]);
