export type UjumbeText = {
  saying: string;
  meaning: string;
};

/*
 * A short Swahili saying with its English meaning, like the message printed on
 * a kanga. Used on quiet moments such as empty screens, never in the way.
 */
export function Ujumbe({ saying, meaning }: UjumbeText) {
  return (
    <figure className="border-hairline border-t-2 border-dotted pt-4">
      <blockquote lang="sw" className="font-display text-ink text-lg">
        {saying}
      </blockquote>
      <figcaption className="text-ink-soft mt-1 text-sm">{meaning}</figcaption>
    </figure>
  );
}
