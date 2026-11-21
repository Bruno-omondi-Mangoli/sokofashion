import type { PublicVariant } from './schemas';

export const STALL_TONES = ['indigo', 'marigold', 'hibiscus', 'teal'] as const;
export type StallTone = (typeof STALL_TONES)[number];

/* Which token is the awning and which is the text on it. A test checks every pair. */
export const STALL_COLOURS: Record<StallTone, { bg: string; text: string }> = {
  indigo: { bg: 'primary', text: 'on-primary' },
  marigold: { bg: 'marigold', text: 'ink' },
  hibiscus: { bg: 'hibiscus', text: 'paper' },
  teal: { bg: 'teal', text: 'paper' },
};

/* The same shop link always gives the same awning colour, and no setting is stored */
export function stallTone(slug: string): StallTone {
  let sum = 0;
  for (let index = 0; index < slug.length; index += 1) {
    sum = (sum * 31 + slug.charCodeAt(index)) % 9973;
  }
  return STALL_TONES[sum % STALL_TONES.length];
}

export const THREAD_KEYS = [
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'pink',
  'purple',
  'brown',
  'beige',
  'grey',
  'black',
  'white',
  'other',
] as const;
export type ThreadKey = (typeof THREAD_KEYS)[number];

const THREAD_RULES: Array<[RegExp, ThreadKey]> = [
  [/(red|maroon|burgundy|wine|crimson)/, 'red'],
  [/(navy|blue|denim)/, 'blue'],
  [/(green|olive|mint|khaki)/, 'green'],
  [/(yellow|gold|mustard)/, 'yellow'],
  [/(orange|rust|terracotta)/, 'orange'],
  [/(pink|rose|fuchsia|blush)/, 'pink'],
  [/(purple|violet|lilac|plum)/, 'purple'],
  [/(brown|chocolate|coffee)/, 'brown'],
  [/(beige|cream|nude|sand)/, 'beige'],
  [/(grey|gray|silver)/, 'grey'],
  [/(black)/, 'black'],
  [/(white|ivory)/, 'white'],
];

/* A fixed lookup, so seller text never reaches a style. Unknown names get the neutral dot. */
export function threadKey(colourName: string): ThreadKey {
  const text = colourName.toLowerCase();
  for (const [pattern, key] of THREAD_RULES) {
    if (pattern.test(text)) {
      return key;
    }
  }
  return 'other';
}

export type ThreadColour = { label: string; key: ThreadKey };

/* Each different colour once, in the order the seller created them */
export function uniqueColours(variants: PublicVariant[]): ThreadColour[] {
  const seen = new Set<string>();
  const colours: ThreadColour[] = [];
  for (const variant of variants) {
    const label = variant.colour?.trim();
    if (!label || seen.has(label.toLowerCase())) {
      continue;
    }
    seen.add(label.toLowerCase());
    colours.push({ label, key: threadKey(label) });
  }
  return colours;
}
