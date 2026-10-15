# Progress Tracker

Last updated: 14 October 2026
Current phase: Phase 2 (Multi-tenant database, roles, RLS with isolation tests)
Current chunk: Chunk 7, pilot user stories and success metrics (awaiting verification and interviews)
Next chunk: Chunk 8, shops, shop_members and roles tables with RLS
After that: Chunk 9, isolation tests that try to break Row Level Security

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interviews
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: in progress
Phase 3: Authentication, seller onboarding, shop creation: not started
Phase 4: Products, variants, images, stock ledger: not started
Phase 5: Public storefront, cart, checkout: not started
Phase 6: Seller payment recording and confirmation, provider interface: not started
Phase 7: Orders, delivery, digital receipts, notifications: not started
Phase 8: Shop ledger, expenses, customer debts, reports: not started
Phase 9: Anti-theft and staff control module: not started
Phase 10: Subscription billing, platform admin, trust and safety: not started
Phase 11: Hardening: security, performance, accessibility, backups, monitoring: not started
Phase 12: Legal, compliance, pilot launch with 5 shops: not started
Phase 13: Feedback, pricing validation, iteration, marketplace planning: not started

## MVP v1 scope

Phases 0 to 8, trimmed Phase 11, Phase 12. Manual subscription handling. Anti-theft (Phase 9) and automated billing (Phase 10) are v1.1.

## Working pace

30 to 40 hours per week. Estimate: MVP v1 in 3 to 4 months, full product in 5 to 6 months.

## Budget rule

Zero spend until the pilot is complete (D013, D014). Upgrade Vercel and Supabase before any shop pays real money. Enable GitHub branch protection before the pilot launches.

## Pilot shops

5 friends selling women's clothes, shoes and handbags. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Some have one staff member, at least one works alone (exact numbers to confirm). Storefront must show products from several angles.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind, ESLint, Prettier: done
- Husky, lint-staged, commitlint, GitHub Actions CI (job name Checks), Dependabot: done and green
- Zod, server-only, env validators, Vitest with 11 tests: done
- Docker Desktop (WSL 2, memory capped at 6 GB), Supabase CLI as a dev dependency: done
- Local Supabase database with countries table and RLS: done and verified
- GitHub Pro: not purchased, deferred to pilot stage

## Machine

Windows 11 Pro, 16 GB RAM, Ryzen 7 Pro, SSD with 200 GB free. Virtualization enabled.

## Key facts from the build

Repository URL: https://github.com/Bruno-omondi-Mangoli/sokofashion
Local Studio: http://127.0.0.1:54323
Supabase cloud project names:
Vercel project:
Domain:

## Useful commands

npm run check : typecheck, lint, format check, tests and build in one go
npm run db:start, db:stop, db:reset, db:status : local database controls
Rule: never merge a pull request unless Checks is green.
Rule: change the database only through new migration files.
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Exact number of pilot shops with staff
- Answers to the nine pilot interview questions
- Confirm Pochi la Biashara details and currency decimal places in later chunks

## Notes for the next chat

Chunk 7 delivered: docs/project/pilot-and-user-stories.md with shop profile, stories, success numbers and interview questions. New fact: Pochi la Biashara and cash must be supported (D017). Next is the shops, shop_members and roles tables with RLS, then isolation tests.
