# كراء · Kira

Full-stack website template for a **single car-rental agency**, built to be
re-sold and redeployed per client by changing configuration only. Arabic
(default, RTL) + French (LTR).

> Architecture & decisions live in [`CLAUDE.md`](./CLAUDE.md). This README
> covers running the project. **Phase 0** = project foundation only (no cars,
> bookings or admin dashboard yet).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
shadcn/ui (Radix) · next-intl · Supabase (clients wired, schema later) ·
pnpm · ESLint · Prettier · Husky + lint-staged.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in / adjust values
pnpm dev                     # http://localhost:3000  → /ar
```

### Scripts

| Script           | Description                      |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start the dev server (Turbopack) |
| `pnpm build`     | Production build                 |
| `pnpm start`     | Run the production build         |
| `pnpm lint`      | ESLint                           |
| `pnpm typecheck` | TypeScript, no emit              |
| `pnpm format`    | Prettier write                   |

## Theming (per-agency)

Identity is driven by `NEXT_PUBLIC_*` env vars read in
[`config/site.config.ts`](./config/site.config.ts). Brand colors are injected
as CSS variables on `<html>`, so changing `NEXT_PUBLIC_PRIMARY_COLOR` or
`NEXT_PUBLIC_SITE_NAME` re-themes/relabels the entire site with no code edits.
See [`docs/redeploy-playbook.md`](./docs/redeploy-playbook.md).

## Internationalization

`ar` (default, `dir=rtl`) and `fr` (`dir=ltr`) via next-intl. Routes are
locale-prefixed (`/ar`, `/fr`); messages live in `i18n/messages/`.

## Project layout

See section 3 of [`CLAUDE.md`](./CLAUDE.md). Folders for later phases
(`admin`, `book`, `cars/[slug]`, `server/*`, `lib/pdf`, `lib/wa-gateway`) are
scaffolded as placeholders.

## Quality gate

A Husky `pre-commit` hook runs `lint-staged` (ESLint + Prettier) and a full
`pnpm typecheck`, blocking commits that fail linting or type-checking.
