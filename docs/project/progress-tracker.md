# Progress Tracker

Last updated: 18 October 2026
Current phase: Phase 4 (products, variants, images, stock ledger)
Current chunk: Chunk 20b, development seed (awaiting verification)
Next chunk: Chunk 21, product photos: 1 to 4 per product, at least 1 to go live, compression, storage and publishing
After that: Chunk 22, edit product, restock and stock correction screens, archive. Then Phase 4 is complete.

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, onboarding, shop creation, staff invitations, email confirmation, password reset: done
Phase 4: Design system, catalogue, stock ledger, add product screens and dev seed done, then photos and stock screens: in progress
Phase 5: Public storefront, then the shared browse page across shops (D053, to confirm), cart, checkout: not started
Phase 6: Seller payment recording and confirmation, provider interface: not started
Phase 7: Orders, delivery, digital receipts, notifications: not started
Phase 8: Shop ledger, expenses, customer debts, reports, owner only cost prices: not started
Phase 9: Anti-theft and staff control module: not started
Phase 10: Subscription billing, platform admin, trust and safety: not started
Phase 11: Hardening: security, performance, accessibility, backups, monitoring: not started
Phase 12: Legal, compliance, pilot launch with 5 shops: not started
Phase 13: Feedback, pricing validation, iteration: not started

## MVP v1 scope

Phases 0 to 8, trimmed Phase 11, Phase 12. Manual subscription handling. Anti-theft (Phase 9) and automated billing (Phase 10) are v1.1. Basic staff invitations and roles are done.

## Working pace

30 to 40 hours per week. Estimate: MVP v1 in 3 to 4 months, full product in 5 to 6 months.

## Budget rule

Zero spend until the pilot is complete (D013, D014). Upgrade Vercel and Supabase before any shop pays real money. Enable GitHub branch protection before the pilot launches, requiring both Checks and Database tests. Known unavoidable spend: a domain (about 12 dollars a year) for shop links and email sending, planned for Phase 12 (D036).

## Pilot shops

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Clothes come in sizes and colours together. Each item has one to four photos, and the seller decides how many, with at least one. Storefront must show products from several angles. The friends want a shared page where customers browse products from all five shops, then check out with the shop that owns the product.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind 4, ESLint, Prettier (Cache Components off, Tailwind loader kept in next.config.ts): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest with 128 tests: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database: shops, members, invitations, categories, products, variants, stock ledger, create_product with opening stock, all with RLS: done
- pgTAP tests in supabase/tests/database (161 checks in 7 files), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, seven migrations pushed: done
- Auth screens, design system, AppShell, dashboard, onboarding, team page, product list and add product form: done
- Development seed: npm run db:seed and npm run db:fresh, local only, needs SUPABASE_SERVICE_ROLE_KEY in .env.local: added in Chunk 20b
- Supabase production project: not yet created (second free slot reserved)
- Vercel account and project: not yet created
- Custom SMTP and domain: not yet decided (D036)
- GitHub Pro: not purchased, deferred to pilot stage

## Machine

Windows 11 Pro, 16 GB RAM, Ryzen 7 Pro, SSD with 200 GB free. Virtualization enabled.

## Key facts from the build

Repository URL: https://github.com/Bruno-omondi-Mangoli/sokofashion
Local Studio: http://127.0.0.1:54323
Local fake inbox (confirmation emails): http://127.0.0.1:54324
Local app address: http://localhost:3000 (always use localhost, not 127.0.0.1)
Design guide: http://localhost:3000/design (hidden in production)
Local test accounts after npm run db:fresh: owner1, owner2, owner3 and attendant1 at example.test, password Password123!
Account note: npm run db:reset deletes all local accounts, run npm run db:fresh instead.
Supabase staging project ref: (your 20 letter ref)
Supabase staging region: (your region)
Supabase production project:
Vercel project:
Domain:
Secrets (database password, service role key) are stored only in Bitwarden. Never in Git or chat.

## Useful commands

npm run check : typecheck, lint, format check, tests and build in one go
npm run db:start, db:stop, db:reset, db:status : local database controls
npm run db:fresh : reset the local database and load sample accounts, shops and products
npm run db:seed : load the sample data without resetting
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
Rule: access decisions use supabase.auth.getUser on the server, and shop and role come from the database, never from a form.
Rule: important rules are enforced in the database, forms only help.
Rule: colours, fonts and sizes come from design tokens, and every new colour pair is added to the contrast test.
Rule: read a config file before replacing it. next.config.ts must keep the Tailwind loader (D042).
Rule: stock is only ever changed by adding ledger rows through the functions, never by editing.
Rule: database results are checked with Zod before the app uses them (D051).
Rule: the seed script only ever runs locally (D054).
Health check: http://localhost:3000/api/health

## Open questions

- Confirm D053: build the shared browse page right after the single shop storefront, with each shop opting in, and no combined cart
- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the remaining pilot interview questions (delivery, how they check M-Pesa messages, past losses, what they would pay, how they take photos today)
- Custom SMTP: buy a domain in Phase 12, or create pilot accounts by hand in the dashboard (D036)
- Staging email templates (confirmation and recovery) are locked until custom SMTP exists. Apply supabase/templates files in Phase 12.
- A Swahili speaker must confirm all Swahili text, including category names, before the pilot (D041)
- Photo storage budget: Supabase free storage is about 1 GB, so photos must be compressed hard, and the cost at 100 and 1000 shops must be rechecked in Chunk 21
- Owner feedback on how the new look and the add product form feel
- Dark mode: revisit in Phase 11
- Price changes and stock write offs are not alerted on yet, the audit trail and alerts come in Phase 9
- VAT and eTIMS handling of prices: ask an accountant before Phase 7
- Cosmetics expiry and labelling rules: ask a lawyer or KEBS before the pilot
- Per variant prices exist in the database but the screens use one price per product
- The product list shows the newest 100 products only, add paging if a shop passes that
- Confirm Pochi la Biashara details in Phase 6
- CAPTCHA, leaked password protection and stronger rate limits (Phase 11)
- A change password option for logged in users: add on a settings page later
- Team size limit and the catalogue limits should later come from plan limits in the database
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: deferred, results are checked with Zod instead (D051), revisit in Phase 11
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails, ODPC registration, trademark and impersonation clause, prohibited and counterfeit goods clause, marketplace duties for disputes and refunds, controller and processor roles for staff data, data processing agreement with the email provider, font licences, staff activity records and retention

## Notes for the next chat

Chunk 20 verified. The owner was locked out because db:reset deletes local accounts and email confirmation is on, fixed by using the fake inbox at port 54324. Chunk 20b delivered: scripts/seed-dev.mjs with three sample shops, six draft products with stock and an attendant, npm run db:seed and db:fresh, local only guard (D054). The owner asked for a shared page where customers browse all five shops and check out with the owner, recorded as D053 with the rule that checkout stays per shop because the platform never holds seller money. Next is product photos.
