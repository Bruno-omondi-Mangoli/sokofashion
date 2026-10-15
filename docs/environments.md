# Environments

SokoFashion runs in three environments. Each has its own database and its own settings.

## Local

- Runs on the developer laptop in Docker, started with `npm run db:start`.
- Holds throwaway data. Safe to wipe with `npm run db:reset`.
- Keys printed by the local Supabase stack belong to the laptop only.

## Staging

- A Supabase cloud project named sokofashion-staging on the free plan.
- A rehearsal stage. New migrations are pushed here before anything else.
- Holds fake data only. Never put real customer or seller data in staging.

## Production

- A separate Supabase cloud project, created before the pilot with real shops.
- Receives the same migration files as staging, in the same order, after they have worked on staging.
- Needs paid plans before any shop pays the platform, as decided in D013.

## How a database change travels

1. Write a new migration file locally. Never edit an old one.
2. Run `npm run db:reset` and `npm run db:test` on the laptop.
3. Open a pull request. Both CI checks must be green.
4. Merge the pull request and run `git switch main` then `git pull`.
5. Push to staging with `npx supabase db push`.
6. Check staging in the dashboard.
7. Later, push the same migrations to production.

## Secrets

- The database password and the service role key are secrets. They live in the password manager and in the host's secret store, never in Git, never in chat.
- The anon key (publishable key) is meant to be public. It is safe only because Row Level Security protects every table.
- No environment variable holding a secret may start with NEXT*PUBLIC*.

## Free plan limits to remember

- Supabase free projects pause after about a week without activity, and have no automatic backups.
- The free plan allows two active projects, which is why only staging and production exist.
