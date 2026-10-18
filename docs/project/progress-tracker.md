# Progress Tracker

Last updated: 18 October 2026
Current phase: Phase 4 (products, variants, images, stock ledger)
Current chunk: Chunk 19, stock ledger (awaiting verification)
Next chunk: Chunk 20, generated database types and the product screens: product list, add and edit product with a sizes times colours grid and opening stock
After that: Chunk 21, product photos (1 to 4, at least 1) with compression and several angles

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, onboarding, shop creation, staff invitations, email confirmation, password reset: done
Phase 4: Design system, catalogue tables and stock ledger done, then screens and photos: in progress
Phase 5: Public storefront, cart, checkout: not started
Phase 6: Seller payment recording and confirmation, provider interface: not started
Phase 7: Orders, delivery, digital receipts, notifications: not started
Phase 8: Shop ledger, expenses, customer debts, reports, owner only cost prices: not started
Phase 9: Anti-theft and staff control module: not started
Phase 10: Subscription billing, platform admin, trust and safety: not started
Phase 11: Hardening: security, performance, accessibility, backups, monitoring: not started
Phase 12: Legal, compliance, pilot launch with 5 shops: not started
Phase 13: Feedback, pricing validation, iteration, marketplace planning: not started

## MVP v1 scope

Phases 0 to 8, trimmed Phase 11, Phase 12. Manual subscription handling. Anti-theft (Phase 9) and automated billing (Phase 10) are v1.1. Basic staff invitations and roles are done.

## Working pace

30 to 40 hours per week. Estimate: MVP v1 in 3 to 4 months, full product in 5 to 6 months.

## Budget rule

Zero spend until the pilot is complete (D013, D014). Upgrade Vercel and Supabase before any shop pays real money. Enable GitHub branch protection before the pilot launches, requiring both Checks and Database tests. Known unavoidable spend: a domain (about 12 dollars a year) for shop links and email sending, planned for Phase 12 (D036).

## Pilot shops

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Clothes come in sizes and colours together (for example Small, Large, Extra large). Each item has one to four photos, and the seller decides how many, with at least one. Storefront must show products from several angles.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind 4, ESLint, Prettier (Cache Components off, Tailwind loader kept in next.config.ts): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest with 94 tests: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database: countries, shops, members, invitations, team functions, categories, products, product_variants, create_product, stock_movements, variant_stock, stock functions, all with RLS: done
- pgTAP tests in supabase/tests/database (146 checks in 6 files), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, six migrations pushed: done in Chunk 19
- Auth screens, design system, AppShell, dashboard, onboarding, team page: done
- Supabase production project: not yet created (second free slot reserved)
- Vercel account and project: not yet created
- Custom SMTP and domain: not yet decided (D036)
- GitHub Pro: not purchased, deferred to pilot stage

## Machine

Windows 11 Pro, 16 GB RAM, Ryzen 7 Pro, SSD with 200 GB free. Virtualization enabled.

## Key facts from the build

Repository URL: https://github.com/Bruno-omondi-Mangoli/sokofashion
Local Studio: http://127.0.0.1:54323
Local fake inbox: http://127.0.0.1:54324
Local app address: http://localhost:3000 (always use localhost, not 127.0.0.1)
Design guide: http://localhost:3000/design (hidden in production)
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
Rule: after merging, run git switch main, git pull and git log to confirm the work is on main.
Rule: change the database only through new migration files.
Rule: auth settings on staging and production are changed in the dashboard and listed in docs/environments.md.
Rule: create files in Git Bash with touch or mkdir, write content in VS Code.
Rule: every new shop-owned table ships with isolation tests.
Rule: staging holds fake data only.
Rule: access decisions use supabase.auth.getUser on the server.
Rule: important rules are enforced in the database, forms only help.
Rule: colours, fonts and sizes come from design tokens, and every new colour pair is added to the contrast test.
Rule: read a config file before replacing it. next.config.ts must keep the Tailwind loader (D042).
Rule: stock is only ever changed by adding ledger rows through the functions, never by editing.
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the remaining pilot interview questions (delivery, how they check M-Pesa messages, past losses, what they would pay)
- Custom SMTP: buy a domain in Phase 12, or create pilot accounts by hand in the dashboard (D036)
- Staging email templates (confirmation and recovery) are locked until custom SMTP exists. Apply supabase/templates files in Phase 12.
- A Swahili speaker must confirm all Swahili text, including category names, before the pilot (D041)
- Photo storage budget: Supabase free storage is about 1 GB, so photos must be compressed hard, and the cost at 100 and 1000 shops must be rechecked in Chunk 21
- Owner feedback on how the new look feels, to adjust tokens
- Dark mode: revisit in Phase 11
- Price changes and stock write offs are not alerted on yet, the audit trail and alerts come in Phase 9
- VAT and eTIMS handling of prices: ask an accountant before Phase 7
- Cosmetics expiry and labelling rules: ask a lawyer or KEBS before the pilot
- Expiry date is per variant for now, per batch later if sellers need it
- Confirm Pochi la Biashara details in Phase 6
- CAPTCHA, leaked password protection and stronger rate limits (Phase 11)
- A change password option for logged in users: add on a settings page later
- Team size limit of 10 and the catalogue limits should later come from plan limits in the database
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: add at the start of Chunk 20
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails, ODPC registration, trademark and impersonation clause, controller and processor roles for staff data, data processing agreement with the email provider, font licences, staff activity records and retention

## Notes for the next chat

Chunk 18 verified and merged. New pilot facts: clothes have sizes and colours together, and each item has 1 to 4 photos with at least one (D048, D049). Chunk 19 delivered: migration stock_ledger (unique shop_id and id on variants, stock_reason enum, append only stock_movements with sign, range, reversal and non negative rules, variant_stock security invoker view, record_stock_movement and reverse_stock_movement), pgTAP file stock.test.sql (35 checks, 146 in total). The approval workflow for staff stock adjustments is deferred to Phase 9 (D050). Next is generated types and the product screens.
