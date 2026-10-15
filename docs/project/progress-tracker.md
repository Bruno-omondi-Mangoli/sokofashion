# Progress Tracker

Last updated: 15 October 2026
Current phase: Phase 2 (Multi-tenant database, roles, RLS with isolation tests)
Current chunk: Chunk 8, shops, shop_members and roles (awaiting verification)
Next chunk: Chunk 9, automated isolation tests that try to break Row Level Security, and a check that every public table has RLS
After that: Chunk 10, run database tests in CI, then Phase 3 authentication

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
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

Phases 0 to 8, trimmed Phase 11, Phase 12. Manual subscription handling. Anti-theft (Phase 9) and automated billing (Phase 10) are v1.1. Because all five pilot shops have staff, a basic staff invitation and roles flow is pulled forward into Phase 3.

## Working pace

30 to 40 hours per week. Estimate: MVP v1 in 3 to 4 months, full product in 5 to 6 months.

## Budget rule

Zero spend until the pilot is complete (D013, D014). Upgrade Vercel and Supabase before any shop pays real money. Enable GitHub branch protection before the pilot launches.

## Pilot shops

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Storefront must show products from several angles.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind, ESLint, Prettier: done
- Husky, lint-staged, commitlint, GitHub Actions CI (job name Checks), Dependabot: done and green
- Zod, server-only, env validators, Vitest with 11 tests: done
- Docker Desktop (WSL 2, memory capped at 6 GB), Supabase CLI as a dev dependency: done
- Local database: countries table, shops and shop_members tables, helper functions, create_shop function, all with RLS: added in Chunk 8
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
Rule: create files in Git Bash with touch or mkdir, write content in VS Code.
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the nine pilot interview questions
- Confirm Pochi la Biashara details and currency decimal places in later chunks
- Rate limiting for create_shop (Phase 3)

## Notes for the next chat

Chunk 8 delivered: shop_role and shop_status enums, shops and shop_members tables, is_shop_member, has_shop_role and create_shop functions, strict grants, RLS policies. No insert, update or delete on shop_members through the API yet. Next are automated isolation tests (pgTAP via supabase test db), then running them in CI.
