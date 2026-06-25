import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname);

function readSourceFiles(relativeDir: string): Array<{ file: string; source: string }> {
  const dir = path.join(SRC_ROOT, relativeDir);
  const files: Array<{ file: string; source: string }> = [];

  function visit(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (entry.isFile() && fullPath.endsWith('.ts') && !fullPath.endsWith('.test.ts')) {
        files.push({ file: path.relative(SRC_ROOT, fullPath), source: fs.readFileSync(fullPath, 'utf8') });
      }
    }
  }

  visit(dir);
  return files;
}

describe('Clean Architecture boundaries', () => {
  it('keeps domain independent from frameworks, infrastructure and environment', () => {
    const forbidden = [
      'express',
      '@prisma/client',
      'bcrypt',
      'jsonwebtoken',
      'multer',
      "from 'fs",
      'process.',
      'Sentry',
    ];

    for (const { file, source } of readSourceFiles('domain')) {
      for (const token of forbidden) {
        expect(source, `${file} must not contain ${token}`).not.toContain(token);
      }
    }
  });

  it('keeps application independent from HTTP, ORM and filesystem details', () => {
    const forbidden = [
      'express',
      '@prisma/client',
      'bcrypt',
      'jsonwebtoken',
      'multer',
      "from 'fs",
      'process.',
      'Sentry',
    ];

    for (const { file, source } of readSourceFiles('application')) {
      for (const token of forbidden) {
        expect(source, `${file} must not contain ${token}`).not.toContain(token);
      }
    }
  });

  it('keeps HTTP adapters away from direct Prisma access', () => {
    for (const { file, source } of readSourceFiles('interfaces/http')) {
      expect(source, `${file} must not import Prisma`).not.toContain('@prisma/client');
      expect(source, `${file} must not import Prisma client`).not.toContain('prisma-client');
    }
  });
});
