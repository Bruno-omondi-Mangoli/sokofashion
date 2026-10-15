# Progress Tracker

Last updated: 15 October 2026
Current phase: Phase 3 (Authentication, seller onboarding, shop creation, staff invitations)
Current chunk: Chunk 13, shop onboarding (awaiting verification)
Next chunk: Chunk 14, staff invitations and roles: owner adds an attendant, attendant logs in and sees the shop
After that: Chunk 15, email confirmation on staging, rate limiting and security settings

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, seller onboarding, shop creation, staff invitations: in progress
Phase 4: Design system chunk first, then products, variants, images, stock ledger: not started
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
- Next.js 16 project with TypeScript strict, Tailwind, ESLint, Prettier (Cache Components off): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest with 37 tests: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database: countries, shops, shop_members, helper functions, create_shop with reserved slugs and a 3 shop limit, all with RLS: done
- pgTAP tests in supabase/tests/database (40 checks), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, three migrations pushed: done
- Supabase client, proxy, sign up, log in, log out, onboarding, dashboard: done (verified on the local database)
- Supabase production project: not yet created (second free slot reserved)
- Vercel account and project: not yet created
- GitHub Pro: not purchased, deferred to pilot stage

## Machine

Windows 11 Pro, 16 GB RAM, Ryzen 7 Pro, SSD with 200 GB free. Virtualization enabled.

## Key facts from the build

Repository URL: https://github.com/Bruno-omondi-Mangoli/sokofashion
Local Studio: http://127.0.0.1:54323
Local app address: http://localhost:3000 (always use localhost, not 127.0.0.1)
Supabase staging project ref: (your 20 letter ref)
Supabase staging region: (your region)
Supabase production project:
Vercel project:
Domain:
Secrets (database password, service role key) are stored only in Bitwarden. Never in Git or chat.

## Useful commands

npm run check : typecheck, lint, format check, tests and build in one go
npm run db:start, db:stop, db:reset, db:status : local database controls
npm run db:test : database security tests (needs Docker and the local database running)
npx supabase migration list : compare local and staging migrations
npx supabase db push : send merged migrations to staging (dry run first)
Rule: never merge a pull request unless both CI checks are green.
Rule: change the database only through new migration files.
Rule: create files in Git Bash with touch or mkdir, write content in VS Code.
Rule: every new shop-owned table ships with isolation tests.
Rule: staging holds fake data only.
Rule: access decisions use supabase.auth.getUser on the server.
Rule: important rules are enforced in the database, forms only help.
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the nine pilot interview questions
- Confirm Pochi la Biashara details and currency decimal places in later chunks
- Email confirmation on staging and production, stronger rate limiting, CAPTCHA (Chunk 15 and Phase 11)
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: add in a later chunk
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails under the Data Protection Act, ODPC registration, trademark and impersonation clause in the Terms of Service

## Notes for the next chat

Chunk 13 delivered: migration shop_slug_rules_and_limit (reserved slugs constraint, create_shop limited to 3 shops per user with an advisory lock), pgTAP file shop_slug_rules.test.sql (9 checks), src/features/shops (slug helper, schema, queries, action, form), onboarding page, dashboard now routes by shop count. Pushed to staging after merge. Next is staff invitations: owner adds an attendant by email, with controlled functions because shop_members has no direct write access.
