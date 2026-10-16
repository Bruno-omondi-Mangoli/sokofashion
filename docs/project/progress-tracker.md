# Progress Tracker

Last updated: 16 October 2026
Current phase: Phase 4 (design system first, then products)
Current chunk: Chunk 16, design system (awaiting verification)
Next chunk: Chunk 17, restyle dashboard, onboarding and team pages with an app shell
After that: Chunk 18, categories, products and variants tables with RLS and isolation tests

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, onboarding, shop creation, staff invitations, email confirmation, password reset: done
Phase 4: Design system, then products, variants, images, stock ledger: in progress
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

Phases 0 to 8, trimmed Phase 11, Phase 12. Manual subscription handling. Anti-theft (Phase 9) and automated billing (Phase 10) are v1.1. Basic staff invitations and roles are done.

## Working pace

30 to 40 hours per week. Estimate: MVP v1 in 3 to 4 months, full product in 5 to 6 months.

## Budget rule

Zero spend until the pilot is complete (D013, D014). Upgrade Vercel and Supabase before any shop pays real money. Enable GitHub branch protection before the pilot launches, requiring both Checks and Database tests. Known unavoidable spend: a domain (about 12 dollars a year) for shop links and email sending, planned for Phase 12 (D036).

## Pilot shops

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Storefront must show products from several angles.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind 4, ESLint, Prettier (Cache Components off): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest with 92 tests: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database with shops, members, invitations, team functions, reserved slugs and a 3 shop limit, all with RLS: done
- pgTAP tests in supabase/tests/database (72 checks), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, four migrations pushed: done
- Auth: sign up, log in, log out, email confirmation, password show or hide, forgot and reset password, onboarding choice screen, dashboard, team page: done
- Design system: tokens, fonts (Young Serif and Atkinson Hyperlegible Next), contrast helper and tests, core components, /design guide, restyled home and sign in pages: added in Chunk 16
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
Rule: change the database only through new migration files.
Rule: auth settings on staging and production are changed in the dashboard and listed in docs/environments.md.
Rule: create files in Git Bash with touch or mkdir, write content in VS Code.
Rule: every new shop-owned table ships with isolation tests.
Rule: staging holds fake data only.
Rule: access decisions use supabase.auth.getUser on the server.
Rule: important rules are enforced in the database, forms only help.
Rule: colours, fonts and sizes come from design tokens, and every new colour pair is added to the contrast test.
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the nine pilot interview questions
- Custom SMTP: buy a domain in Phase 12, or create pilot accounts by hand in the dashboard (D036)
- Staging email templates (confirmation and recovery) are locked until custom SMTP exists. Apply supabase/templates files in Phase 12.
- A Swahili speaker must confirm all Swahili text before the pilot (D041)
- Owner feedback on how the new look feels, to adjust tokens
- Dark mode: revisit in Phase 11
- Confirm Pochi la Biashara details and currency decimal places in later chunks
- CAPTCHA, leaked password protection and stronger rate limits (Phase 11)
- A change password option for logged in users: add on a settings page later
- Team size limit of 10 should later come from plan limits in the database
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: add in a later chunk
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails, ODPC registration, trademark and impersonation clause, controller and processor roles for staff data, data processing agreement with the email provider, font licences

## Notes for the next chat

Chunk 15b verified. Chunk 16 delivered: kanga inspired design system (pindo border band, kanga frame, ujumbe sayings), tokens in globals.css, fonts Young Serif and Atkinson Hyperlegible Next, WCAG contrast helper and 30 new tests (92 total), components in src/components/ui, restyled home and sign in pages, /design guide hidden in production, docs/design-system.md. Dashboard, onboarding and team pages still use the old plain styling. Next is Chunk 17, the app shell and restyle of those pages, then the products tables.
