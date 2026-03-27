import eslint from '@eslint/js';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

const ignoreApi = 'apps/api/**';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.pnpm-store/**',
      'pnpm-lock.yaml',
      'package-lock.json',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals.map((config) => ({
    ...config,
    ignores: [...(config.ignores ?? []), ignoreApi],
  })),
  ...nextTypescript.map((config) => ({
    ...config,
    ignores: [...(config.ignores ?? []), ignoreApi],
  })),
);
