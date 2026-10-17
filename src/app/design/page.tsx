import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pindo } from '@/components/ui/pindo';
import { Skeleton } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/cn';
import { serverEnv } from '@/lib/env/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Design guide',
  robots: { index: false },
};

const swatches = [
  { name: 'Paper', use: 'Cards and fields', bg: 'bg-paper', text: 'text-ink' },
  { name: 'Sand', use: 'Page background', bg: 'bg-sand', text: 'text-ink' },
  { name: 'Ink', use: 'Main text', bg: 'bg-ink', text: 'text-paper' },
  {
    name: 'Ink soft',
    use: 'Secondary text',
    bg: 'bg-ink-soft',
    text: 'text-paper',
  },
  {
    name: 'Primary',
    use: 'Main actions',
    bg: 'bg-primary',
    text: 'text-on-primary',
  },
  { name: 'Marigold', use: 'Highlights', bg: 'bg-marigold', text: 'text-ink' },
  { name: 'Hibiscus', use: 'Accent', bg: 'bg-hibiscus', text: 'text-paper' },
  { name: 'Teal', use: 'Accent', bg: 'bg-teal', text: 'text-paper' },
  { name: 'Danger', use: 'Errors', bg: 'bg-danger', text: 'text-paper' },
  {
    name: 'Success',
    use: 'Confirmations',
    bg: 'bg-success',
    text: 'text-paper',
  },
];

/* A living style guide for building screens. It is hidden in production. */
export default function DesignPage() {
  if (serverEnv.APP_ENV === 'production') {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-display text-ink">Design guide</h1>
          <p className="text-ink-soft text-base">
            Every colour, type style and component used to build SokoFashion screens.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Colours</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {swatches.map((swatch) => (
              <li
                key={swatch.name}
                className={cn('border-hairline rounded-xl border p-3', swatch.bg, swatch.text)}
              >
                <p className="text-base font-semibold">{swatch.name}</p>
                <p className="text-sm">{swatch.use}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-title">Type</h2>
          <p className="font-display text-display">Display heading</p>
          <p className="font-display text-title">Title heading</p>
          <p className="text-lg">Large body text for introductions.</p>
          <p className="text-base">
            Body text for everything else. Clear on a small, bright screen.
          </p>
          <p className="text-ink-soft text-sm">Small supporting text for hints and details.</p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Buttons</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="primary">Save changes</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="accent">Share to WhatsApp</Button>
            <Button variant="primary" disabled>
              Please wait
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Fields</h2>
          <TextField
            label="Shop name"
            name="demo-name"
            hint="Customers see this at the top of your shop."
          />
          <TextField
            label="Link name"
            name="demo-slug"
            defaultValue="admin"
            error="That link name is not available. Try another one."
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Messages</h2>
          <Alert tone="success">Your product is saved.</Alert>
          <Alert tone="error">That did not work. Check your connection and try again.</Alert>
          <Alert tone="info">Your free plan includes 20 products.</Alert>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Labels and cards</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="owner">Owner</Badge>
            <Badge tone="manager">Manager</Badge>
            <Badge tone="attendant">Attendant</Badge>
            <Badge tone="muted">Access removed</Badge>
          </div>
          <Card>
            <p className="text-base font-semibold">A card groups related content.</p>
            <p className="text-ink-soft text-sm">Use one card per shop, person or order.</p>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Empty state</h2>
          <EmptyState
            title="No products yet"
            description="Add your first product with a photo, a price and the sizes you have."
            action={<Button variant="primary">Add a product</Button>}
            saying={{
              saying: 'Haba na haba hujaza kibaba.',
              meaning: 'Little by little fills the measure.',
            }}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-title">Loading</h2>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </section>
      </main>
    </div>
  );
}
