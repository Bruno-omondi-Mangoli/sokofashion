import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * This rule connects Tailwind CSS to Next.js. Without it no styling is
   * applied at all. Never remove it. The test in src/config guards it.
   */
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
