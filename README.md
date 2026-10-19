# SokoFashion

A multi-tenant platform for small fashion and beauty sellers in East Africa. Each shop gets a public storefront, a private dashboard and an optional staff control module. Launch market: Kenya. Working product name: DukaLink.

## Tech stack

Next.js (App Router), TypeScript in strict mode, Tailwind CSS, Supabase (Postgres, Auth, Storage, Row Level Security), Vercel.

## Getting started

1. Install Node.js 24 LTS and Git.
2. Clone the repository and open a terminal in the project folder.
3. Run `npm install`. This also installs the Git hooks.
4. Copy `.env.example` to `.env.local` and fill in the values.
5. Run `npm run dev` and open http://localhost:3000.

## Useful commands

- `npm run dev` starts the development server.
- `npm run check` runs type check, lint, format check and build. This is what CI runs.
- `npm run format` formats every file.
  GitHub Actions also runs them on every pull request.

## Project layout

- `src/app` routes only
- `src/components/ui` reusable interface pieces
- `src/features` one folder per business area
- `src/lib` shared helpers, including validated environment variables
- `src/config` fixed settings such as countries and currencies
- `docs` architecture, decision records and project notes

## Documentation

- [Architecture overview](docs/architecture.md)
- [Decision records](docs/adr)
- [Project notes](docs/project)
- [Contributing](CONTRIBUTING.md)

## Database

Run Docker Desktop, then `npm run db:start`. Studio runs at http://127.0.0.1:54323. Use `npm run db:reset` to rebuild the local database from migrations. Change the database only through new migration files.

- Every new table that belongs to a shop must come with isolation tests in `supabase/tests/database` that try to read and change another shop's data.

Run `npm run db:fresh` to reset the local database and load sample data. It creates the accounts owner1, owner2, owner3 and attendant1 at example.test, all with the password Password123!, plus three sample shops. It refuses to run against anything except the local database. It needs SUPABASE_SERVICE_ROLE_KEY from `npm run db:status` in `.env.local`.
