# AuraPTE — Project Memory

> **Last updated:** 2026-06-30  
> A living reference of everything worth knowing about this codebase: architecture, conventions, design system, data model, and key decisions. Keep this file updated as the project evolves.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **App name** | AuraPTE |
| **Domain** | AuraPTE.com |
| **Purpose** | Premium PTE Academic exam preparation platform |
| **Tagline** | "Experience the next generation of PTE Academic exam preparation, styled by design engineers." |
| **Stack** | Next.js 14 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Razorpay |
| **Deployment** | Vercel (`npm run deploy` → `npx vercel --prod`) |
| **Repo root** | `f:\Learning\Projects\Micro\AuraPTE.com` |

---

## 2. Tech Stack & Key Dependencies

| Package | Version | Role |
|---|---|---|
| `next` | ^14.2.3 | Framework (App Router) |
| `react` / `react-dom` | ^18.2.0 | UI runtime |
| `typescript` | ^5.4.5 | Type safety |
| `tailwindcss` | ^4.0.0 | Styling (**v4**, NOT v3) |
| `@tailwindcss/postcss` | ^4.0.0 | PostCSS integration for Tailwind v4 |
| `@supabase/supabase-js` | ^2.43.5 | Supabase JS client |
| `@supabase/ssr` | ^0.4.0 | Supabase SSR helpers for Next.js |
| `lucide-react` | ^0.379.0 | Icon library |
| `@dnd-kit/core` | ^6.1.0 | Drag-and-drop (Reorder Paragraphs) |
| `@dnd-kit/sortable` | ^8.0.0 | Sortable DnD primitives |
| `nspell` | ^2.1.5 | Spell-checking (Write from Dictation) |
| `three` | ^0.185.0 | 3D graphics (landing page) |
| `js-cookie` | ^3.0.5 | Cookie utilities |
| `class-variance-authority` | ^0.7.0 | CVA for component variants |
| `clsx` + `tailwind-merge` | latest | Conditional class merging |

> ⚠️ **Tailwind v4 is active.** Config lives entirely in `globals.css` via `@theme {}` — there is no `tailwind.config.js`. Do not use v3 config patterns.

---

## 3. Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, ThemeProvider, Supabase guard
│   ├── page.tsx                # Landing page (21KB — full marketing page with 3D scene)
│   ├── globals.css             # Design tokens, Tailwind v4 @theme, all global styles
│   ├── (auth)/                 # Public auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (dashboard)/            # Protected app route group
│   │   ├── layout.tsx          # Dashboard shell (auth guard, sidebar, header)
│   │   ├── DashboardClientLayout.tsx
│   │   ├── loading.tsx
│   │   ├── dashboard/page.tsx  # Home dashboard (stats, recent activity)
│   │   ├── billing/page.tsx    # Plan comparison + Razorpay upgrade
│   │   ├── mock-tests/         # Mock test listing + [testId] runner
│   │   ├── practice-tests/     # Practice test listing + [testId] runner
│   │   ├── questions/[module]/ # Per-module question browser
│   │   └── specialised-tips/   # Tips page (premium-gated PDFs)
│   ├── admin/                  # Admin panel
│   │   └── question-links/     # Link questions to test definitions
│   ├── api/
│   │   ├── admin/link-questions/ + link-status/
│   │   ├── billing/razorpay/   # order + webhook endpoints
│   │   ├── cron/cleanup-sessions/
│   │   └── heartbeat/          # Single-session heartbeat endpoint
│   └── auth/
│       ├── actions.ts          # Server actions (login, signup, logout, forgot-pw)
│       └── callback/           # OAuth callback handler
├── components/
│   ├── auth/                   # Auth form components
│   ├── billing/
│   │   └── RazorpayCheckout.tsx
│   ├── dashboard/
│   │   ├── RecentActivity.tsx
│   │   └── StatCard.tsx
│   ├── landing/                # Landing page section components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx       # Mobile bottom nav
│   │   ├── MobileNavDrawer.tsx
│   │   ├── NavigationLoader.tsx
│   │   ├── LoadingSkeletons.tsx
│   │   ├── SessionGuard.tsx    # Client-side session guard
│   │   └── SupabaseSetupRequired.tsx # Shown when .env is not configured
│   ├── providers/
│   │   ├── ThemeProvider.tsx   # Dark/light mode + inline init script (no flash)
│   │   └── ThemeToggle.tsx
│   ├── questions/
│   │   ├── MediaDetail.tsx     # Image/audio lightbox
│   │   ├── shared/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── ComingSoonBanner.tsx
│   │   │   ├── ModelAnswer.tsx
│   │   │   └── ScoreBadge.tsx
│   │   ├── speaking/
│   │   │   └── SpeakingPlaceholder.tsx
│   │   ├── writing/
│   │   │   ├── SummarizeText.tsx
│   │   │   ├── WriteEmail.tsx
│   │   │   └── HighlightedFeedback.tsx
│   │   ├── reading/
│   │   │   ├── MCQSingle.tsx
│   │   │   ├── MCQMultiple.tsx
│   │   │   ├── RWFillBlanks.tsx
│   │   │   ├── ReadingFillBlanks.tsx
│   │   │   └── ReorderParagraphs.tsx
│   │   └── listening/
│   │       ├── MCQSingle.tsx
│   │       ├── MCQMultiple.tsx
│   │       ├── FillBlanks.tsx
│   │       ├── HighlightWords.tsx
│   │       ├── SelectMissing.tsx
│   │       ├── SummarizeSpoken.tsx
│   │       └── WriteDictation.tsx
│   └── test-runner/
│       └── QuestionRunner.tsx  # 36KB — the main test runner engine
├── hooks/
│   └── useHeartbeat.ts         # Posts to /api/heartbeat every 60s
└── lib/
    ├── plans.ts                # Subscription plan definitions (source of truth)
    ├── razorpay.ts             # Razorpay order creation + webhook verification
    ├── session.ts              # HMAC SHA-256 session signing/verification
    ├── taskTypeMapper.ts       # URL <-> DB task type mapping + content normalisation
    ├── testDefinitions.ts      # Test structure from legacy JSON (practice + mock)
    ├── testDefinitions.practice.json  # 20 practice test definitions
    ├── testDefinitions.mock.json      # 10 mock test definitions
    ├── linguistics/
    │   ├── analyze.ts          # Text linguistic analysis
    │   └── parsePrompt.ts      # AI prompt parsing
    ├── scoring/
    │   ├── listening.ts
    │   ├── reading.ts
    │   └── writing.ts
    └── supabase/
        ├── client.ts           # Browser Supabase client
        ├── server.ts           # Server Supabase client
        ├── middleware.ts       # Session refresh for middleware
        ├── config.ts           # isSupabaseConfigured() guard
        └── auth-cache.ts       # React.cache() memoized getUser()
```

---

## 4. Database Schema (Supabase / PostgreSQL)

### Tables

#### `public.profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | References `auth.users(id)` |
| `full_name` | TEXT | |
| `phone` | TEXT | |
| `avatar_url` | TEXT | |
| `plan` | TEXT | `'free'` or `'premium'` (default: `'free'`) |
| `plan_expiry` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

Auto-created on `auth.users` insert via `handle_new_user()` trigger.

#### `public.questions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `module` | TEXT | `speaking`, `writing`, `reading`, `listening` |
| `task_type` | TEXT | Underscore format (e.g. `read_aloud`) |
| `title` | TEXT | |
| `content` | JSONB | Question data (varies by task type) |
| `difficulty` | TEXT | `easy`, `medium`, `hard` |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | |

RLS: Any authenticated user can SELECT where `is_active = true`.

#### `public.user_attempts`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID | References `auth.users` |
| `question_id` | UUID | References `questions` |
| `user_answer` | JSONB | |
| `score` | NUMERIC | |
| `max_score` | NUMERIC | |
| `is_correct` | BOOLEAN | |
| `time_taken_seconds` | INTEGER | |
| `attempted_at` | TIMESTAMPTZ | |

#### `public.user_sessions`
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID PK | References `auth.users` (one session per user) |
| `session_id` | UUID | Current active session |
| `created_at` | TIMESTAMPTZ | |
| `last_heartbeat` | TIMESTAMPTZ | Updated by heartbeat API |

> **Single-session enforcement:** Only one active session per user. New login overwrites the old `session_id`, invalidating any other open tabs/devices.

### RPC Functions
- **`count_questions_by_module()`** — Returns `(module, count)` pairs. Used by dashboard to avoid fetching all question rows.

### Indexes
- `idx_questions_active_module` on `questions(module)` WHERE `is_active = true`

---

## 5. Authentication & Session Architecture

### Flow
1. User logs in → Supabase JWT issued
2. Server signs a `session_id` cookie with HMAC SHA-256 (`SESSION_SECRET` env var)
3. Cookie stored as `session_id` in browser
4. On every navigation to `/dashboard/*` or `/questions/*`:
   - Middleware refreshes Supabase auth session
   - Middleware verifies HMAC signature locally (no DB query)
   - Forwards `x-aurapte-session` header to page
5. Every 60 seconds: `useHeartbeat` posts to `/api/heartbeat`
   - Heartbeat endpoint checks `user_sessions` table
   - Updates `last_heartbeat`
   - Returns 401 if session is no longer active (stolen/invalidated)

### Key Files
- `middleware.ts` — Main auth middleware (HMAC verify, session forwarding)
- `src/lib/session.ts` — `signSessionId()` / `verifySessionId()`
- `src/lib/supabase/auth-cache.ts` — `React.cache()` memoized `getUser()`
- `src/hooks/useHeartbeat.ts` — Client-side heartbeat ping

### Auth Optimizations
- Removed DB query from middleware (was causing ~5s click latency)
- `React.cache()` deduplicates `auth.getUser()` calls within a single render pass
- Browser cache hint: `Cache-Control: private, max-age=5, stale-while-revalidate=15` on GET requests

---

## 6. Design System

### Design Philosophy
Inspired by Vercel's design language — stark black-and-ink on near-white canvas, broken at hero scale by multi-color mesh gradients. Premium, minimal, engineer-aesthetic.

### Color Tokens (defined in `globals.css` via `@theme {}`)

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#171717` | `#fafafa` |
| `--color-ink` | `#171717` | `#fafafa` |
| `--color-body` | `#4d4d4d` | `#a3a3a3` |
| `--color-mute` | `#888888` | `#6b6b6b` |
| `--color-hairline` | `#ebebeb` | `#262626` |
| `--color-hairline-strong` | `#a1a1a1` | `#404040` |
| `--color-canvas` | `#ffffff` | `#0a0a0a` |
| `--color-canvas-soft` | `#fafafa` | `#111111` |
| `--color-canvas-soft-2` | `#f5f5f5` | `#1a1a1a` |
| `--color-link` | `#0070f3` | `#4ea8ff` |
| `--color-success` | `#0070f3` | `#4ea8ff` |
| `--color-error` | `#ee0000` | `#ff5c5c` |
| `--color-warning` | `#f5a623` | `#ffb547` |
| `--color-violet` | `#7928ca` | `#b388ff` |
| `--color-cyan` | `#50e3c2` | `#6affd9` |
| `--color-highlight-pink` | `#ff0080` | (same) |

### Gradients (branding, theme-stable)
- **Develop:** `#007cf0` → `#00dfd8`
- **Preview:** `#7928ca` → `#ff0080`
- **Ship:** `#ff4d4d` → `#f9cb28`

### Typography
- **Display font:** Inter (loaded as `--font-geist-sans`) via `next/font/google`
- **Mono font:** JetBrains Mono (loaded as `--font-geist-mono`)
- Font variables: `--font-geist`, `--font-geist-mono`
- Body class: `font-geist antialiased`

### Global CSS Classes
| Class | Purpose |
|---|---|
| `.card-hover` | Unified interactive card hover (lift + shadow + border) |
| `.card-locked` | Disabled state — no lift, 0.7 opacity |
| `.shadow-vercel-card` | Subtle card shadow (light/dark aware) |
| `.shadow-vercel-popover` | Popover/dropdown shadow |
| `.shadow-vercel-modal` | Modal/dialog shadow |
| `.dragging` | DnD drag state |
| `.landing-3d-canvas` | Three.js canvas helper |
| `.landing-aurora` | Aurora gradient backdrop |
| `.animate-marquee` | Infinite marquee (30s) |
| `.reveal-up` | Scroll-into-view reveal animation |
| `.pulse-ring` | CTA button pulse ring |
| `.media-lightbox-backdrop` | Lightbox dark overlay |

### Dark Mode
- Toggled by adding `.dark` class to `<html>`
- `ThemeProvider` handles toggle + persistence
- Inline `themeInitScript` in `<head>` prevents flash on load
- `200ms ease` transition on `background-color`, `border-color`, `color`
- No per-component `dark:` overrides needed for standard tokens

---

## 7. Subscription Plans

Single source of truth: `src/lib/plans.ts`

| Plan | ID | Display Name | Price | Limits |
|---|---|---|---|---|
| Free | `free` | Aura Starter | Free | 10 practice tests, 5 mock tests, unlimited questions/module |
| Premium | `premium` | Aura Pro | 999 INR/month | Unlimited everything |

### Key Functions
- `planName(id)` — Get display name
- `isPremiumPlan(id)` — Boolean premium check
- `hasAccessToTest(planId, track, testNumber)` — Gate check for tests
- `formatPrice(plan)` — Formatted price string (e.g. "₹999 / month" or "Free")

### Payment Integration (Razorpay)
- **Flow:** Client clicks Upgrade → POST `/api/billing/razorpay/order` → Razorpay order created → client opens Razorpay JS checkout → payment success → Razorpay POSTs to `/api/billing/razorpay/webhook` → profile plan flipped to `premium`
- **Currency:** INR only
- **Verification:** HMAC `SHA256(orderId|paymentId, keySecret)` using `timingSafeEqual` to prevent timing attacks
- **Env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_PLAN_ID`
- **Test mode:** Use card `4111 1111 1111 1111` with `rzp_test_*` keys

---

## 8. Question & Test Architecture

### Task Types (URL format vs DB format)

#### Speaking
| URL slug | DB `task_type` | Friendly Name |
|---|---|---|
| `read-aloud` | `read_aloud` | Read Aloud |
| `repeat-sentence` | `repeat_sentence` | Repeat Sentence |
| `describe-image` | `describe_image` | Describe Image |
| `responding-to-situation` | `responding_to_situation` | Responding to Situation |
| `answer-short-question` | `answer_short_question` | Answer Short Question |

#### Writing
| URL slug | DB `task_type` | Friendly Name |
|---|---|---|
| `summarize-written-text` | `summarize_written_text` | Summarize Written Text |
| `write-an-email` | `write_an_email` | Write an Email |

#### Reading
| URL slug | DB `task_type` | Friendly Name |
|---|---|---|
| `rw-fill-in-the-blanks` | `rw_fill_in_the_blanks` | Reading & Writing: Fill in the Blanks |
| `multiple-choice-multiple` | `reading_mcq_multiple` | Multiple Choice, Multiple Answers |
| `reorder-paragraphs` | `reorder_paragraphs` | Re-order Paragraphs |
| `reading-fill-in-the-blanks` | `reading_fill_in_the_blanks` | Reading: Fill in the Blanks |
| `multiple-choice-single` | `reading_mcq_single` | Multiple Choice, Single Answer |

#### Listening
| URL slug | DB `task_type` | Friendly Name |
|---|---|---|
| `summarize-spoken-text` | `summarize_spoken_text` | Summarize Spoken Text |
| `multiple-choice-multiple` | `listening_mcq_multiple` | Multiple Choice, Multiple Answers |
| `fill-in-the-blanks` | `listening_fill_in_the_blanks` | Fill in the Blanks |
| `multiple-choice-single` | `listening_mcq_single` | Multiple Choice, Single Answer |
| `select-missing-word` | `select_missing_word` | Select Missing Word |
| `highlight-incorrect-words` | `highlight_incorrect_words` | Highlight Incorrect Words |
| `write-from-dictation` | `write_from_dictation` | Write from Dictation |

### Test Definitions
- Practice tests: 20 tests (`testDefinitions.practice.json`)
- Mock tests: 10 tests (`testDefinitions.mock.json`)
- Section order matches PTE exam: **Speaking → Writing → Reading → Listening**
- Data originated from MongoDB (legacy IDs preserved in `legacyIds[]`)
- Until Mongo→Supabase import is done, runner fetches questions by count from matching module
- Functions: `getPracticeTest(id)`, `getMockTest(id)`, `allPracticeTests()`, `allMockTests()`

### Question Components
The `QuestionRunner.tsx` (36KB) is the main engine that renders the right component based on `task_type`. Each question type has a dedicated component under `src/components/questions/<module>/`.

---

## 9. Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role (for admin ops) |
| `SESSION_SECRET` | Server | HMAC secret for session_id cookie |
| `CRON_SECRET` | Server | Bearer token for `/api/cron/cleanup-sessions` |
| `RAZORPAY_KEY_ID` | Server | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Server | Razorpay API secret |
| `NEXT_PUBLIC_RAZORPAY_PLAN_ID` | Public | Razorpay plan ID for subscription |
| `NEXT_PUBLIC_AUDIO_CDN_URL` | Public | Cloudflare R2 CDN for audio (optional, leave blank for Supabase Storage) |

### Supabase Project
- **Project URL:** `https://zmfxfqpkgocnqkgvjelr.supabase.co`
- (Real keys are in `.env.local` — never commit to git)

---

## 10. Routing & Navigation

### Route Groups
- `(auth)` — Public pages: `/login`, `/signup`, `/forgot-password`
- `(dashboard)` — Protected pages: `/dashboard`, `/billing`, `/mock-tests`, `/practice-tests`, `/questions/[module]`, `/specialised-tips`
- `admin` — Admin panel: `/admin/question-links`

### Middleware Protection
Protected routes: `/dashboard/:path*`, `/questions/:path*`, `/api/heartbeat`

Unprotected: `/login`, `/signup`, `/forgot-password`, `/auth/callback`, all landing page routes.

### Navigation Components
- **Desktop:** `Sidebar.tsx` (collapsible left sidebar)
- **Mobile:** `BottomNav.tsx` + `MobileNavDrawer.tsx` (drawer overlay)
- **Header:** `Header.tsx` with user menu + theme toggle
- **Loading:** `NavigationLoader.tsx` (top progress bar on route transitions)

---

## 11. Audio Architecture

- Audio files served from Supabase Storage bucket `pte-media`
- Optional CDN rewrite: set `NEXT_PUBLIC_AUDIO_CDN_URL` to a Cloudflare R2 domain
- `rewriteAudioUrl()` in `taskTypeMapper.ts` handles the host swap (path preserved, host swapped)
- Custom `AudioPlayer.tsx` component with full playback controls

---

## 12. Cron Jobs

| Endpoint | Purpose |
|---|---|
| `/api/cron/cleanup-sessions` | Delete stale `user_sessions` rows |

Authenticated via `CRON_SECRET` bearer token. Schedule configured in `vercel.json`.

---

## 13. Admin Panel

- Route: `/admin/question-links`
- API: `/api/admin/link-questions` + `/api/admin/link-status`
- Purpose: Link legacy MongoDB question IDs to Supabase UUIDs for exact test definitions

---

## 14. Scoring System

Server-side scoring logic in `src/lib/scoring/`:
- `listening.ts` — Listening task scoring
- `reading.ts` — Reading task scoring
- `writing.ts` — Writing task scoring (includes NLP / linguistic analysis)

Linguistic analysis: `src/lib/linguistics/analyze.ts` + `parsePrompt.ts`

---

## 15. Key Design Decisions & Gotchas

### Tailwind v4 — Critical Differences from v3
- Config is `@theme {}` block inside `globals.css` (no `tailwind.config.js`)
- Import: `@import "tailwindcss"` at top of CSS file
- Semantic tokens become utility classes automatically: `bg-canvas`, `text-ink`, `border-hairline`, etc.
- PostCSS handled by `@tailwindcss/postcss`
- Never use v3 patterns like `theme()` or `extend:` in a config file

### No Per-Component Dark Mode Overrides
- All dark mode is handled by swapping CSS custom properties in `.dark` block in `globals.css`
- Never add `dark:bg-*` / `dark:text-*` to components for standard surfaces
- Exception: gradient strips on hero cards (intentionally theme-stable for branding)

### Session Performance Optimization
- **Old (bad):** Middleware queried `user_sessions` table on every click → ~5s latency
- **New (good):** Middleware only does HMAC verify (CPU-only) → heartbeat does DB check every 60s
- `React.cache()` memoizes `getUser()` so multiple server components share one auth call per request

### Audio CDN Strategy
- Supabase Storage egress is costly at scale
- R2 (zero egress fees) is the target CDN for audio
- Set `NEXT_PUBLIC_AUDIO_CDN_URL` when R2 is configured — no DB changes needed

### Test Data (Legacy Migration Pending)
- Original question data is in MongoDB with ObjectIDs
- Supabase uses UUIDs
- Until migration: runner fetches `targetCount` questions by module + task_type
- `legacy_mongo_id` column on `questions` table is planned for exact-ID lookup
- Migration script is planned in `supabase/migrations/`

### Razorpay Webhook Security
- Signatures verified with `crypto.timingSafeEqual` to prevent timing attacks
- Webhook route must be excluded from CSRF protection

### Spell Checking (Write from Dictation)
- Uses `nspell` with dictionaries stored in `public/dictionaries/`
- Loaded client-side for offline spell-check

---

## 16. Development Scripts

```bash
npm run dev           # Start Next.js dev server
npm run dev:clean     # Reset dev cache (Python script in /scripts)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint
npm run deploy        # Deploy to Vercel production
```

---

## 17. Skills & Agent Configuration

Located in `f:\Learning\Projects\Micro\AuraPTE.com\.agents\skills\`:

| Skill | Purpose |
|---|---|
| `interface-details` | Micro-interactions, thoughtful UI details |
| `tailwind-4-docs` | Tailwind v4 documentation & migration guidance |
| `vercel-composition-patterns` | React compound components, render props, context |
| `vercel-react-best-practices` | React/Next.js performance optimization |
| `vercel-react-view-transitions` | View Transition API animations |
| `web-design-guidelines` | UI accessibility & design audit |
| `webapp-testing` | Playwright testing toolkit |

---

## 18. Public Assets

- `public/dictionaries/` — Spell-check dictionaries (used by `nspell` in Write from Dictation)
- `src/app/icon.png` + `apple-icon.png` — App icons (555KB each)

---

## 19. Landing Page

`src/app/page.tsx` (21KB) — Full marketing page featuring:
- 3D Three.js canvas scene in the hero section (`.landing-3d-canvas`)
- Aurora gradient backdrop (`.landing-aurora`)
- Infinite marquee stats strip (`.animate-marquee`)
- Scroll-reveal animations (`.reveal-up`)
- Pulse ring on CTA button (`.pulse-ring`)

---

## 20. Spelling & Naming Conventions

- **Route slugs:** kebab-case (e.g. `read-aloud`, `rw-fill-in-the-blanks`)
- **DB `task_type`:** snake_case (e.g. `read_aloud`, `rw_fill_in_the_blanks`)
- **Components:** PascalCase (e.g. `QuestionRunner.tsx`, `RWFillBlanks.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g. `useHeartbeat`)
- **Lib utilities:** camelCase functions (e.g. `mapUrlToDbTaskType`, `planName`)
- **Plan IDs:** always `"free"` or `"premium"` — never hardcode display names inline, import from `plans.ts`

---

*This file should be updated whenever: new features are added, design tokens change, the database schema evolves, new task types are added, or important architectural decisions are made.*
