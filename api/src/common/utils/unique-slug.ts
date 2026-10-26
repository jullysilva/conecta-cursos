import { slugify } from './slugify.js';

/** Builds a slug from `title`, appending -2, -3... until `exists` returns false. */
export async function uniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title) || 'item';
  let slug = base;
  for (let suffix = 2; await exists(slug); suffix++) slug = `${base}-${suffix}`;
  return slug;
}
