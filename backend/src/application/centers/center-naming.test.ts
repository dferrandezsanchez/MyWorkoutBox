import { describe, expect, it } from 'vitest';
import { normalizeCenterName, resolveCenterSlug, slugify } from './center-naming';

describe('center naming', () => {
  it('builds URL-safe slugs without accents or symbols', () => {
    expect(slugify('One Life One body')).toBe('one-life-one-body');
    expect(slugify('  Gimnasio Ñandú & Co. (Valencia)  ')).toBe('gimnasio-nandu-co-valencia');
    expect(slugify('CrossFit—Box   Nº 1')).toBe('crossfit-box-n-1');
    expect(slugify('!!!')).toBe('');
  });

  it('caps the slug length without leaving a trailing hyphen', () => {
    const slug = slugify(`${'a'.repeat(59)} bbbbbb`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('prefers an explicit slug and rejects names that cannot produce one', () => {
    expect(resolveCenterSlug('One Life One body', 'OLOB Valencia')).toBe('olob-valencia');
    expect(() => resolveCenterSlug('!!!')).toThrow('No se pudo generar un identificador');
  });

  it('normalizes and validates the center name', () => {
    expect(normalizeCenterName('  One   Life  One body ')).toBe('One Life One body');
    expect(() => normalizeCenterName('  ')).toThrow('obligatorio');
    expect(() => normalizeCenterName(undefined)).toThrow('obligatorio');
    expect(() => normalizeCenterName('x'.repeat(192))).toThrow('no puede superar');
  });
});
