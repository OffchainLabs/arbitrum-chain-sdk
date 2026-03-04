import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['node_modules/**', 'src/dist/**', 'coverage/**'],
  },
  ...tseslint.configs.recommended,
)
