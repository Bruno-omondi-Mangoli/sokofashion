'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AuthShell } from '@/components/ui/auth-shell';
import { Button, linkClasses } from '@/components/ui/button';

/*
 * Shown when a page fails unexpectedly. It never shows the technical message,
 * because that can contain details that help an attacker. Only the short
 * reference code is logged.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('page error', { digest: error.digest });
  }, [error]);

  return (
    <AuthShell
      title="Something went wrong"
      intro="We could not load this page. Your data is safe. Check your connection and try again."
    >
      <Button type="button" onClick={reset} className="w-full">
        Try again
      </Button>
      <Link href="/dashboard" className={`${linkClasses} inline-flex min-h-11 items-center`}>
        Go to your dashboard
      </Link>
    </AuthShell>
  );
}
