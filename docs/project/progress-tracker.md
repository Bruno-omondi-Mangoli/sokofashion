# Progress Tracker

Last updated: 18 November 2026
Current phase: Phase 5, public storefront
Current chunk: Chunk 23a part 3, read only check of the stock view, function permissions, policies and bucket (no code change)
Next chunk: Chunk 23b, get_public_shop with pgTAP tests, public shop page, sample photos in the seed
After that: Chunk 24, product page for buyers with size and colour pickers, then the shared browse page (D053, D058), then cart and checkout

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, onboarding, shop creation, staff invitations, email confirmation, password reset: done
Phase 4: Design system, catalogue, stock ledger, product screens, dev seed, photos, edit, stock and archive: done
Phase 5: Public storefront, then the shared browse page across shops (D053 confirmed), cart, checkout: in progress
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

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Clothes come in sizes and colours together. Each item has one to four photos, and the seller decides how many, with at least one. Photos must be shown whole, never cropped (D059). Storefront must show products from several angles. The friends want a shared page where customers browse products from all five shops, then check out with the shop that owns the product (D053, confirmed).

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind 4, ESLint, Prettier (Cache Components off, Tailwind loader kept in next.config.ts): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest with 182 tests: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database: shops, members, invitations, categories, products, variants, stock ledger, product photos and storage bucket, all with RLS: done
- pgTAP tests in supabase/tests/database (203 checks in 8 files), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, eight migrations pushed: done
- Auth screens, design system, AppShell, dashboard, onboarding, team page, product list, add product, product page, photos, edit, stock and archive screens: done
- Shared shop access helpers in src/features/shops/access.ts for new code
- Development seed: npm run db:seed and npm run db:fresh, local only: done
- Supabase production project: not yet created (second free slot reserved)
- Vercel account and project: not yet created
- Custom SMTP and domain: not yet decided (D036)
- GitHub Pro: not purchased, deferred to pilot stage

## Machine

Windows 11 Pro, 16 GB RAM, Ryzen 7 Pro, SSD with 200 GB free. Virtualization enabled.

## Key facts from the build

Repository URL: https://github.com/Bruno-omondi-Mangoli/sokofashion
Local Studio: http://127.0.0.1:54323 (the cloud dashboard address starts with supabase.com, do not mix them up)
Local fake inbox (confirmation emails): http://127.0.0.1:54324
Local app address: http://localhost:3000 (always use localhost, not 127.0.0.1)
Design guide: http://localhost:3000/design (hidden in production)
Local database container: supabase_db_sokofashion (check with docker ps)
Local test accounts after npm run db:fresh: owner1, owner2, owner3 and attendant1 at example.test, password Password123!
Account note: npm run db:reset deletes all local accounts, run npm run db:fresh instead.
Photo bucket: product-images (public read, 500 KB per file, WebP and JPEG only)
Photo table: product_images
Supabase staging project ref: (your 20 letter ref)
Supabase staging region: (your region)
Supabase production project:
Vercel project:
Domain:
Secrets (database password, service role key) are stored only in Bitwarden. Never in Git or chat.

## Real schema facts (checked on 18 November 2026)

Tables: categories, countries, product_images, product_variants, products, shop_invitations, shop_members, shops, stock_movements, and the view variant_stock. RLS is on for all nine tables.
Enums: product_status (draft, active, archived), shop_role (owner, manager, attendant), shop_status (active, suspended), stock_reason (opening, restock, sale, sale_return, adjustment, damage, reversal).
Live product means products.status is active. A public shop must also have shops.status active.
Photos: product_images has id, shop_id, product_id, sort_order (1 to 4), storage_path, width, height, byte_size. The path is shop_id/product_id/image_id.ext for the main file and shop_id/product_id/image_id_t.ext for the thumbnail, with ext webp or jpg.
Stock: stock_movements.quantity_change summed per variant. The view variant_stock gives on_hand per variant.
Variants: size, colour, shade, volume_ml, expires_on, price_minor (can be empty), is_active.
Anonymous visitors (anon) have no table access except SELECT on categories and every permission on countries (to be revoked in Chunk 23b).
All 21 public functions have a fixed search_path.

## Useful commands

npm run check : typecheck, lint, format check, tests and build in one go
npm run db:start, db:stop, db:reset, db:status : local database controls
npm run db:fresh : reset the local database and load sample accounts, shops and products
npm run db:seed : load the sample data without resetting
npm run db:test : database security tests (needs Docker and the local database running)
npx supabase migration list : compare local and staging migrations
npx supabase db push : send merged migrations to staging (dry run first)
Helper for read only schema checks (lasts one terminal window): dbq() { docker exec supabase_db_sokofashion psql -U postgres -d postgres -A -F ' | ' -c "$1"; }
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
Rule: photo file names are built by the database and the app, never chosen by the browser (D055).
Rule: photos are never cropped, and a test guards it (D059).
Rule: a break it on purpose check must first prove the break took effect (D060).
Rule: a use server file exports only async functions, shared constants and types go in a separate types file.
Rule: parked work stays on its side branch and is never opened as a pull request into main (D066).
Health check: http://localhost:3000/api/health

## Open questions

- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the remaining pilot interview questions (delivery, how they check M-Pesa messages, past losses, what they would pay, how they take photos today)
- Custom SMTP: buy a domain in Phase 12, or create pilot accounts by hand in the dashboard (D036)
- Staging email templates (confirmation and recovery) are locked until custom SMTP exists. Apply supabase/templates files in Phase 12.
- A Swahili speaker must confirm all Swahili text, including category names, before the pilot (D041)
- Photo storage: about 100 to 200 KB per photo with its thumbnail, 100 MB cap per shop, Supabase free storage about 1 GB in total. Recheck the cost table at 100 and 1000 shops.
- Stray photo files if a delete fails: add a cleanup job in Phase 11
- Uploaded files are checked by declared type and size only, add scanning in Phase 11
- The seed script creates products without photos. Add sample photos in Chunk 23b so the storefront has something to show.
- Changing which photo is the cover: not built yet
- Adding a new size or colour to an existing product, and switching a variant off: not built yet, add as a small chunk
- Older actions in photos and catalogue still carry their own copy of the shop lookup, move them to src/features/shops/access.ts in a cleanup
- History shows you or a team member, real names come with the audit trail in Phase 9
- Dates are shown in Kenyan time, give each shop its own time zone before other countries launch
- Owner feedback on how the new look, the add product form, the photo and stock screens feel
- Dark mode: revisit in Phase 11
- Price changes and stock write offs are not alerted on yet, the audit trail and alerts come in Phase 9
- VAT and eTIMS handling of prices: ask an accountant before Phase 7
- Cosmetics expiry and labelling rules: ask a lawyer or KEBS before the pilot
- Per variant prices exist in the database but the screens use one price per product
- The product list shows the newest 100 products only, add paging if a shop passes that
- Confirm Pochi la Biashara details in Phase 6
- CAPTCHA, leaked password protection and stronger rate limits (Phase 11)
- A change password option for logged in users: add on a settings page later
- Team size limit and the catalogue and photo limits should later come from plan limits in the database
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: deferred, results are checked with Zod instead (D051), revisit in Phase 11
- anon holds every permission on the countries table including TRUNCATE: revoke in Chunk 23b after checking what authenticated can do
- The view variant_stock: confirm it respects RLS (security invoker) and that anon cannot read it, check in Chunk 23a part 3
- Which functions anon and authenticated can run: check in Chunk 23a part 3, revoke anything anon does not need
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails, ODPC registration, trademark and impersonation clause, prohibited and counterfeit goods and image rights clause, takedown process, marketplace duties for disputes and refunds, controller and processor roles for staff data, data processing agreement with the email provider, font licences, staff activity records and retention

## Notes for the next chat

Chunk 21b verified on 2 November 2026: photos show whole. Chunk 22 delivered and merged (PR 35): shared access helpers, edit product, stock page per product with levels, record stock change form in everyday words, history with undo via reversal entries, archive and restore, 182 unit tests in total. Phase 4 is complete.

Chunk 22c merged on 18 November 2026: PR 36 had merged the parked branch parked/public-shop-read-old into main by mistake, and the parked migration 20261102113239_public_shop_read.sql and its test file were removed again. It was never applied to staging or local. CI green, db:test passing (203 checks in 8 files). The branch parked/public-shop-read-old is kept as a reference only and must not be reused unless pasted for review. D064 and D065 stay proposed until Chunk 23b.

Chunk 23a part 2 done on 18 November 2026: the real schema was inspected, see the Real schema facts section. Next is Chunk 23a part 3, a read only check of the variant_stock view, function permissions, policies and the photo bucket, then Chunk 23b writes get_public_shop fresh.
