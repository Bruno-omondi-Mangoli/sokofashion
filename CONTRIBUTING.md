# Contributing

## Workflow

1. Start from an up to date main branch: `git switch main` then `git pull`.
2. Create a branch named for the work, for example `feat/product-form` or `fix/stock-count`.
3. Make small commits using Conventional Commits, for example `feat: add product form`.
4. Run `npm run check` before pushing.
5. Push the branch and open a pull request.
6. Merge only when the Checks status is green.

## Commit types

feat, fix, docs, refactor, test, chore, ci, build.

## Rules

- Never commit secrets. Real values live in `.env.local` only.
- Every database change is a versioned migration, never an edit in the dashboard.
- Every table that belongs to a shop carries a shop_id and Row Level Security.
- Money is stored as whole numbers in the smallest unit, with a currency code.
- Sales, payments and stock records are append only. Corrections are reversing entries.
- No emojis. No double dashes or em dashes as punctuation in code, comments or documents.
