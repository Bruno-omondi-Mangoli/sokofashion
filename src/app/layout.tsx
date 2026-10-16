import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Young_Serif } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

/*
 * Young Serif is a warm, sturdy display face that stays readable at heading
 * sizes on small screens. Atkinson Hyperlegible Next was designed for
 * legibility, which suits cheap phones, sunlight and tired eyes.
 * Both are downloaded at build time and served from our own site.
 */
const display = Young_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-young-serif',
});

const body = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  variable: '--font-atkinson',
});

export const metadata: Metadata = {
  title: { default: 'SokoFashion', template: '%s | SokoFashion' },
  description:
    'One shop link for sellers of clothes, shoes and bags. Share it on WhatsApp and keep every order in one place.',
};

export const viewport: Viewport = {
  themeColor: '#2a2e7a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-sand text-ink min-h-dvh antialiased">{children}</body>
    </html>
  );
}
