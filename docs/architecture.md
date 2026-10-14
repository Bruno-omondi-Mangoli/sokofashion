# Architecture overview

## Shape of the system

One Next.js application serves the public storefronts, the seller dashboard and the platform admin area. Supabase provides the Postgres database, login, file storage and Row Level Security. Vercel hosts the application.

## Multi-tenancy

Many shops share one database. Every table that belongs to a shop has a shop_id column. Row Level Security rules in the database decide which rows each logged in user may read or change, so a user in one shop can never see another shop's data even if application code has a bug. Isolation is covered by automated tests that try to break it.

## Money

Amounts are whole numbers in the smallest sensible unit, with a currency code stored next to every amount. Floating point numbers are never used for money.

## Append only records

Sales, payments and inventory movements are never edited or deleted. A correction is a new reversing entry. Stock on hand is calculated from the stock movement records.

## Payments

Buyers pay the seller directly. The platform never holds, pools or pays out seller money. The platform collects only its own subscription fees through a single platform account. Payment and notification providers sit behind interfaces so new networks and countries can be added without a rewrite.

## Environments

Local, staging and production, each with its own Supabase project and its own environment variables. Secrets are never committed.

## Quality gates

Type check, lint, format check and build run locally on commit through Husky and on every pull request through GitHub Actions.
