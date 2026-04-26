# AGENTS.md — SitConnect Events Platform

> **Purpose:** This file is the single source of truth for any developer or AI agent working on this project. It documents the full project architecture, rules, conventions, integrations, and guidelines.

---

## 1. Project Overview

**SitConnect** (package name: `events-app`) is a comprehensive education events platform built for **Study in Türkiye (SIT)** / **Fuar inn**. It manages education fairs where universities meet prospective students.

### Core Capabilities
- 🌐 **Public Website** — Multilingual event listings, student registration, QR-code digital passes
- 📊 **Admin Dashboard** — Event CRUD, registration management, analytics, user management
- 📱 **Mobile QR Scanner** — On-site check-in via camera (QR or manual search)
- 🏫 **University Portal** — University-facing dashboard for viewing favorites, participating in events
- 🖥️ **Kiosk Mode** — On-site self-registration kiosk for walk-in students
- 📧 **Notifications** — Automated email (Resend) & WhatsApp (Twilio/n8n) confirmations
- 🤖 **AI Enrichment** — OpenAI-powered normalization of registrant majors and gender inference
- 🔗 **CRM Integration** — Zoho CRM lead creation on registration
- 📄 **Paperless Events** — University file/brochure management with digital delivery to students via QR scan
- 🏆 **Red Points Gamification** — Point-based booth visit tracking with tier system and gift redemption

---

## 2. Tech Stack

| Layer | Technology | Version/Notes |
|---|---|---|
| **Framework** | Next.js (App Router) | v16.1.4, React 19 |
| **Language** | TypeScript | v5+ |
| **Database** | PostgreSQL | Hosted on Supabase |
| **ORM** | Prisma | v5.22.0, with PgBouncer pooling |
| **Auth** | NextAuth.js v5 (beta) | JWT strategy, 30-day sessions |
| **Styling** | Tailwind CSS v3 + shadcn/ui (New York style) | CSS variables design system |
| **UI Components** | Radix UI primitives via shadcn/ui | See `components.json` |
| **Animations** | Framer Motion | v12+ |
| **Forms** | React Hook Form + Zod | Validation via `src/lib/validations.ts` |
| **Email** | Resend | Transactional emails with QR attachments |
| **WhatsApp** | Twilio (primary) / n8n webhook (fallback-first) | E.164 phone format |
| **AI** | OpenAI API (gpt-4o-mini) | Registrant data enrichment |
| **CRM** | Zoho CRM | OAuth2 token refresh, lead creation |
| **Charts** | Recharts + D3 | Admin analytics |
| **QR Codes** | `qrcode` library | Generated as PNG buffer/data URL |
| **i18n** | next-intl v4 | 9 locale files, 3 active routing locales |
| **Icons** | Lucide React | |
| **Maps** | react-simple-maps | Geographic analytics |
| **Toasts** | Sonner | |
| **File Parsing** | PapaParse (CSV), xlsx (Excel) | Import/export |
| **Sanitization** | isomorphic-dompurify | XSS prevention on custom scripts |

---

## 3. Project Structure

```
SitEvent/
├── AGENTS.md                 # ★ This file — project documentation
├── README.md                 # Quick start guide
├── CHANGELOG.md              # Version history
├── package.json              # Dependencies & scripts
├── next.config.ts            # Next.js config (i18n, images, security headers)
├── tailwind.config.ts        # Tailwind with custom design tokens
├── components.json           # shadcn/ui configuration (New York style)
├── tsconfig.json             # TypeScript configuration
├── postcss.config.js         # PostCSS (Tailwind)
├── eslint.config.mjs         # ESLint config
├── .gitignore                # Git exclusions
├── .npmrc                    # npm configuration
│
├── prisma/
│   ├── schema.prisma         # ★ Database schema (all models & enums)
│   ├── migrations/           # Prisma migration history
│   ├── seed.ts               # Main seeder (sample events, admin users)
│   ├── seed-locations.ts     # Location (countries/cities) seeder
│   └── seed-usher.ts         # Usher account seeder
│
├── messages/                 # i18n translation files
│   ├── en.json               # English (primary, ~25KB)
│   ├── ar.json               # Arabic (primary, ~25KB)
│   ├── tr.json               # Turkish (primary, ~22KB)
│   ├── de.json               # German
│   ├── es.json               # Spanish
│   ├── fa.json               # Farsi
│   ├── fr.json               # French
│   ├── ru.json               # Russian
│   └── zh.json               # Chinese
│
├── n8n/                      # n8n automation workflow exports
│   ├── google-sheet-import.json
│   └── whatsapp-sender.json
│
├── scripts/                  # Utility/debug scripts (run via tsx)
│   ├── seed-event.ts
│   ├── create-uni-user.ts
│   ├── backfill-ai-leads.ts
│   ├── verify-whatsapp.ts
│   ├── test-email.ts / test-email-real.ts
│   └── ...
│
├── public/                   # Static assets
│   ├── favicon.ico / icon.png
│   └── logo-red.svg
│
└── src/
    ├── middleware.ts          # next-intl middleware (locale routing)
    │
    ├── i18n/
    │   ├── routing.ts        # Locale config: ['en', 'tr', 'ar'], default 'en'
    │   └── request.ts        # Server-side locale resolution
    │
    ├── types/
    │   └── next-auth.d.ts    # NextAuth type augmentation
    │
    ├── hooks/
    │   └── use-geolocation.ts # Browser geolocation hook
    │
    ├── lib/
    │   ├── auth.ts           # ★ NextAuth config (3 providers)
    │   ├── db.ts             # Prisma client singleton (PgBouncer-aware)
    │   ├── email.ts          # Resend email service (confirmation, reminder, exhibitor)
    │   ├── whatsapp.ts       # Twilio/n8n WhatsApp service
    │   ├── qr.ts             # QR code generation (token, URL, buffer, data URL)
    │   ├── ai.ts             # OpenAI registrant enrichment (major, gender)
    │   ├── zoho.ts           # Zoho CRM lead creation (OAuth2)
    │   ├── rate-limit.ts     # In-memory rate limiter
    │   ├── role-check.ts     # Server-side role authorization helpers
    │   ├── utils.ts          # Misc utilities (cn function)
    │   ├── validations.ts    # Zod schemas (registration, event, login, check-in, exhibitor)
    │   ├── timezones.ts      # Timezone data
    │   ├── supabase-client.ts # Supabase JS client (for storage)
    │   ├── constants/
    │   │   └── countries.ts  # Country list with codes
    │   ├── services/
    │   │   └── openai.ts     # OpenAI content generation (university, city)
    │   ├── actions/
    │   │   ├── user-actions.ts       # Admin user CRUD server actions
    │   │   ├── university-actions.ts # University CRUD server actions
    │   │   └── template-actions.ts   # Message template server actions
    │   └── validations/
    │       └── session.ts    # Session validation
    │
    ├── components/
    │   ├── ui/               # ★ shadcn/ui components (31 files)
    │   │   ├── button.tsx, card.tsx, dialog.tsx, form.tsx, input.tsx...
    │   │   ├── motion.tsx    # Framer Motion animation wrappers
    │   │   ├── translatable-input.tsx # Multi-language input component
    │   │   ├── image-upload.tsx / multi-image-upload.tsx
    │   │   └── wave-separator.tsx
    │   │
    │   ├── public/           # Public-facing components
    │   │   ├── header.tsx    # Main navigation with language switcher
    │   │   ├── footer.tsx    # Site footer
    │   │   ├── language-switcher.tsx
    │   │   ├── countdown-timer.tsx
    │   │   ├── exhibitor-form.tsx
    │   │   ├── image-carousel.tsx
    │   │   ├── calendar-download-button.tsx
    │   │   └── ticket-recovery-dialog.tsx
    │   │
    │   ├── admin/            # Admin dashboard components
    │   │   ├── sidebar.tsx   # Admin navigation sidebar
    │   │   ├── events/       # Event form, list components
    │   │   ├── registrations/ # Registration management
    │   │   ├── analytics/    # Analytics chart components
    │   │   ├── dashboard/    # Dashboard widgets
    │   │   └── DuplicateEventButton.tsx
    │   │
    │   ├── university/       # University portal components
    │   │   ├── dashboard-client.tsx    # University dashboard
    │   │   ├── analytics-client.tsx    # University analytics
    │   │   ├── analytics-charts.tsx
    │   │   ├── event-detail-client.tsx # Detailed event view
    │   │   ├── event-program-timeline.tsx
    │   │   ├── favorites-list.tsx      # Starred students
    │   │   ├── global-search.tsx       # Cross-event search
    │   │   ├── student-search-modal.tsx
    │   │   ├── event-chatbot.tsx       # AI chatbot
    │   │   └── register-event-button.tsx
    │   │
    │   ├── kiosk/            # On-site kiosk components
    │   │   ├── kiosk-shell.tsx
    │   │   ├── attract-screen.tsx
    │   │   ├── registration-form.tsx
    │   │   ├── ticket-recovery.tsx
    │   │   └── validation-popup.tsx
    │   │
    │   ├── sections/         # Homepage sections
    │   │   ├── Hero.tsx
    │   │   ├── EventsSection.tsx
    │   │   ├── StatsSection.tsx
    │   │   ├── UniversitiesSection.tsx
    │   │   ├── HowItWorks.tsx
    │   │   └── EventCard.tsx
    │   │
    │   ├── common/
    │   │   └── print-button.tsx
    │   │
    │   └── tracking-scripts.tsx  # Marketing pixel injection (per-event)
    │
    └── app/
        ├── globals.css       # ★ Design system (CSS variables, light/dark themes)
        ├── favicon.ico
        │
        ├── [locale]/         # ★ Internationalized public routes
        │   ├── layout.tsx    # Root i18n layout (fonts, pixels, providers)
        │   ├── error.tsx
        │   ├── (public)/     # Public pages under locale
        │   │   ├── page.tsx  # Homepage (event listings)
        │   │   ├── events/   # Event detail pages
        │   │   └── ...
        │   ├── kiosk/        # Kiosk mode (/[locale]/kiosk/[eventSlug])
        │   └── university/   # University portal (/[locale]/university/...)
        │
        ├── (public)/         # Non-localized public routes
        │   ├── layout.tsx
        │   ├── page.tsx      # Main landing
        │   ├── events/       # Event pages
        │   ├── privacy/      # Privacy policy
        │   └── r/            # QR redirect route (/r/[token])
        │
        ├── (admin-auth)/     # Auth pages (no locale prefix)
        │   ├── layout.tsx
        │   ├── login/        # Admin login page
        │   └── scan-login/   # Usher PIN login page
        │
        ├── admin/            # ★ Admin dashboard (no locale prefix)
        │   ├── layout.tsx    # Admin layout with sidebar
        │   ├── page.tsx      # Admin home/overview
        │   ├── events/       # Event management (CRUD)
        │   ├── registrations/ # Registration management
        │   ├── analytics/    # Analytics dashboard
        │   ├── scan/         # QR scanner page
        │   ├── documents/    # Document validation management
        │   ├── universities/ # University management
        │   ├── users/        # Admin user management
        │   ├── templates/    # Message template management
        │   ├── countries/    # Country management
        │   ├── cities/       # City management
        │   ├── dashboard/    # Dashboard views
        │   └── zoho/         # Zoho CRM sync admin
        │
        ├── actions/          # Server Actions
        │   ├── events.ts
        │   ├── analytics.ts
        │   ├── ai-enrichment.ts
        │   ├── exhibitor.ts
        │   ├── kiosk.ts
        │   ├── ticket.ts
        │   └── university-event.ts
        │
        └── api/              # API Routes (Route Handlers)
            ├── auth/         # NextAuth route handler
            ├── admin/
            │   ├── events/         # Event CRUD API
            │   ├── registrations/  # Registration API
            │   ├── checkin/        # Check-in API
            │   ├── export/         # Data export (CSV/Excel)
            │   ├── countries/      # Country API
            │   └── zoho/           # Zoho sync API
            ├── register/     # Public registration API
            ├── ai/           # AI enrichment API
            ├── qr/           # QR code generation API
            ├── university/   # University API
            ├── debug-db/     # Database debug endpoint
            └── test-whatsapp/ # WhatsApp test endpoint
```

---

## 4. Database Architecture

### Database: PostgreSQL (Supabase)
- **Connection Pooling:** PgBouncer enabled via `db.ts` (`connection_limit=1&pgbouncer=true`)
- **Two connection URLs:** `DATABASE_URL` (pooled, for app) and `DIRECT_URL` (direct, for migrations)

### Enums
| Enum | Values |
|---|---|
| `EventStatus` | `DRAFT`, `PUBLISHED`, `FINISHED` |
| `RegistrationStatus` | `REGISTERED`, `CANCELLED` |
| `CheckInMethod` | `QR`, `MANUAL` |
| `AdminRole` | `SUPER_ADMIN`, `EVENT_MANAGER`, `EVENT_STAFF`, `USHER` |
| `UniversityRole`| `ADMIN`, `MEMBER` |
| `MessageChannel` | `EMAIL`, `WHATSAPP` |
| `MessageStatus` | `QUEUED`, `SENT`, `FAILED` |
| `ParticipationStatus` | `INVITED`, `ACCEPTED`, `DECLINED`, `REQUESTED` |
| `FileType` | `BROCHURE`, `CATALOG`, `PROGRAM_GUIDE`, `SCHOLARSHIP_INFO`, `APPLICATION_FORM`, `OTHER` |
| `PointAction` | `BOOTH_VISIT`, `EARLY_BIRD`, `COMPLETION_BONUS`, `MANUAL_ADJUSTMENT` |
| `GiftTier` | `BRONZE`, `SILVER`, `GOLD` |

### Core Models
| Model | Purpose |
|---|---|
| `Country` | Countries with ISO codes, timezones, flag emojis |
| `City` | Cities with rich content (attractions, food, transport, tips) |
| `Event` | Education fair events with full metadata, translations, tracking pixels, Zoho config |
| `EventSession` | Scheduled sessions/talks within events |
| `University` | Participating universities with programs and contact info |
| `UniversityUser` | University portal login accounts |
| `EventParticipating` | Many-to-many: which universities participate in which events |
| `Registrant` | Students who register (with AI-enriched fields) |
| `Registration` | Links registrant to event, holds QR token |
| `FavoriteStudent` | Universities can "star" students at events with notes/ratings |
| `CheckIn` | Records when a student checks in (QR or manual) |
| `MessageLog` | Tracks all sent emails/WhatsApp messages |
| `ReminderRule` | Configurable reminder schedules per event |
| `AdminUser` | Admin accounts with roles and optional access codes (for ushers) |
| `MessageTemplate` | Reusable email/WhatsApp templates |
| `AuditLog` | Action audit trail |
| `UniversityFile` | Brochures/catalogs uploaded by universities (stored in Supabase) |
| `BoothVisit` | Records when a university scans a student's QR (booth visit) |
| `RedPointsLedger` | Individual point transactions linked to booth visits |
| `GiftRedemption` | Records gift redemptions at the help desk |
| `ValidatedDocument` | Official letters/documents with QR tokens for public verification |

### Key Relationships
- `Event` → `City` → `Country` (location hierarchy)
- `Event` ↔ `University` via `EventParticipating` (many-to-many)
- `Event` → `Registration` → `Registrant` (student registration)
- `Registration` → `CheckIn` (one-to-one check-in record)
- `Registration` → `FavoriteStudent` ← `University` (favorites)
- `Registration` → `BoothVisit` → `University` (booth visits + points)
- `University` → `UniversityFile` (brochures/catalogs)
- `Registration` → `RedPointsLedger` (point transactions)
- `Registration` → `GiftRedemption` ← `AdminUser` (gift processing)

---

## 5. Authentication & Authorization

### Providers (3 login methods)
1. **Admin Credentials** (`credentials`) — Email + password for `AdminUser` accounts
2. **University Credentials** (`university-credentials`) — Email + password for `UniversityUser` accounts
3. **Usher PIN** (`usher-pin`) — 4-digit access code for on-site staff

### Session Strategy
- **JWT-based** (not database sessions)
- **Max age:** 30 days
- Token contains: `id`, `role`, `universityId`, `type` (`"ADMIN"` or `"UNIVERSITY"`)

### Role Hierarchy
| Role | Access |
|---|---|
| `SUPER_ADMIN` | Full access to everything |
| `EVENT_MANAGER` | Event management, registrations, analytics |
| `EVENT_STAFF` | Scanner access, limited admin |
| `USHER` | Scanner access only (PIN login) |
| `UNIVERSITY (ADMIN)` | University dashboard, participate in events, view global booth leads, manage team roster. |
| `UNIVERSITY (MEMBER)`| University scanner rep. Can only view leads that they personally scanned. |

### Authorization Helpers (`src/lib/role-check.ts`)
- `requireRole(allowedRoles)` — Check specific roles
- `requireAdmin()` — Any admin type (not university)
- `requireManagerOrAbove()` — SUPER_ADMIN or EVENT_MANAGER only

---

## 6. Internationalization (i18n)

### Configuration
- **Library:** next-intl v4
- **Active routing locales:** `['en', 'tr', 'ar']`
- **Default locale:** `'en'`
- **Locale prefix strategy:** `'as-needed'` (no prefix for default locale)
- **Translation files:** `messages/*.json`

### RTL Support
- Arabic (`ar`) triggers `dir="rtl"` on `<html>`
- Dynamic font switching: Inter (LTR) → Cairo (RTL) via CSS variables
- Email templates detect RTL from translation content

### Middleware
- Only internationalized routes are processed (excludes: `api`, `admin`, `login`, `scan-login`, `_next`, static files)
- **Admin pages are NOT localized** — always English for simplicity

### Translation File Sync Rule
> **CRITICAL:** When adding translation keys to `en.json`, ALL other locale files (`ar.json`, `tr.json`, `de.json`, etc.) MUST be updated with corresponding keys. Missing keys cause runtime UI errors.

---

## 7. Styling & Design System

### Theme
- **Inspired by:** Turkish flag colors (Red + White)
- **Primary color:** `hsl(355 85% 45%)` (Turkish Red)
- **Design tokens:** CSS custom properties in `globals.css`
- **Dark mode:** Supported via `class` strategy
- **Fonts:** Inter (sans), Cairo (Arabic)

### Component Library
- **shadcn/ui** with **New York** style variant
- Custom components extend Radix primitives
- Animation wrappers in `src/components/ui/motion.tsx` (Framer Motion)

### Key CSS Classes
- `.hero-gradient` — Red gradient background
- `.card-elevated` — Elevated card with hover effect
- `.glow-accent` — Accent glow shadow
- `.text-gradient` — Gold gradient text
- `.pattern-dots` — Decorative dot pattern

---

## 8. API Architecture

### Server Actions (`src/app/actions/`)
Used for form submissions and mutations. Files:
- `events.ts` — Event CRUD operations
- `analytics.ts` — Analytics data fetching
- `ai-enrichment.ts` — Trigger AI enrichment for registrants
- `exhibitor.ts` — Exhibitor inquiry submissions
- `kiosk.ts` — Kiosk registration flow
- `ticket.ts` — Ticket/pass operations
- `booth-visit.ts` — Booth visit recording + Red Points awarding
- `university-files.ts` — University brochure/file CRUD
- `university-event.ts` — University event participation

### API Routes (`src/app/api/`)
Used for REST-style endpoints:
- `POST /api/register` — Public registration endpoint
- `GET/POST /api/admin/events` — Event management
- `POST /api/admin/checkin` — Check-in processing
- `GET /api/admin/export` — Data export (CSV/Excel)
- `GET/POST /api/admin/documents` — Document validation CRUD (admin)
- `GET/PATCH/DELETE /api/admin/documents/[id]` — Single document management
- `GET /api/documents/verify?token=xxx&ref=xxx` — Public document verification (no auth)
- `GET /api/qr` — QR code image generation
- `POST /api/ai` — AI enrichment trigger
- `GET/POST /api/university` — University portal API
- `POST /api/university/booth-scan` — University scans student QR at booth
- `GET /api/red-points` — Retrieve student's Red Points + progress
- `POST /api/admin/helpdesk/redeem` — Process gift redemption at help desk

### Rate Limiting
- In-memory rate limiter (`src/lib/rate-limit.ts`)
- Identifier: client IP via `x-forwarded-for`, `x-real-ip`, or `cf-connecting-ip`
- **Production note:** Should migrate to Redis-based solution (e.g., @upstash/ratelimit)

---

## 9. Integrations

### Email (Resend)
- **Service:** `src/lib/email.ts`
- **Types:** Confirmation (with QR attachment), Reminder, Exhibitor Inquiry, University Access Request
- **From:** Configurable via `RESEND_FROM_EMAIL` env var
- **QR codes:** Generated as PNG buffer, attached with `cid:qrcode`

### WhatsApp (Twilio / n8n)
- **Service:** `src/lib/whatsapp.ts`
- **Priority:** n8n webhook first → Twilio fallback
- **Format:** E.164 phone numbers with `whatsapp:` prefix
- **Languages:** English and Arabic message variants

### AI Enrichment (OpenAI)
- **Service:** `src/lib/ai.ts`
- **Model:** `gpt-4o-mini`
- **Purpose:** Normalize `interestedMajor` → `standardizedMajor` + `majorCategory`, infer `gender` from name
- **Content Generation:** `src/lib/services/openai.ts` — Generate university/city content (gpt-4-turbo-preview)

### CRM (Zoho)
- **Service:** `src/lib/zoho.ts`
- **Auth:** OAuth2 with refresh token (cached in-memory with 5-min buffer)
- **Purpose:** Create leads on registration with UTM tracking

### Supabase
- **Storage:** Image uploads (banner, gallery, university logos)
- **Database:** PostgreSQL hosting
- **Client:** `src/lib/supabase-client.ts`

### Marketing Pixels
Per-event configurable via `Event` model fields:
- Google Analytics (`gaTrackingId`)
- Facebook Pixel (`fbPixelId`)
- LinkedIn Insight Tag (`linkedInPartnerId`)
- TikTok Pixel (`tiktokPixelId`)
- Snapchat Pixel (`snapPixelId`)
- Custom head/body scripts (DOMPurify sanitized)

Global pixels (in locale layout): Facebook Pixel + TikTok Pixel

### n8n Automation
Workflow exports in `n8n/`:
- `google-sheet-import.json` — Import registrations from Google Sheets
- `whatsapp-sender.json` — WhatsApp message sending workflow

---

## 10. Environment Variables

```env
# Database
DATABASE_URL=              # PostgreSQL connection string (pooled, via Supabase)
DIRECT_URL=                # Direct PostgreSQL connection (for migrations)

# Auth
NEXTAUTH_SECRET=           # JWT signing secret
NEXTAUTH_URL=              # App URL for callbacks

# App
NEXT_PUBLIC_APP_URL=       # Public app URL (for QR codes, links)

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=         # Sender address

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# WhatsApp (n8n alternative)
N8N_WEBHOOK_URL=           # If set, used instead of Twilio

# AI
OPENAI_API_KEY=

# CRM (Zoho)
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ACCOUNTS_DOMAIN=     # Default: https://accounts.zoho.com
ZOHO_API_DOMAIN=           # Default: https://www.zohoapis.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 11. Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Generate Prisma client + build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database (no migration) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |

### Running Scripts
```bash
npx tsx scripts/seed-event.ts
npx tsx scripts/create-uni-user.ts
npx tsx scripts/backfill-ai-leads.ts
```

---

## 12. Key Architectural Decisions & Rules

### Routing
1. **Admin routes are NOT localized.** Admin is always in English at `/admin/*`.
2. **Public routes use `[locale]` segment** with next-intl middleware.
3. **Middleware excludes:** `api`, `admin`, `login`, `scan-login`, `_next`, static files.
4. The QR redirect lives at `/(public)/r/[token]` — short URLs for mobile passes.

### Database
1. **Always use the singleton Prisma client** from `src/lib/db.ts`.
2. **PgBouncer is enabled** — do not use interactive transactions or `$connect`/`$disconnect`.
3. **Connection limit is set to 1** per instance for serverless compatibility.
4. **CUID IDs** are used for all models (not UUID or auto-increment).

### Authentication
1. **Never store raw passwords.** Always hash with `bcryptjs`.
2. **JWT tokens carry role and type.** Do not rely on database lookups per request.
3. **Usher accounts use simple access codes** (PIN-like), not email/password.

### Security
1. **Custom scripts are DOMPurify-sanitized** before storage.
2. **Security headers** are configured in `next.config.ts` (HSTS, X-Frame-Options, etc.).
3. **Rate limiting** is applied to registration endpoints.
4. **Zod validation** is mandatory for all form inputs (server and client).

### Coding Conventions
1. **TypeScript strict mode** is used throughout.
2. **Path aliases:** `@/` maps to `src/` (configured in tsconfig).
3. **File naming:** Components use PascalCase filenames, utilities use kebab-case.
4. **Server Components by default** — use `"use client"` only when necessary.
5. **Server Actions** for mutations, **API Routes** for REST endpoints and external integrations.
6. **shadcn/ui components** should be installed in `src/components/ui/` and customized there.

### i18n Rules
1. **English (`en.json`) is the source of truth** for translation keys.
2. **All locale files must be synchronized** — missing keys cause UI errors.
3. **3 active routing locales:** `en`, `tr`, `ar`.
4. **Other locale files** (`de`, `es`, `fa`, `fr`, `ru`, `zh`) exist but may have incomplete translations.
5. **Admin panel is English-only** — no translations needed for admin components.

### Image Handling
1. **Remote images must be allowlisted** in `next.config.ts` `remotePatterns`.
2. **Currently allowed:** Supabase storage (`iqjvvvhfpiwbdwzuehlk.supabase.co`), Unsplash.
3. **Image uploads go to Supabase Storage** via the Supabase client.

### Performance
1. **`experimental.cpus: 1`** and `workerThreads: false` in Next.js config for Vercel compatibility.
2. **Prisma connection limit: 1** for serverless environments.
3. **Rate limiter is in-memory** — will not work across multiple instances.

---

## 13. Deployment

- **Platform:** Vercel (inferred from configuration)
- **Build command:** `prisma generate && next build`
- **Post-install:** `prisma generate` (auto-runs on `npm install`)
- **Node.js:** ≥20.9.0 required
- **Environment:** All env vars must be configured in Vercel dashboard

---

## 14. Common Workflows

### Adding a New Event
1. Admin creates event via `/admin/events/new` form (or API)
2. Set status to `DRAFT` → `PUBLISHED` when ready
3. Students register via public event page
4. Registration triggers: QR generation → Email → WhatsApp → Zoho lead → AI enrichment

### Student Registration Flow
1. Student fills form on `/[locale]/events/[slug]` or kiosk
2. Server validates with Zod schema
3. `Registrant` upserted (email-based dedup)
4. `Registration` created with unique `qrToken`
5. Parallel: Send email (Resend) + WhatsApp (Twilio/n8n)
6. Async: AI enrichment (major normalization, gender inference)
7. Async: Zoho CRM lead creation

### On-Site Check-In
1. Usher opens scanner at `/admin/scan` (or PIN-login at `/scan-login`)
2. Scans student's QR code (or manual search by phone/email)
3. System records `CheckIn` with timestamp and method

### University Participation
1. Universities can be invited or request to join events
2. University users log in via university credentials provider
3. They can view event details, favorite students, and see analytics

---

## 15. Paperless Events & Red Points System

### Overview
The Paperless Events system replaces physical brochures with digital files and incentivizes booth visits through a gamified point system.

### Architecture
- **Flow:** University rep scans student's QR code at their booth → system records booth visit → awards Red Points → makes brochures downloadable on student's pass
- **Why "University scans Student":** Ensures physical booth presence, prevents gaming, gives university reps control

### Red Points Engine (`src/lib/red-points.ts`)
- **Point calculation:** Configurable per event via `Event` model fields
- **Default values:** 10 pts per booth visit, 5 pts early bird bonus, 20 pts completion bonus
- **Tiers:** Bronze (0-49pts), Silver (50-99pts), Gold (100+pts)
- **Deduplication:** One visit per student per university per event (enforced by unique constraint)

### Event Configuration Fields
| Field | Type | Default | Purpose |
|---|---|---|---|
| `redPointsEnabled` | Boolean | false | Toggle Red Points for event |
| `pointsPerBoothVisit` | Int | 10 | Points awarded per booth scan |
| `earlyBirdBonusPoints` | Int | 5 | Bonus for first N visits |
| `earlyBirdThreshold` | Int | 50 | First N students get early bird |
| `completionBonusPoints` | Int | 20 | Bonus for visiting all booths |
| `completionThreshold` | Float | 0.8 | % of booths needed (0.0-1.0) |
| `bronzeMinPoints` | Int | 0 | Bronze tier min |
| `silverMinPoints` | Int | 50 | Silver tier min |
| `goldMinPoints` | Int | 100 | Gold tier min |
| `bronzeGiftDescription` | String? | null | Bronze tier reward |
| `silverGiftDescription` | String? | null | Silver tier reward |
| `goldGiftDescription` | String? | null | Gold tier reward |

### Key Components
| Component | Location | Purpose |
|---|---|---|
| Booth Scanner | `src/components/university/booth-scanner-client.tsx` | Camera QR scanner for university reps |
| File Manager | `src/components/university/university-files-client.tsx` | Upload/manage brochures |
| Red Points Widget | `src/components/public/red-points-widget.tsx` | Student pass points display |
| Help Desk | `src/components/admin/helpdesk-client.tsx` | Admin gift redemption interface |

### Pages
| Route | Purpose |
|---|---|
| `/[locale]/university/scanner` | University booth scanner |
| `/[locale]/university/files` | University file management |
| `/admin/helpdesk` | Admin help desk for gift redemption |

---

## 16. Document Validation System

### Overview
The Document Validation system allows admins to register official letters/documents, generate QR codes to embed in physical letters, and provide a public verification page where anyone scanning the QR can confirm the document's authenticity.

### Database Model: `ValidatedDocument`
| Field | Type | Purpose |
|---|---|---|
| `token` | String (unique) | QR code lookup key (auto-generated CUID) |
| `referenceNumber` | String? (unique) | Human-readable ref like `LTR-2026-0042` |
| `subject` | String | Letter subject (shown publicly) |
| `recipientName` | String? | Who the letter is addressed to |
| `senderName` | String? | Who signed the letter |
| `senderTitle` | String? | Sender's title/role |
| `issuedAt` | DateTime | Date on the letter |
| `expiresAt` | DateTime? | Optional expiry date |
| `isRevoked` | Boolean | Revocation flag |
| `createdById` | String | Admin who created the entry |

### Key Pages
| Route | Purpose |
|---|---|
| `/admin/documents` | Admin document management (create, list, revoke, delete) |
| `/verify?token=xxx` | Public verification page (standalone, no auth required) |
| `/verify?ref=LTR-2026-0001` | Manual verification by reference number |

### QR Utilities
- `getDocumentVerifyUrl(token)` — Generate `/verify?token=xxx` URL
- `generateDocumentQrDataUrl(token)` — QR as base64 data URL (for display)
- `generateDocumentQrBuffer(token)` — QR as PNG buffer (for download)

### Workflow
1. Admin creates document entry in `/admin/documents` → QR code + reference number auto-generated
2. Admin downloads QR code PNG and attaches it to the physical letter
3. Recipient scans QR with phone camera → redirected to `/verify?token=xxx`
4. Verification page shows: ✅ Valid (with subject, sender, date) or ❌ Invalid/Revoked/Expired

---

## 17. Known Constraints & TODOs

- **Rate limiter** is in-memory — won't work with multiple Vercel serverless instances. Migrate to Redis.
- **Translation files** need regular sync — keys added to `en.json` must be added to all locales.
- **OpenAI enrichment** is fire-and-forget — failures are logged but don't block registration.
- **Zoho integration** uses in-memory token cache — resets on cold start.
- **Admin panel** lacks i18n — intentionally kept English-only.
- **Red Points config** needs to be added to the admin event creation/edit form.

---

## 18. File Quick Reference

| Need to... | Look at... |
|---|---|
| Add a database model | `prisma/schema.prisma` |
| Add a translation key | `messages/en.json` (then sync all locales) |
| Add a UI component | `src/components/ui/` (shadcn/ui pattern) |
| Create an API endpoint | `src/app/api/` |
| Create a server action | `src/app/actions/` |
| Add a public page | `src/app/[locale]/(public)/` |
| Add an admin page | `src/app/admin/` |
| Modify auth logic | `src/lib/auth.ts` |
| Change email templates | `src/lib/email.ts` |
| Modify QR code behavior | `src/lib/qr.ts` |
| Update design tokens | `src/app/globals.css` |
| Configure image domains | `next.config.ts` |
| Update Tailwind theme | `tailwind.config.ts` |
| Manage B2B matchmaking | `src/app/actions/b2b.ts` + `src/lib/b2b-scheduler.ts` |

---

## 19. B2B Matchmaking System

### Overview
A Macrom-style B2B meeting scheduler that automatically generates conflict-free meeting schedules between **Side A (Universities)** and **Side B (Agents/Schools/Companies)** for B2B events.

### Database Models
| Model | Purpose |
|---|---|
| `B2BEvent` | B2B event with date, time range, slot duration, break periods. Optional `eventId` links to main `Event` |
| `B2BParticipant` | Participant on Side A (linked to University) or Side B (standalone) |
| `B2BMeeting` | Individual meeting with time slot, table number, status, notes |

### Event ↔ B2B Integration
- `B2BEvent.eventId` (optional, unique) — links a B2B event to a main `Event`
- `Event.b2bEvent` — reverse one-to-one relation
- When admin toggles B2B on a main event, `enableB2BForEvent()` auto-creates a linked `B2BEvent`
- When admin disables B2B, `disableB2BForEvent()` removes the linked B2BEvent (only if no meetings exist)
- `B2BSection` component (`src/components/admin/b2b/b2b-event-section.tsx`) renders in the main event edit form

### Enum: `B2BMeetingStatus`
`SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`

### Scheduling Algorithm (`src/lib/b2b-scheduler.ts`)
- **Round-robin** assignment ensuring each Side A meets each Side B exactly once
- Generates time slots from event start/end times, excluding break periods
- Validates capacity before generation (enough slots for all meetings)
- No duplicate meetings, no double-booking per time slot
- Table numbers assigned incrementally per slot

### Key Files
| File | Purpose |
|---|---|
| `src/lib/b2b-scheduler.ts` | Core scheduling algorithm (generateTimeSlots, generateSchedule, validateCapacity) |
| `src/app/actions/b2b.ts` | All B2B server actions (CRUD, schedule generation, notes, import, event integration) |
| `src/lib/validations.ts` | Zod schemas: `b2bEventSchema`, `b2bParticipantSchema` |
| `src/components/admin/b2b/b2b-event-section.tsx` | B2B toggle section embedded in main event form |
| `src/components/admin/b2b/` | Admin B2B components (event form, detail client, etc.) |
| `src/components/university/b2b-university-schedule.tsx` | University B2B schedule view |

### Routes
| Route | Purpose |
|---|---|
| `/admin/b2b` | B2B events list |
| `/admin/b2b/new` | Create new standalone B2B event |
| `/admin/b2b/[id]` | Event detail (participants, schedule, public links) |
| `/admin/events/[id]` | Main event edit — includes B2B toggle section |
| `/[locale]/university/b2b` | University B2B events list |
| `/[locale]/university/b2b/[eventId]` | University meeting schedule with notes |
| `/b2b/schedule/[token]` | Public schedule for Side B (no auth) |

### API Endpoints
| Endpoint | Purpose |
|---|---|
| `GET /api/b2b/schedule?token=xxx` | Public schedule fetch for Side B |
| `GET /api/admin/b2b/[id]/universities` | Available universities for event |
| `GET /api/admin/b2b/[id]/export?format=csv` | Export schedule as CSV |

### Admin Workflow
1. **Option A — Via Event Form**: Edit an existing event → toggle B2B on → configure time slots → save → click "Manage B2B"
2. **Option B — Standalone**: Create B2B event directly at `/admin/b2b/new`
3. Add Side A — select from existing universities
4. Add Side B — manual entry or CSV import (headers: name, contact_person, email, phone, type, country)
5. Click "Generate Schedule" — algorithm creates all meetings
6. Preview schedule in table view, update meeting statuses
7. Share public links with Side B participants
8. Export to CSV for offline use

