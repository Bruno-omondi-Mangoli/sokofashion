# Progress Tracker

Last updated: 20 November 2026
Current phase: Phase 5, public storefront
Current chunk: Chunk 25c, dashboard link and AppShell for the shared page switch (pull request open)
Next chunk: Chunk 26, the cart for one shop in the browser, then decide how checkout fits Phases 6 and 7 (see open questions)
After that: Phase 6, seller payment recording and confirmation

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, onboarding, shop creation, staff invitations, email confirmation, password reset: done
Phase 4: Design system, catalogue, stock ledger, product screens, dev seed, photos, edit, stock and archive: done
Phase 5: Public storefront, shared browse page, cart, checkout: in progress. Done so far: public shop page (23c), public product page with pickers (24a), shared browse page with owner opt out (25), equal cards (25b), dashboard link (25c).
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

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). Clothes come in sizes and colours together. Each item has one to four photos, and the seller decides how many, with at least one. Photos must be shown whole, never cropped (D059). Storefront must show products from several angles. The friends want a shared page where customers browse products from all five shops, then check out with the shop that owns the product (D053, D058). The shared page lists every shop by default and a shop can opt out (D072). A shop link shows only that shop's products.

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind 4, ESLint, Prettier (Cache Components off, Tailwind loader kept in next.config.ts): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest unit tests (run npm run test for the count): done
- sharp as a development only dependency for sample photos in the seed: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database: shops, members, invitations, categories, products, variants, stock ledger, product photos and storage bucket, all with RLS: done
- pgTAP tests in supabase/tests/database (310 checks in 11 files), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, eleven migrations pushed (confirm with npx supabase migration list): done
- Auth screens, design system, AppShell, dashboard, onboarding, team page, product list, add product, product page, photos, edit, stock and archive screens: done
- Public shop page at /s/[slug], public product page at /s/[slug]/p/[productId], shared browse page at /browse: done
- Owner screen for the shared page at /dashboard/visibility/[slug], linked from the dashboard: done
- Public read functions get_public_shop, get_public_product and get_public_browse, owner function set_shop_listed: done
- Shared shop access helpers in src/features/shops/access.ts for new code
- Development seed with sample photos: npm run db:seed and npm run db:fresh, local only: done
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
Sample public shops locally: /s/mama-njeri, /s/zuri-shoes, /s/amani-bags (Mini Crossbody is a draft on purpose). Shared page: /browse
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

## Real schema facts (checked on 18 November 2026, updated after Chunk 25)

Tables: categories, countries, product_images, product_variants, products, shop_invitations, shop_members, shops, stock_movements, and the view variant_stock (security invoker). RLS is on for all nine tables.
Enums: product_status (draft, active, archived), shop_role (owner, manager, attendant), shop_status (active, suspended), stock_reason (opening, restock, sale, sale_return, adjustment, damage, reversal).
Live product means products.status is active. A public shop must also have shops.status active. The shared page also needs shops.is_listed true (default true).
Photos: product_images has id, shop_id, product_id, sort_order (1 to 4), storage_path, width, height, byte_size. The path is shop_id/product_id/image_id.ext for the main file and shop_id/product_id/image_id_t.ext for the thumbnail, with ext webp or jpg.
Stock: stock_movements.quantity_change summed per variant. The view variant_stock gives on_hand per variant for signed in members.
Variants: size, colour, shade, volume_ml, expires_on, price_minor (can be empty), is_active.
Anonymous visitors (anon) can read only categories and countries as tables, and can run only get_public_shop, get_public_product and get_public_browse. Countries is read only for everybody (D068). Only signed in users can run set_shop_listed, and it refuses everybody except the shop owner.
All public functions have a fixed search_path.

## Useful commands

npm run check : typecheck, lint, format check, tests and build in one go
npm run db:start, db:stop, db:reset, db:status : local database controls
npm run db:fresh : reset the local database and load sample accounts, shops, products and photos
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
Rule: the public reads data only through get_public functions, and seller text is shown as plain text (D064, D071).
Rule: a database test for a function that reads every shop must first switch the seed shops off, inside the test (D073).
Rule: npm run test (unit tests) and npm run db:test (database checks, 310) are different suites with different counts.
Health check: http://localhost:3000/api/health

## Open questions

- Cart and checkout order: orders arrive in Phase 7 and payments in Phase 6, so a checkout that places orders cannot exist yet. Recommendation: Chunk 26 builds only the cart in the browser (items kept per shop, no database), and the Place order step is built in Phase 7 after payment recording in Phase 6. Owner to confirm.
- Link to /browse from the home page and a public header: not built yet, needs src/app/page.tsx to be read first
- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 6)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the remaining pilot interview questions (delivery, how they check M-Pesa messages, past losses, what they would pay, how they take photos today)
- Custom SMTP: buy a domain in Phase 12, or create pilot accounts by hand in the dashboard (D036)
- Staging email templates (confirmation and recovery) are locked until custom SMTP exists. Apply supabase/templates files in Phase 12.
- A Swahili speaker must confirm all Swahili text, including category names and the sayings on the public pages, before the pilot (D041)
- Storefront look: the owner finds the public pages not unique enough and wants a stronger designer feel, with clothes shown on hangers and rotation. Decided: build the roadmap first, a hanger style display with photos (no real 3D) is the recommended design step after cart screens exist, spin, 3D and the lookbook are deferred (D067). Owner to send screenshots or a reference site.
- Shop page cards (/s/slug) still use the older single column layout, give them the same fixed photo box as the browse cards if wanted
- Lookbook data model (looks, outfits) and stock holding rules: design in or after Phase 7 (D067)
- Moderation before strangers can sign up: shops are on the shared page by default (D072), so suspension tools (Phase 10) and a takedown process (Phase 12) are needed first
- Photo storage: about 100 to 200 KB per photo with its thumbnail, 100 MB cap per shop, Supabase free storage about 1 GB in total. Recheck the cost table at 100 and 1000 shops.
- Stray photo files if a delete fails: add a cleanup job in Phase 11
- Uploaded files are checked by declared type and size only, add scanning in Phase 11
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
- Public shop and shared pages page through 48 products at a time with Back and More items links, and the page number is capped at 2000
- Confirm Pochi la Biashara details in Phase 6
- CAPTCHA, leaked password protection and stronger rate limits, including for public functions (Phase 11)
- A change password option for logged in users: add on a settings page later
- Team size limit and the catalogue and photo limits should later come from plan limits in the database
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: deferred, results are checked with Zod instead (D051), revisit in Phase 11
- Font warning "Failed to find font override values" for Atkinson Hyperlegible Next: harmless, silence with adjustFontFallback false in src/app/layout.tsx if not done yet
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails, ODPC registration, trademark and impersonation clause, prohibited and counterfeit goods and image rights clause, takedown process, marketplace duties for disputes and refunds, public price and consumer protection rules for online sellers, controller and processor roles for staff data, data processing agreement with the email provider, font licences, staff activity records and retention

## Notes for the next chat

Chunk 22c removed the parked migration that PR 36 merged by mistake (D066). Chunk 23b added get_public_shop (D068, D069). Chunk 23c added the public shop page, the storefront data layer, sample photos in the seed and the guard tests (D071). Chunk 24a added get_public_product and the product page with pickers (D070). Chunk 25 added shops.is_listed, set_shop_listed, get_public_browse and the /browse page with owner opt out (D072, D073). Chunk 25b made the browse cards equal in size (D074). Chunk 25c linked the shared page switch from the dashboard, fixed the shop address shown on the dashboard, and moved the owner screen into AppShell (D075). The branch parked/public-shop-read-old is kept as a reference only.

Next is Chunk 26. Plan: the cart in the browser, one cart per shop, with quantity changes, a summary bar and an empty state, built only from what the public pages already return, so no database change. The Place order step waits for Phases 6 and 7. The cart never decides a price, the database will recheck prices and stock when the order is placed.
