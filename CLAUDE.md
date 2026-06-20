# CLAUDE.md — كراء (Kira) | نظام موقع وكالة كراء السيارات

> هذا الملف هو **السياق الدائم** لجميع جلسات Claude Code (Opus 4.8).
> اقرأه بالكامل قبل تنفيذ أي مرحلة. لا تخالف القرارات المعمارية المذكورة هنا.
> كل برومبت مرحلة في `prompts.md` يفترض أنك قرأت هذا الملف.

---

## 1. نظرة عامة على المشروع (Project Overview)

**الاسم المقترح:** كراء / Kira (غيّره حسب رغبتك)
**النوع:** موقع ويب متكامل (Full-stack) لوكالة كراء سيارات **واحدة**، مصمَّم كـ **قالب قابل لإعادة البيع** لعدة وكالات.
**اللغة الأساسية للسوق:** المغرب — العربية (افتراضي) + الفرنسية.

### الهدف الوظيفي
- موقع عمومي أنيق وسريع يعرض أسطول السيارات + يستقبل الحجوزات.
- **حجز ضيف بدون تسجيل** (Guest only) لرفع نسبة التحويل.
- لوحة تحكم لصاحب الوكالة: إدارة السيارات، التوفر، الحجوزات، الإعدادات.
- عند كل حجز: توليد **PDF احترافي** + إرساله **تلقائيا لواتساب صاحب الوكالة عبر بوابة Baileys مجانية** مستضافة ذاتيا.
- التركيز الأساسي: **الأداء + التجاوب + التصميم + SEO**.

### القرارات المعمارية المحسومة (لا تغيّرها)
1. **وكالة واحدة لكل نشر** (single-tenant per deployment). كل عميل = نشر مستقل بإعداداته الخاصة.
2. **حجز ضيف فقط** — لا حسابات للزبائن. المصادقة فقط لصاحب الوكالة (admin واحد).
3. **بوابة Baileys مجانية مستضافة ذاتيا** لإرسال PDF للواتساب (مجاني تماما؛ تعمل كخدمة منفصلة لأن Vercel لا يشغّل اتصالا دائما).
4. كل الهوية (اسم، شعار، ألوان، رقم واتساب، عملة، لغات) **مدفوعة بالإعدادات** (env + `agency_settings`) حتى تُعاد إعادة النشر بسهولة.

---

## 2. حزمة التقنيات (Tech Stack) — إصدارات يونيو 2026

| الطبقة | التقنية | ملاحظات |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Turbopack افتراضي، React Compiler مستقر، Node 20+ |
| Language | **TypeScript** (strict) | `strict: true`, لا `any` |
| UI | **React 19** + **Tailwind CSS 4** | utility-first |
| Components | **shadcn/ui** (Radix) | accessible + themeable |
| State/Data (client) | **TanStack Query 5** | للوحة التحكم والأجزاء التفاعلية فقط |
| Backend/DB | **Supabase** (PostgreSQL + RLS + Auth + Storage) | مصدر الحقيقة الوحيد |
| Image storage | **Supabase Storage** + `next/image` | بديل اختياري: Cloudinary إذا كبر حجم الصور |
| Forms | **React Hook Form** + **Zod** | تحقق موحّد client + server |
| Dates | **date-fns** + **react-day-picker** | منتقي مدى التواريخ |
| PDF | **@react-pdf/renderer** | pure JS، آمن على Vercel serverless (بلا Chromium) |
| WhatsApp | **Baileys** (gateway مستضاف ذاتيا) | **مجاني**، WebSocket، يرسل PDF برقم الوكالة نفسه. بديل أسهل بلا كود: **Evolution API** (REST حول Baileys) |
| WhatsApp host | **Oracle Cloud Always Free** (أو Raspberry Pi / VPS رخيص ~$4) | عملية دائمة التشغيل للـ gateway — **Vercel لا يستطيع تشغيلها** |
| i18n | **next-intl** | ar (افتراضي) + fr، hreflang |
| Hosting | **Vercel** | دومين + استضافة + ISR |
| Analytics | **Vercel Analytics + Speed Insights** | + Sentry اختياري للأخطاء |
| Email (اختياري) | **Resend** | نسخة احتياطية من الحجز لإيميل صاحب الوكالة |
| Tooling | **pnpm** + ESLint + Prettier + Husky + lint-staged | Vitest (unit) + Playwright (e2e اختياري) |

### لماذا هذه الاختيارات (للمطور المنفرد)
- **Next.js 16 على Vercel**: نشر بنقرة، ISR، Server Components، أداء افتراضي ممتاز، صفر ops.
- **Supabase**: قاعدة بيانات + auth + storage + realtime في خدمة واحدة = أقل خدمات لكل عميل.
- **@react-pdf/renderer بدل Puppeteer**: على Vercel، حد الحزمة 250MB وبنية Chromium ~300MB ولا يدعم spawn subprocess. هذه المكتبة pure JS وتشتغل في أي مكان بلا متصفح.
- **Baileys (gateway مستقل)**: **مجاني تماما** ويستعمل رقم الوكالة نفسه (مسح QR مرة واحدة). لكنه يحتاج **اتصال WebSocket دائم + جلسة محفوظة** لا يدعمهما Vercel serverless، لذا يعمل كـ **خدمة منفصلة** على مضيف دائم التشغيل (Oracle Cloud Always Free مجاني بشكل دائم، أو Raspberry Pi). الـ Next.js على Vercel ينادي هذا الـ gateway عبر webhook مؤمَّن بمفتاح. بديل بلا كتابة كود: **Evolution API** (Docker، REST حول Baileys).

> ⚠️ **لا تستعمل** `pdf-lib` لبناء التصميم من الصفر (آخر تحديث 2021). ولا `Puppeteer/Playwright` **ولا** `Baileys/whatsapp-web.js` **داخل** Vercel serverless — مكتبات الواتساب تحتاج عملية دائمة وجلسة محفوظة، لذا تعمل حصريا في الـ gateway المنفصل.
> ⚖️ **مقايضة الواتساب المجاني:** Baileys غير رسمي (يحاكي WhatsApp Web)؛ يوجد خطر حظر الرقم إذا أُسيء الاستعمال (سبام). للاستعمال بحجم منخفض (إشعار حجز واحد لصاحب الوكالة) الخطر منخفض، ويُفضّل رقم مخصص. قد تنقطع الجلسة فتحتاج إعادة مسح QR. هذا ثمن المجانية مقابل خدمة مدفوعة مُدارة.
> 💰 **التكلفة = 0:** لا رسوم لكل رسالة ولا اشتراك. إرسال PDF الحجز للواتساب مجاني بالكامل (Baileys + رقم الوكالة + مضيف دائم مجاني مثل Oracle Cloud Always Free أو Raspberry Pi أو حاسوب مكتب الوكالة). الشرط الوحيد: جهاز دائم التشغيل. عند تعطّل البوابة، الإرسال يُعاد لاحقا (retry) ولا يفشل الحجز.

---

## 3. بنية المجلدات (Folder Architecture)

```
kira/
├─ app/
│  ├─ [locale]/                  # next-intl: ar | fr
│  │  ├─ (public)/               # الموقع العمومي
│  │  │  ├─ page.tsx             # الرئيسية
│  │  │  ├─ cars/                # الكتالوج
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [slug]/page.tsx   # تفاصيل السيارة
│  │  │  ├─ book/[slug]/         # تدفق الحجز
│  │  │  └─ contact/page.tsx
│  │  └─ admin/                  # لوحة التحكم (محمية)
│  │     ├─ layout.tsx
│  │     ├─ page.tsx             # نظرة عامة
│  │     ├─ cars/                # CRUD السيارات
│  │     ├─ availability/        # إدارة التوفر
│  │     ├─ bookings/            # الحجوزات
│  │     └─ settings/            # إعدادات الوكالة
│  ├─ api/                       # route handlers عند الحاجة
│  ├─ sitemap.ts
│  ├─ robots.ts
│  └─ globals.css
├─ components/
│  ├─ ui/                        # shadcn/ui
│  ├─ public/                    # مكونات الموقع العمومي
│  ├─ admin/                     # مكونات اللوحة
│  └─ pdf/                       # قوالب @react-pdf/renderer
├─ server/
│  ├─ queries.ts                 # قراءات (Server Components)
│  ├─ mutations.ts               # Server Actions
│  └─ availability.ts            # منطق التوفر
├─ lib/
│  ├─ supabase/                  # عملاء (server, client, admin/service-role)
│  ├─ wa-gateway.ts              # عميل ينادي خدمة الواتساب (webhook)
│  ├─ pdf.ts                     # توليد PDF
│  ├─ validations/               # مخططات Zod
│  └─ utils.ts
├─ config/
│  └─ site.config.ts            # الهوية المدفوعة بالـ env
├─ i18n/
│  └─ messages/ (ar.json, fr.json)
├─ types/
│  └─ database.types.ts          # مولّد من Supabase
├─ supabase/
│  └─ migrations/
└─ docs/
   └─ redeploy-playbook.md       # دليل إعادة النشر لعميل جديد
```

### خدمة الواتساب المنفصلة (WhatsApp Gateway) — repo/خدمة مستقلة
```
kira-wa-gateway/                  # repo منفصل، يعمل على مضيف دائم التشغيل (Oracle/Pi/VPS)
├─ src/
│  ├─ index.ts                    # خادم Express صغير + اتصال Baileys
│  ├─ baileys.ts                  # makeWASocket + useMultiFileAuthState + reconnect
│  └─ routes.ts                   # POST /send-document (محمي بـ API key), GET /status, GET /qr
├─ auth_info_baileys/             # جلسة الواتساب المحفوظة (تبقى على القرص)
├─ Dockerfile
└─ .env                           # API_KEY, PORT
```
> هذا الـ gateway هو الجزء الوحيد الذي **لا** يعيش على Vercel. بديل بلا كتابة كود: شغّل حاوية **Evolution API** وَنادِ REST endpoints ديالها مباشرة من `lib/wa-gateway.ts`.

---

## 4. مخطط قاعدة البيانات (Database Schema)

### الجداول

**`agency_settings`** (صف واحد singleton — يقود الهوية والـ SEO)
- `id`, `name`, `name_ar`, `name_fr`, `logo_url`, `primary_color`, `secondary_color`
- `phone`, `whatsapp_number`, `email`, `address`, `address_ar`, `lat`, `lng`
- `currency` (افتراضي: `MAD`), `opening_hours` (jsonb), `social_links` (jsonb)
- `locales` (text[]), `seo_title`, `seo_description`, `og_image_url`
- `created_at`, `updated_at`

**`cars`**
- `id`, `slug` (unique), `name`, `name_ar`, `brand`, `model`, `year`
- `category` (economy | suv | luxury | van | sedan | ...), `transmission` (manual | automatic)
- `fuel_type`, `seats`, `doors`, `price_per_day` (numeric), `price_per_week` (nullable), `deposit`
- `features` (text[]), `description`, `description_ar`, `description_fr`
- `is_available` (bool — مفتاح رئيسي للإخفاء/الإظهار), `sort_order`
- `created_at`, `updated_at`

**`car_images`**
- `id`, `car_id` (fk → cars, on delete cascade), `url`, `storage_path`
- `alt`, `alt_ar`, `is_primary` (bool), `sort_order`

**`bookings`**
- `id`, `car_id` (fk → cars), `customer_name`, `customer_phone`, `customer_email` (nullable)
- `period` (**daterange**), `start_date`, `end_date` (مشتقة للعرض)
- `pickup_location`, `dropoff_location` (nullable), `total_days`, `total_price`
- `extras` (jsonb), `status` (pending | confirmed | cancelled | completed)
- `notes`, `pdf_url` (nullable), `whatsapp_sent` (bool default false)
- `reference` (مثال: `KR-2026-000123`), `created_at`

**`blocked_periods`** (حجب يدوي من صاحب الوكالة: صيانة، حجز هاتفي…)
- `id`, `car_id` (fk → cars), `period` (**daterange**), `reason`, `note`, `created_at`

### منطق التوفر (مهم جدا)
- استعمل نوع `daterange` (أو `tstzrange`) + **`EXCLUDE USING gist`** على `(car_id WITH =, period WITH &&)` لكل من `bookings` (للحالة confirmed) و`blocked_periods` لمنع التداخل على مستوى قاعدة البيانات.
- دالة `is_car_available(car_id uuid, p_start date, p_end date) RETURNS boolean` تتحقق من عدم تداخل المدى مع أي حجز confirmed أو فترة محجوبة.
- **View عمومي** `car_unavailable_ranges(car_id, start_date, end_date)` يُرجِع **مديات التواريخ فقط بدون أي بيانات شخصية** — يُستعمل لتلوين/تعطيل التواريخ في الواجهة وتقويم التوفر.

### RLS (Row Level Security) — تشغيلها على كل الجداول
- **anon (عمومي):** `SELECT` على `cars` (where is_available), `car_images`, `agency_settings`, و`car_unavailable_ranges`. **ممنوع** قراءة `bookings` (تحتوي PII) أو `blocked_periods` تفصيليا.
- **إنشاء الحجز:** لا تفتح `INSERT` لـ anon مباشرة. الحجز يُنشأ عبر **Server Action تستعمل service-role key** بعد إعادة التحقق من التوفر داخل transaction.
- **authenticated owner (admin):** صلاحية كاملة على كل الجداول.

---

## 5. قواعد العمل والأمان (Conventions & Security)

- **TypeScript strict** — لا `any`، لا `@ts-ignore` بدون سبب موثّق.
- **التحقق مزدوج:** نفس مخطط Zod على client و server. لا تثق أبدا بمدخلات الواجهة.
- **الأسرار server-only:** `SUPABASE_SERVICE_ROLE_KEY`, `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY` لا تُسرّب للمتصفح إطلاقا (لا `NEXT_PUBLIC_` لها). ومفتاح الـ gateway (`API_KEY`) يبقى داخل خدمة الواتساب فقط.
- **منع الحجز المزدوج** يعتمد على قيد قاعدة البيانات (exclusion constraint)، وليس فقط على فحص التطبيق. عالج خطأ التعارض برسالة لطيفة.
- **idempotency** في إرسال الواتساب: لا ترسل PDF مرتين لنفس الحجز (راقب `whatsapp_sent`).
- **حماية السبام** في نموذج الحجز: honeypot + rate limit بسيط (+ Cloudflare Turnstile اختياري).
- **Server Components أولا**؛ استعمل `'use client'` فقط عند الحاجة للتفاعل.
- **أمان الواجهة:** security headers (CSP), sanitization للمدخلات، canonical + noindex للصفحات الإدارية.

---

## 6. التصميم والأداء (Design & Performance)

### الهوية البصرية (قابلة للتخصيص لكل عميل)
- نظام **CSS variables** يُقرأ من `site.config.ts` + `agency_settings` (primary/secondary color, logo).
- دعم **RTL** للعربية و**LTR** للفرنسية عبر `dir` على مستوى `[locale]`.
- جمالية: عصرية، فاخرة، "automotive premium" — مساحات بيضاء، صور سيارات بطل، تباين قوي، حركات لطيفة وخفيفة.
- مكوّنات متجاوبة mobile-first عبر 3 نقاط كسر على الأقل.

### ميزانيات الأداء (Performance Budgets) — التزم بها
- **Lighthouse:** Performance ≥ 95، SEO = 100، Best Practices ≥ 95، Accessibility ≥ 95 على الصفحات الرئيسية.
- **Core Web Vitals:** LCP < 2.5s، CLS < 0.1، INP < 200ms.
- صور: AVIF/WebP عبر `next/image`، `priority` لصورة LCP، أبعاد محجوزة لمنع CLS.
- خطوط: `display: swap` + subsetting (عربي + لاتيني).
- ISR/caching لصفحات الكتالوج والتفاصيل؛ تحليل الحزمة وتقليل JS على العميل.

### استراتيجية SEO (تركيز أساسي)
- `generateMetadata` لكل صفحة: title، description (150–160 حرف)، canonical، Open Graph، Twitter.
- **JSON-LD structured data:**
  - `LocalBusiness` > `AutoRental` (الرئيسية/الاتصال): ساعات العمل، الموقع، الشعار، الخدمات.
  - `Product` > `Vehicle` > `Car` + `Offer` (لكل صفحة سيارة): السعر، المواصفات، التوفر.
  - `BreadcrumbList` + `FAQPage` (يساعد كذلك محركات/نماذج الذكاء) + `AggregateRating` (إن وُجدت تقييمات).
- `sitemap.xml` ديناميكي (كل الـ slugs × اللغات) + `robots.txt`.
- **hreflang** صحيح بين ar/fr + canonical لكل لغة.
- روابط SEO-friendly (slugs واضحة)، alt للصور، عناوين H1/H2/H3 منطقية.
- **تجنّب** أنظمة الحجز داخل `iframe` (غير قابلة للزحف). تدفق الحجز يجب أن يكون قابلا للزحف.
- تحقق دائما عبر **Rich Results Test** و**Schema Markup Validator**.

---

## 7. عقد التنفيذ لكل مرحلة (Per-Phase Execution Contract)

عند تنفيذ أي مرحلة من `prompts.md`:
1. اقرأ `CLAUDE.md` كاملا أولا.
2. لا تتجاوز نطاق المرحلة الحالية (no scope creep). ما تبنيش حاجة ديال مرحلة جاية.
3. لا تكسر ما بُني في المراحل السابقة (no regressions).
4. في آخر كل مرحلة: شغّل `pnpm lint && pnpm build`، وتحقق من **Definition of Done** بندا بندا.
5. وثّق أي قرار تقني مهم اتخذته في `docs/` أو في تعليق واضح.
6. اكتب كودا نظيفا، مقسّما، قابلا للصيانة، مع أنواع TypeScript دقيقة.

---

## 8. متغيرات البيئة (Environment Variables)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only

# WhatsApp Gateway (server-only) — خدمة Baileys/Evolution المستضافة ذاتيا
WA_GATEWAY_URL=                     # مثال: https://wa.yourdomain.com (عنوان الخدمة على Oracle/Pi/VPS)
WA_GATEWAY_API_KEY=                 # سر مشترك لتأمين الـ webhook بين Vercel والـ gateway
AGENCY_WHATSAPP_NUMBER=             # رقم استقبال الحجوزات (واتساب صاحب الوكالة)

# Branding / per-client (تُقرأ في site.config.ts)
NEXT_PUBLIC_SITE_NAME=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_DEFAULT_LOCALE=ar
NEXT_PUBLIC_CURRENCY=MAD
NEXT_PUBLIC_LOGO_URL=                # رابط صورة الشعار (فارغ = أيقونة + اسم الموقع)

# اختياري
RESEND_API_KEY=
SENTRY_DSN=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```
