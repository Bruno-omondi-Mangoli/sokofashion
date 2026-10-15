# Progress Tracker

Last updated: 15 October 2026
Current phase: Phase 3 (Authentication, seller onboarding, shop creation, staff invitations)
Current chunk: Chunk 11, Supabase account and staging project (awaiting verification)
Next chunk: Chunk 12, connect Next.js to Supabase and add sign up, log in and log out
After that: Chunk 13, onboarding and shop creation screen, Chunk 14, staff invitations

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, seller onboarding, shop creation, staff invitations: in progress
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

Phases 0 to 8, trimmed Phase 11, Phase 12. Manual subscription handling. Anti-theft (Phase 9) and automated billing (Phase 10) are v1.1. Because all five pilot shops have staff, a basic staff invitation and roles flow is in Phase 3.

## Working pace

30 to 40 hours per week. Estimate: MVP v1 in 3 to 4 months, full product in 5 to 6 months.

## Budget rule

Zero spend until the pilot is complete (D013, D014). Upgrade Vercel and Supabase before any shop pays real money. Enable GitHub branch protection before the pilot launches, requiring both Checks and Database tests.

## Pilot shops

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Storefront must show products from several angles.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind, ESLint, Prettier: done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest with 11 tests: done
- Docker Desktop (WSL 2, memory capped at 6 GB), Supabase CLI as a dev dependency: done
- Local database: countries, shops, shop_members, helper functions, create_shop, all with RLS: done
- pgTAP tests in supabase/tests/database (31 checks), run locally and in CI: done
- Bitwarden password manager: set up in Chunk 11
- Supabase account (free, signed in with GitHub) and organization SokoFashion: created in Chunk 11
- Supabase staging project sokofashion-staging, linked, migrations pushed: done in Chunk 11
- Supabase production project: not yet created (second free slot reserved)
- Vercel account and project: not yet created
- GitHub Pro: not purchased, deferred to pilot stage

## Machine

Windows 11 Pro, 16 GB RAM, Ryzen 7 Pro, SSD with 200 GB free. Virtualization enabled.

## Key facts from the build

Repository URL: https://github.com/Bruno-omondi-Mangoli/sokofashion
Local Studio: http://127.0.0.1:54323
Supabase staging project ref: (fill in your 20 letter ref)
Supabase staging region: (fill in the region you chose)
Supabase production project:
Vercel project:
Domain:
Secrets (database password, service role key) are stored only in Bitwarden. Never in Git or chat.

## Useful commands

npm run check : typecheck, lint, format check, tests and build in one go
npm run db:start, db:stop, db:reset, db:status : local database controls
npm run db:test : database security tests (needs Docker and the local database running)
npx supabase migration list : compare local and staging migrations
npx supabase db push : send merged migrations to staging (use the dry run flag first)
Rule: never merge a pull request unless both CI checks are green.
Rule: change the database only through new migration files.
Rule: create files in Git Bash with touch or mkdir, write content in VS Code.
Rule: every new shop-owned table ships with isolation tests.
Rule: staging holds fake data only.
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the nine pilot interview questions
- Confirm Pochi la Biashara details and currency decimal places in later chunks
- Rate limiting for create_shop (Phase 3)
- Lawyer question for Phase 12: storing Kenyan customer data in a foreign Supabase region and the Privacy Policy wording

## Notes for the next chat

Chunk 11 delivered: Supabase account, organization, staging project, CLI login and link, two migrations pushed with db push, docs/environments.md. Free plan has two project slots, one used by staging, one reserved for production. Next is connecting the Next.js app to Supabase for sign up, log in and log out, which adds Supabase keys to the env validators.
