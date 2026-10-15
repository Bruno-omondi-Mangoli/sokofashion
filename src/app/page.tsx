import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">SokoFashion is under construction</h1>
      <div className="flex gap-6">
        <Link href="/signup" className="underline">
          Create an account
        </Link>
        <Link href="/login" className="underline">
          Log in
        </Link>
      </div>
    </main>
  );
}
