import { badRequest } from '../../domain/shared/errors';

export const CENTER_NAME_MAX_LENGTH = 191;
export const CENTER_SLUG_MAX_LENGTH = 60;

export function normalizeCenterName(raw: string | undefined): string {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (name.length < 2) throw badRequest('El nombre del centro es obligatorio', ['name']);
  if (name.length > CENTER_NAME_MAX_LENGTH) {
    throw badRequest(`El nombre del centro no puede superar ${CENTER_NAME_MAX_LENGTH} caracteres`, ['name']);
  }
  return name;
}

function trimHyphens(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === '-') start += 1;
  while (end > start && value[end - 1] === '-') end -= 1;
  return value.slice(start, end);
}

/** URL-safe identifier: lowercase, no accents, words joined by hyphens. */
export function slugify(value: string): string {
  const hyphenated = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return trimHyphens(trimHyphens(hyphenated).slice(0, CENTER_SLUG_MAX_LENGTH));
}

export function resolveCenterSlug(name: string, requested?: string): string {
  const slug = slugify(requested ?? name);
  if (!slug) throw badRequest('No se pudo generar un identificador para el centro; indica uno con --slug', ['slug']);
  return slug;
}
