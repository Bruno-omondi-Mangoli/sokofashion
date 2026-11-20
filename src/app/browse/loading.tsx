import { Pindo } from '@/components/ui/pindo';
import { Skeleton } from '@/components/ui/skeleton';

/* Shown at once while the shared page loads, so a slow connection never meets a blank screen */
export default function BrowseLoading() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true">
      <Pindo />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-5 py-8">
        <p role="status" className="sr-only">
          Loading
        </p>
        <Skeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </main>
    </div>
  );
}
