import { toSlug } from '@shared/utils/slug.utils';

export function careerProfileSlug(name: string, id: string): string {
  return `${toSlug(name)}-${id}`;
}

export function careerProfileId(slug: string): string {
  // Fantrax entity IDs are the final, hyphen-free segment; names are descriptive.
  return slug.slice(slug.lastIndexOf('-') + 1);
}
