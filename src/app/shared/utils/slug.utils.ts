/**
 * Converts a name to a URL-friendly slug.
 * Example: "Jamie Benn" → "jamie-benn", "Patrik Lainé" → "patrik-laine"
 */
export function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Checks if a name matches a given slug.
 */
export function matchesSlug(name: string, slug: string): boolean {
  return toSlug(name) === slug;
}
