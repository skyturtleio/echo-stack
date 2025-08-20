//  @ts-check
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginRouter from "@tanstack/eslint-plugin-router"

export default tseslint.config(
  {
    ignores: [
      // Build outputs
      ".output/**",
      ".nitro/**",
      ".tanstack/**",
      "dist/**",
      "build/**",
      // Dependencies
      "node_modules/**",
      // Generated files
      "*.config.js.timestamp-*",
      ".env*",
      // Lock files
      "bun.lockb",
      "*.lock",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...pluginRouter.configs["flat/recommended"],
)
