import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type TranslationTree = Record<string, unknown>;

const fiTranslations = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/i18n/fi.json'), 'utf8'),
) as TranslationTree;

export function fi(path: string): string {
  const value = path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      throw new Error(`Missing fi translation path: ${path}`);
    }

    if (!(segment in current)) {
      throw new Error(`Missing fi translation path: ${path}`);
    }

    return (current as TranslationTree)[segment];
  }, fiTranslations);

  if (typeof value !== 'string') {
    throw new Error(`Fi translation path does not resolve to a string: ${path}`);
  }

  return value;
}
