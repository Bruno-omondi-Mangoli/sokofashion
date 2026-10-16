/* A placeholder shown while content loads. It stops pulsing for people who prefer less motion. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-hairline animate-pulse rounded-lg motion-reduce:animate-none ${className}`}
    />
  );
}
