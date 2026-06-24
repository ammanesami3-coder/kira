# Phase 7 — Marketing sections & motion layer

Polish pass over the public site: complementary marketing sections plus a
performance-respecting animation/transition layer. No changes to data, booking
or admin flows.

## New sections & pages

- **Home** (`app/[locale]/(public)/page.tsx`) now composes:
  Hero → TrustBadges → HowItWorks → FleetCategories → FeaturedCars → ValueProps
  → Stats → Testimonials → FaqSection → CtaBand.
- **`/about`** — story, values, animated stat counters (`aboutPage.*`).
- **`/faq`** — dedicated page reusing `FaqSection`, emits `FAQPage` +
  `BreadcrumbList` JSON-LD.
- Components added under `components/public/`: `trust-badges`, `how-it-works`,
  `fleet-categories` (deep-link into `/cars?category=…`), `testimonials`,
  `stats`, `cta-band`, `social-links` (inline brand SVGs — lucide dropped its
  brand set), `location-map` (lazy Google Maps embed).
- Footer gained a Company column (about/faq), social icons (from
  `agency_settings.social_links`) and a direct WhatsApp row. Navbar surfaces
  About + FAQ. Contact page gained prominent call / WhatsApp buttons and a
  lazily-mounted map.

## SEO

- `AggregateRating` is attached to the `AutoRental` node on the home page. Its
  values live in `components/public/testimonials.ts` (`AGGREGATE_RATING`) and
  are the single source of truth for both the visible rating and the schema.
- `FAQPage` schema is emitted on both the home page and `/faq`, built from the
  same `faq.items.*` messages the accordion renders (always in sync).
- `/about` and `/faq` are in `app/sitemap.ts` with hreflang alternates and have
  full `generateMetadata` (title/description/canonical/OG/Twitter).

## Animation layer (Motion)

- Dependency: **`motion`** (Motion for React, v12) — the only animation lib.
- `lib/animations.ts` holds shared variants (`fadeInUp`, `fadeIn`, `scaleIn`,
  `staggerContainer`) and the viewport config. Every effect is **transform /
  opacity only** (GPU-composited → no layout/paint, CLS-safe).
- Thin client wrappers in `components/motion/`: `Reveal` (scroll-reveal via
  `whileInView`, once), `Stagger`/`StaggerItem` (card grids), `Counter`
  (count-up stats), `MotionProvider` (`<MotionConfig reducedMotion="user">`).
- Reveal/Stagger wrap Server-Component subtrees, so revealed content stays
  server-rendered and in the DOM (crawlable / screen-reader visible); only the
  motion shell is client JS.
- **Reduced motion:** `MotionConfig reducedMotion="user"` collapses transform
  animations to opacity-only; `Counter` skips the tween; CSS disables the hero
  ken-burns and all view-transition animations under
  `@media (prefers-reduced-motion: reduce)`.

### Hero

The hero copy is intentionally **not** wrapped in a reveal so the LCP region
(H1 + image) paints immediately. Motion comes from a CSS-only `ken-burns`
zoom/pan on the `priority` image (transform-only, paused under reduced motion).

## Page transitions — View Transitions API

- Enabled via `experimental.viewTransition: true` in `next.config.ts`. Next
  wraps client-side navigations in `document.startViewTransition`, giving a
  calm crossfade (duration tuned in `globals.css`).
- **Shared-element morph** catalog ↔ detail: the catalog card image and the
  detail gallery's primary image share `view-transition-name: car-<slug>` (set
  inline), so the image morphs in place on navigation. Names are unique per
  page (slugs are unique), as the API requires.
- Smooth in-page anchor scrolling via `scroll-behavior: smooth`
  (reduced-motion-guarded); sticky-navbar offset via `scroll-margin-top` on
  anchored `section[id]`.

## Security / CSP

`frame-src` in the CSP (`next.config.ts`) was extended with
`https://www.google.com https://maps.google.com` for the contact-page map
embed. The map iframe is mounted only when scrolled into view (`location-map`)
so it never sits on the critical path.
