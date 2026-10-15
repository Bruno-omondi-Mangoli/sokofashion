const MAX_SLUG_LENGTH = 40;

/*
 * Turns a shop name into a suggested link name. Accents are removed, anything
 * that is not a letter or number becomes a single hyphen, and the result is cut
 * to the database limit without leaving a hyphen at the end.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}
