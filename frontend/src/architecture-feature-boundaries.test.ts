import { describe, expect, it } from 'vitest';

const sourceModules = import.meta.glob('./**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function sourceFilesUnder(prefix: string) {
  return Object.entries(sourceModules)
    .filter(([file]) => file.startsWith(`./${prefix}`))
    .filter(([file]) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
    .map(([file, source]) => ({ file, source }));
}

describe('Frontend feature architecture boundaries', () => {
  it('keeps app, shared and features as explicit top-level modules', () => {
    expect(sourceFilesUnder('app').length).toBeGreaterThan(0);
    expect(sourceFilesUnder('shared').length).toBeGreaterThan(0);
    expect(sourceFilesUnder('features').length).toBeGreaterThan(0);
  });

  it('keeps shared independent from feature and app modules', () => {
    for (const { file, source } of sourceFilesUnder('shared')) {
      expect(source, `${file} must not import features`).not.toContain('@features/');
      expect(source, `${file} must not import app`).not.toContain('@app/');
    }
  });

  it('keeps feature modules away from app-level imports', () => {
    for (const { file, source } of sourceFilesUnder('features')) {
      expect(source, `${file} must not import app`).not.toContain('@app/');
    }
  });

  it('keeps legacy flat frontend folders out of imports', () => {
    const forbiddenImports = [
      "from './api",
      "from './components",
      "from './config",
      "from './hooks",
      "from './pages",
      "from './store",
      "from './theme",
      "from './types",
      "from './utils",
      "from '../api",
      "from '../components",
      "from '../config",
      "from '../hooks",
      "from '../pages",
      "from '../store",
      "from '../theme",
      "from '../types",
      "from '../utils",
    ];

    for (const { file, source } of sourceFilesUnder('')) {
      for (const forbiddenImport of forbiddenImports) {
        expect(source, `${file} must not import ${forbiddenImport}`).not.toContain(forbiddenImport);
      }
    }
  });
});
