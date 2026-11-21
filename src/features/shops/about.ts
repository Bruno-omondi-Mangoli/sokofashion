export const ABOUT_MAX = 500;

/* Browsers send line breaks as two characters. This makes them one, and trims the ends. */
export function cleanAbout(text: string): string {
  return text.replace(/\r\n?/g, '\n').trim();
}

export function aboutTooLong(text: string): boolean {
  return cleanAbout(text).length > ABOUT_MAX;
}
