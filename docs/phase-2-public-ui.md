# Phase 2 — Public UI (home · catalog · car detail)

The public-facing storefront: landing page, filterable catalog, and a car
detail page with an availability calendar. Design + performance focused;
**no booking submission** (that is Phase 3 — the "Book now" button only
routes to a placeholder `/book/[slug]`).

## What was built

### Pages

| Route                   | File                                         | Notes                                                               |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `/[locale]` (home)      | `app/[locale]/(public)/page.tsx`             | Hero + quick search, value props, featured cars, about/CTA          |
| `/[locale]/cars`        | `app/[locale]/(public)/cars/page.tsx`        | Catalog: URL-driven filters/sort, Suspense-streamed results         |
| `/[locale]/cars/[slug]` | `app/[locale]/(public)/cars/[slug]/page.tsx` | Gallery + lightbox, specs, features, availability calendar, JSON-LD |
| `/[locale]/book/[slug]` | `app/[locale]/(public)/book/[slug]/page.tsx` | Placeholder (`noindex`); real flow in Phase 3                       |

### Components (`components/public/`)

- `hero.tsx` — LCP hero (priority image + reserved aspect ratio) hosting `quick-search`.
- `quick-search.tsx` _(client)_ — category + date-range → routes to `/cars?…`.
- `value-props.tsx`, `about-section.tsx`, `featured-cars.tsx` — home sections.
- `car-card.tsx` — shared catalog/featured card (Server Component, stretched-link pattern, zero client JS).
- `car-card-skeleton.tsx` — `CarCardSkeleton` + `CarGridSkeleton` (Suspense fallback).
- `car-filters.tsx` _(client)_ — filters/sort that read & write URL search params; mobile dialog + desktop sidebar.
- `car-results.tsx` _(async server)_ — fetch → filter → optional availability filter → grid/empty.
- `car-gallery.tsx` _(client)_ — main image + thumbnails + accessible lightbox (Radix Dialog, arrow keys).
- `availability-calendar.tsx` _(client)_ — read-only calendar; disables past + booked dates.
- `footer.tsx` — now async; contact details pulled from `agency_settings`.

### Shared logic (`lib/`)

- `display.ts` — pure presentation helpers (`carName`, `carDescription`, `imageAlt`, `primaryImage`, `galleryImages`, `formatPrice`). Safe in both server & client.
- `catalog.ts` — `parseFilters` / `applyFilters` over typed search params, plus the `CATEGORIES`/`TRANSMISSIONS`/`SORT_OPTIONS`/`SEAT_OPTIONS` constants.

## Key decisions

- **URL is the single source of truth for catalog state.** Filters & sort
  live entirely in `searchParams`, so every view is shareable, bookmarkable,
  crawlable and survives back/forward. The `<Suspense>` boundary is keyed on
  the serialized params so changing a filter re-shows the skeleton while the
  new set streams in.
- **Availability semantics.** `car_unavailable_ranges` exposes half-open
  `[start, end)` ranges (`end` = exclusive drop-off). The calendar therefore
  disables `[start, end − 1]`. Catalog date filtering reuses the existing
  `is_car_available` RPC (a few parallel boolean calls — fine for a small
  single-agency fleet) and never touches PII.
- **Performance / CLS.** All images use `next/image` with reserved
  aspect-ratio boxes; the hero and the detail gallery's first image carry
  `priority` + `fetchPriority="high"` (LCP), everything else lazy-loads.
  Remote hosts (`*.supabase.co`, `placehold.co` for seed data) were added to
  `next.config.ts` `images.remotePatterns`.
- **Server-first.** Only genuinely interactive pieces are Client Components
  (quick search, filters, gallery, calendar). Cards, sections and the detail
  body are Server Components with no client JS.
- **SEO.** Per-page `generateMetadata` (canonical + hreflang for ar/fr) and
  `Car`/`Offer` JSON-LD on the detail page. Booking pages are `noindex`.
- **i18n.** Dynamic enum values (categories, transmission, fuel, features)
  are translated via namespaced keys with a `t.has()` fallback to the raw
  value, so unknown DB values never crash the UI.

## Verification

- `pnpm lint` ✓ and `pnpm build` ✓ (TypeScript strict, incl.
  `noUncheckedIndexedAccess`).
- Runtime data rendering requires Supabase env vars
  (`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`); without them the data pages
  surface the Phase-1 query error. Non-DB routes (e.g. `/contact`) and the
  app shell render fine, and the footer degrades gracefully when settings
  can't be read.
