# Progress Tracker

Last updated: 21 November 2026
Current phase: Phase 6, orders (the phases were swapped, see D078)
Current chunk: Chunk 30b, About this shop text and new arrivals, plus the docs for Chunks 28 to 30 (pull request open)
Next chunk: Chunk 31, buyer order lookup and receipt: a public function that shows an order's status and items when the buyer gives the reference and the phone number, and a receipt page
After that: notifications to sellers (Phase 6), then Phase 7, seller payment recording and confirmation

## Phases

Phase 0: Product definition, user stories, success metrics: done pending friend interview answers
Phase 1: Tooling, accounts, Git and GitHub, repository, CI, scaffold: done
Phase 2: Multi-tenant database, roles, RLS with isolation tests: done
Phase 3: Authentication, onboarding, shop creation, staff invitations, email confirmation, password reset: done
Phase 4: Design system, catalogue, stock ledger, product screens, dev seed, photos, edit, stock and archive: done
Phase 5: Public storefront, shared browse page, browser cart: done
Phase 6: Orders, delivery, digital receipts, notifications: in progress. Done: order core (27), place order screen and delivery settings (28), seller orders screen (29), Soko Street look (30a), About text and new arrivals (30b, in the pull request). Still to build: buyer order lookup and receipt (31), seller notifications.
Phase 7: Seller payment recording and confirmation, provider interface: not started
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

5 friends selling women's clothes, shoes and handbags. All five have one staff member each. Payments by cash and M-Pesa (Paybill, Buy Goods Till, Pochi la Biashara). The shop owner checks the M-Pesa message on their own phone, sees the money arrived, then hands over the goods. Clothes come in sizes and colours together. Each item has one to four photos, and the seller decides how many, with at least one. Photos must be shown whole, never cropped (D059). The friends want a shared page where customers browse products from all five shops, then check out with the shop that owns the product (D053, D058). The shared page lists every shop by default and a shop can opt out (D072). A shop link shows only that shop's products. Each shop chooses pickup only, free delivery or paid delivery with a flat fee (D081).

## Accounts and tools set up

- VS Code, Git, Git Bash, Node 24, npm 11: done and verified
- GitHub account with two-factor: done
- Next.js 16 project with TypeScript strict, Tailwind 4, ESLint, Prettier (Cache Components off, Tailwind loader kept in next.config.ts): done
- Husky, lint-staged, commitlint, Dependabot: done
- GitHub Actions CI with two jobs, Checks and Database tests: done
- Zod, server-only, env validators, Vitest unit tests (run npm run test for the count): done
- sharp as a development only dependency for sample photos in the seed: done
- Docker Desktop, Supabase CLI as a dev dependency: done
- Local database: shops, members, invitations, categories, products, variants, stock ledger, product photos and storage bucket, orders and order items, all with RLS: done
- pgTAP tests in supabase/tests/database (407 checks in 14 files after Chunk 29, 437 in 15 files once Chunk 30b is merged), run locally and in CI: done
- Bitwarden, Supabase account and organization, staging project linked, fourteen migrations pushed after Chunk 29 and fifteen once Chunk 30b is pushed (confirm with npx supabase migration list): done
- Auth screens, design system, AppShell, dashboard with a sentence beside every button, onboarding, team page, product list, add product, product page, photos, edit, stock and archive screens: done
- Public shop page /s/[slug] with awning, hang tags, thread dots and photo strip, product page /s/[slug]/p/[productId], shared page /browse, browser cart /cart, checkout /checkout/[slug]: done
- Owner screens: shared page switch /dashboard/visibility/[slug], delivery /dashboard/delivery/[slug], seller orders /dashboard/orders/[slug] (all done), About text /dashboard/about/[slug] (in pull request)
- Public functions get_public_shop, get_public_product, get_public_browse, get_public_checkout_info, place_order; owner functions set_shop_listed, set_shop_delivery, set_shop_about (in pull request); team functions cancel_order (owners and managers) and release_expired_orders (any active team member): done
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
Sample public shops locally: /s/mama-njeri, /s/zuri-shoes, /s/amani-bags (Mini Crossbody is a draft on purpose). Shared page: /browse. Cart: /cart. Checkout: /checkout/[slug]
Local database container: supabase_db_sokofashion (check with docker ps)
Local test accounts after npm run db:fresh: owner1, owner2, owner3 and attendant1 at example.test, password Password123!
Account note: npm run db:reset deletes all local accounts, run npm run db:fresh instead.
Photo bucket: product-images (public read, 500 KB per file, WebP and JPEG only)
Photo table: product_images
Order tables: orders and order_items. Order reference looks like SF plus six characters. Order error codes: SF001 not enough stock, SF002 item not available, SF003 shop not available, SF004 shop has too many waiting orders, SF005 phone has too many unpaid orders, SF006 shop does not deliver, 22023 bad input.
Supabase staging project ref: (your 20 letter ref)
Supabase staging region: (your region)
Supabase production project:
Vercel project:
Domain:
Secrets (database password, service role key) are stored only in Bitwarden. Never in Git or chat.

## Real schema facts (checked on 18 November 2026, updated after Chunk 30b)

Tables: categories, countries, orders, order_items, product_images, product_variants, products, shop_invitations, shop_members, shops, stock_movements, and the view variant_stock (security invoker). RLS is on for every table.
Enums: product_status (draft, active, archived), shop_role (owner, manager, attendant), shop_status (active, suspended), stock_reason (opening, restock, sale, sale_return, adjustment, damage, reversal), order_status (awaiting_payment, paid, completed, cancelled, expired), delivery_method (pickup, delivery), shop_delivery_mode (pickup_only, free_delivery, paid_delivery).
Live product means products.status is active. A public shop must also have shops.status active. The shared page also needs shops.is_listed true (default true).
Shops also hold delivery_mode (default pickup_only), delivery_fee_minor and about (up to 500 characters, empty when blank).
New arrivals: a product is new for 14 days after created_at (D086).
Photos: product_images has id, shop_id, product_id, sort_order (1 to 4), storage_path, width, height, byte_size. The path is shop_id/product_id/image_id.ext for the main file and shop_id/product_id/image_id_t.ext for the thumbnail, with ext webp or jpg.
Stock: stock_movements.quantity_change summed per variant. Orders take stock with sale rows and give it back with reversal rows.
Variants: size, colour, shade, volume_ml, expires_on, price_minor (can be empty), is_active.
Anonymous visitors (anon) can read only categories and countries as tables, and can run only get_public_shop, get_public_product, get_public_browse, get_public_checkout_info and place_order. Signed in users can also run set_shop_listed, set_shop_delivery, set_shop_about, cancel_order and release_expired_orders, and each refuses by role or membership. Countries is read only for everybody (D068).
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
Rule: the browser never sends a price or a fee, the database decides both (D080, D082).
Rule: seller text never reaches a style, colour names go through a fixed lookup (D084).
Rule: npm run test (unit tests) and npm run db:test (database checks) are different suites with different counts.
Health check: http://localhost:3000/api/health

## Open questions

- Buyers cannot look up an order after leaving the confirmation screen. Chunk 31 adds a lookup by reference and phone, which needs rate limiting thought because references could be guessed.
- Sellers are not notified when an order arrives, they must open the Orders screen. Notifications need a channel that costs nothing (D030 explains why email is limited). To decide in Phase 6.
- Expiry now runs when a team member opens the orders list or when someone places an order for that shop. A scheduled job for shops nobody opens is planned for Phase 11.
- Delivery fees by area, and free delivery above a total: deferred (D081)
- Offers with a was price: deferred, needs a column and database checked prices (D086)
- The New window uses created_at, a real went live date column may replace it (D086)
- About text may contain phone numbers or promises, it is plain text only. Moderation tools come in Phase 10 and consumer protection wording goes to the Phase 12 lawyer.
- Place order uses plain form fields, move them to shared field components in a cleanup
- Final product name (SokoFashion is the project name, DukaLink is the provisional product name)
- Payment gateway for launch (Phase 7)
- Plan prices after talking to the 5 pilot friends and a few strangers
- Answers to the remaining pilot interview questions (delivery, past losses, what they would pay, how they take photos today). Answered: they confirm M-Pesa payments by checking the message on their own phone.
- Custom SMTP: buy a domain in Phase 12, or create pilot accounts by hand in the dashboard (D036)
- Staging email templates (confirmation and recovery) are locked until custom SMTP exists. Apply supabase/templates files in Phase 12.
- A Swahili speaker must confirm all Swahili text, including category names and the sayings on the public pages (Haba na haba, Pole pole, Kidole kimoja hakivunji chawa), before the pilot (D041)
- Storefront look: Soko Street (D079, D084). Lookbook and 3D stay deferred (D067).
- Lookbook data model (looks, outfits) and stock holding rules: after the pilot (D067)
- Moderation before strangers can sign up: shops are on the shared page by default (D072), so suspension tools (Phase 10) and a takedown process (Phase 12) are needed first
- Photo storage: about 100 to 200 KB per photo with its thumbnail, 100 MB cap per shop, Supabase free storage about 1 GB in total. Recheck the cost table at 100 and 1000 shops.
- Stray photo files if a delete fails: add a cleanup job in Phase 11
- Uploaded files are checked by declared type and size only, add scanning in Phase 11
- Changing which photo is the cover: not built yet
- Adding a new size or colour to an existing product, and switching a variant off: not built yet, add as a small chunk
- Older actions in photos and catalogue still carry their own copy of the shop lookup, move them to src/features/shops/access.ts in a cleanup
- History shows you or a team member, real names come with the audit trail in Phase 9
- Dates are shown in Kenyan time, give each shop its own time zone before other countries launch
- Owner feedback on how the Soko Street look, the add product form, the photo and stock screens feel
- Dark mode: revisit in Phase 11
- Price changes and stock write offs are not alerted on yet, the audit trail and alerts come in Phase 9
- VAT and eTIMS handling of prices and delivery fees: ask an accountant before Phase 6 goes live to real shops
- Cosmetics expiry and labelling rules: ask a lawyer or KEBS before the pilot
- Per variant prices exist in the database but the screens use one price per product
- The product list shows the newest 100 products only, add paging if a shop passes that
- Public shop and shared pages page through 48 products at a time with Back and More items links, and the page number is capped at 2000
- Confirm Pochi la Biashara details in Phase 7
- CAPTCHA, leaked password protection and stronger rate limits, including for public functions and place_order (Phase 11)
- A change password option for logged in users: add on a settings page later
- Team size limit and the catalogue and photo limits should later come from plan limits in the database
- Phone number login for sellers: needs a paid SMS provider, revisit after the pilot
- Generated TypeScript types for the database: deferred, results are checked with Zod instead (D051), revisit in Phase 11
- Font warning "Failed to find font override values" for Atkinson Hyperlegible Next: harmless, silence with adjustFontFallback false in src/app/layout.tsx if not done yet
- Lawyer questions for Phase 12: foreign Supabase region and Privacy Policy wording, collecting emails, collecting buyer names, phone numbers and delivery addresses, ODPC registration, browser storage notice for the cart, trademark and impersonation clause, prohibited and counterfeit goods and image rights clause, takedown process, marketplace duties for disputes and refunds, public price and consumer protection rules for online sellers, controller and processor roles for staff data, data processing agreement with the email provider, font licences, staff activity records and retention

## Notes for the next chat

Chunk 22c removed the parked migration that PR 36 merged by mistake (D066). Chunks 23 to 26 built the public storefront, the shared page with opt out and the browser cart (D068 to D077). The phases were swapped (D078). Chunk 27 added the order core and delivery fee (D080, D081), Chunk 28 the place order screen and delivery settings (D082), Chunk 29 the seller orders screen and release of expired orders (D083). Chunk 30a added the Soko Street look (D079, D084). Chunk 30b is in a pull request: shops.about and set_shop_about, new_count and is_new in get_public_shop and get_public_browse, the tally banner and New badges, and the owner About screen at /dashboard/about/[slug] (D085, D086), with 30 new database checks.

Next is Chunk 31. Plan: a public function that returns the status, items and totals of one order only when both the reference and the phone number match, with the same null answer for every wrong guess, a cap on how many guesses are allowed, and a receipt page for the buyer at /order, reachable from the confirmation screen. The abuse cases to test are guessing references, guessing phones, and reading another buyer's order.
