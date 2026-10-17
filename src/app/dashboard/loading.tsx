import { Pindo } from '@/components/ui/pindo';
import { Skeleton } from '@/components/ui/skeleton';

/* Shown at once while a dashboard page loads, so a slow connection never meets a blank screen */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-8">
        <p role="status" className="sr-only">
          Loading
        </p>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </main>
    </div>
  );
}
