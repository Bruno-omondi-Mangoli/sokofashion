export const TALLY_MAX = 15;

/*
 * Tally marks come in groups of five: four bars and a strike across them.
 * This gives the size of each group, so 7 becomes [5, 2]. The count shown is capped.
 */
export function tallyGroups(count: number): number[] {
  const shown = Math.min(Math.max(Math.floor(count), 0), TALLY_MAX);
  const groups: number[] = [];
  let left = shown;
  while (left > 0) {
    groups.push(Math.min(5, left));
    left -= 5;
  }
  return groups;
}
