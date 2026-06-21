# Final QA checklist — pre & post launch

Run this before declaring a deployment live. Tick every box in production (the
real domain), not just locally.

---

## 1. Cross-browser

Test the home page, a car detail page, and the booking flow in each:

- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop / macOS)
- [ ] Edge (desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS) — **most important for the Moroccan mobile market**

## 2. Real mobile devices

- [ ] Layout responsive at 360px, 768px, 1024px+ (no horizontal scroll).
- [ ] Tap targets ≥ 44px; date picker usable by thumb.
- [ ] Images load fast on 3G/4G; no layout shift (CLS) as they load.
- [ ] Navbar / menu / language switcher work on touch.

## 3. Internationalization & RTL

- [ ] `/ar` renders **RTL** correctly (text, icons, layout mirrored).
- [ ] `/fr` renders **LTR** correctly.
- [ ] Language switcher preserves the current page.
- [ ] No untranslated keys / raw `messages.x.y` strings on any page.
- [ ] Dates, prices and currency format per locale.

## 4. Full booking flow (in production)

- [ ] Browse catalog → filters/sort work.
- [ ] Open a car → specs, gallery, price, availability calendar correct.
- [ ] Pick a date range → unavailable dates are disabled.
- [ ] Submit booking as guest → success screen with reference (`KR-…`).
- [ ] **PDF generated** and downloadable / linked.
- [ ] **WhatsApp message with the PDF arrives** on the agency number.
- [ ] Booking appears in **Admin → Bookings** as "pending".
- [ ] Try to double-book the same car/dates → gracefully rejected.
- [ ] Honeypot: a bot-filled `company` field is rejected.
- [ ] Clean up the test car + booking afterwards.

## 5. Admin dashboard

- [ ] Login works; wrong password rejected; `/admin` blocked when logged out.
- [ ] Cars CRUD: create, edit, image upload, reorder, availability toggle, delete.
- [ ] Availability: manual block creates an unavailable range publicly (no PII).
- [ ] Bookings: status changes (pending→confirmed→completed); confirmed blocks dates.
- [ ] Settings: editing name/colors/contact re-themes the live site.

## 6. Error & edge pages

- [ ] Visit a non-existent URL (`/ar/does-not-exist`) → branded **404** in the
      correct language + direction.
- [ ] 404 action buttons (home / browse cars) work.
- [ ] Forced runtime error shows the branded **500** boundary with retry.
- [ ] `global-error` fallback renders (bilingual) if the root layout fails.

## 7. SEO

- [ ] `sitemap.xml` lists all car slugs × locales; `robots.txt` resolves.
- [ ] `hreflang` ar↔fr present; canonical correct per page.
- [ ] Each page: unique title + 150–160 char description + OG/Twitter card.
- [ ] **Rich Results Test** passes: LocalBusiness/AutoRental (home/contact),
      Vehicle/Car + Offer (per car), BreadcrumbList, FAQPage.
- [ ] Schema Markup Validator: no errors.
- [ ] Image `alt` text present (AR/FR); logical H1/H2/H3.

## 8. Performance (Lighthouse, mobile profile)

Targets from CLAUDE.md — run on home + a car page:

- [ ] Performance ≥ 95
- [ ] SEO = 100
- [ ] Best Practices ≥ 95
- [ ] Accessibility ≥ 95
- [ ] Field CWV (Speed Insights): LCP < 2.5s, CLS < 0.1, INP < 200ms.

## 9. Accessibility (a11y)

- [ ] Keyboard-only: can navigate, open menus, complete a booking; visible focus.
- [ ] Screen reader: labels on all form fields; images have alt; landmarks present.
- [ ] Color contrast ≥ 4.5:1 for text (check brand colors against backgrounds).
- [ ] `dir`/`lang` set correctly per locale; no contrast/zoom breakage at 200%.

## 10. Security (post-deploy)

- [ ] [securityheaders.com](https://securityheaders.com) grade A (CSP, HSTS, etc.).
- [ ] HTTPS enforced; no mixed-content warnings; valid certificate.
- [ ] `pnpm audit` clean (no high/critical).
- [ ] Try reading `bookings` as anon via the Supabase REST API → denied (RLS).

## 11. Monitoring

- [ ] Vercel Analytics + Speed Insights receiving data.
- [ ] Uptime monitor on the site and on `wa.<domain>/status`.
- [ ] (If used) Sentry receiving events from the error boundaries.

---

**Sign-off:** deployment is live only when sections 1–11 pass on the production
domain. Record date + tester per client.
