# Africa Founders Factory — Public V1

The public-facing website for **Africa Founders Factory (AFF)**, a pan-African
founder community: build, pitch, get challenged, improve, connect, grow.

This is the community-first V1 — no monetization, no fabricated metrics, no
authenticated dashboard. It is built to make Phase 2 (auth, real submissions,
Founder Dashboard) a straightforward extension rather than a rewrite.

## Stack

- **Next.js 16** (App Router, Turbopack, React Server Components)
- **React 19** / **TypeScript** (strict mode)
- **Tailwind CSS v4** (CSS-first theme via `app/globals.css`)
- **next-intl** for bilingual routing (`/fr`, `/en`)
- No animation library, no chart library, no UI kit — motion is CSS
  keyframes + a small `IntersectionObserver`-based `Reveal` primitive;
  charts (score donut, bar chart, progress bars) are hand-built SVG/CSS.

## Requirements

- Node.js ≥ 20 (developed against Node 24)
- pnpm ≥ 9 (developed against pnpm 10)
- WSL / Linux / macOS shell (this project was built and is documented for
  **WSL Ubuntu**; no PowerShell instructions are provided)

## Install

```bash
cd /home/wakama/dev/AFF
pnpm install
```

## Development

```bash
pnpm dev
```

Next.js will pick the first free port starting at 3000 and print the URL.
Visiting `/` redirects to `/fr` (French is the default locale). Language can
be switched from the header/footer FR / EN toggle, which preserves the
current page.

## Lint

```bash
pnpm lint
```

## Typecheck

```bash
pnpm exec tsc --noEmit
```

## Production build

```bash
pnpm build
pnpm start
```

## Tests

No automated test suite exists yet for this batch (not requested in scope).
Verification for this V1 was: lint, typecheck, production build (statically
prerenders all routes × both locales), and manual route/i18n smoke testing
via the dev server. See **Known gaps** below for what a real test suite
should cover next.

## Environment variables

None required for V1. There is no backend, no database, no auth provider.
`NODE_ENV` alone gates the mock-submission console logging in
`lib/services/submission.ts`.

## Project structure

```
app/
  [locale]/            # every public route lives under a locale segment
    layout.tsx         # <html>/<body>, fonts, Header/Footer, metadata
    page.tsx           # homepage (all ~18 designed sections)
    mission/ about/ founders/ community/ pitch-live/ resources/
    join/ apply-to-pitch/ sign-in/ privacy/ terms/
    not-found.tsx       # localized 404
  not-found.tsx          # root-level fallback (outside any locale)
  sitemap.ts / robots.ts
  globals.css            # design tokens (Tailwind v4 @theme)
components/
  layout/     Header, Footer, LanguageSwitcher, MobileNav
  ui/         Button, Container, Chip, Tag, Eyebrow, SectionHeading, Reveal
  home/       one component per homepage section
  scoring/    ScoreOverview, ScoreDimension, ScoreBreakdown, ScoreProgress,
              ActionPlan, DiagnosticGap, RecommendedAction, ProgressChart,
              AssessmentHistory, ScoringExplanation, ReadinessStages
              — built as reusable primitives so the future authenticated
              Founder Dashboard (Phase 2) can reuse them directly
  pitch/      VideoPlaceholder, PitchFormatStats, AfterLiveLoop
  community/  CommunityChips
  resources/  ResourceCategoryList, ResourceSearchInput, ComingSoonBadge
  forms/      the multi-step form kit (StepDots, TextField, TextAreaField,
              RoleOptionCard, ReviewRow, FormNav, SuccessPanel) plus the two
              concrete flows, JoinCommunityForm and ApplyToPitchForm
i18n/         next-intl routing/navigation/request config
messages/     en.json, fr.json — every string in the site, namespaced
lib/
  fonts.ts             next/font definitions (Plus Jakarta Sans + Inter)
  utils.ts             tiny `cn()` classname helper
  services/submission.ts   mock submission boundary (see below)
types/         scoring.ts, forms.ts
middleware.ts  next-intl locale negotiation/redirect
claude-design/ the original Claude Design export — reference only, never
               imported into the app at runtime
```

## i18n architecture

- Locales: `fr` (default), `en`. URL strategy is `/fr/...` and `/en/...`
  (`localePrefix: "always"`), so `/` always redirects to `/fr`.
- All strings live in `messages/fr.json` and `messages/en.json`, namespaced
  by page/section (`home.hero`, `joinCommunity`, `metadata.pitchLive`, …).
  Components never hardcode copy.
- Server Components call `getTranslations()`; the one interactive section
  that needs client-side state (`FactorySection`, the scroll-driven Factory
  journey) and the two multi-step forms call `useTranslations()` via the
  `NextIntlClientProvider` that wraps the whole app.
- Switching language (`components/layout/LanguageSwitcher.tsx`) re-renders
  the **same route** in the other locale rather than bouncing to the
  homepage.
- Metadata (`<title>`, description, OpenGraph, Twitter card, `hreflang`
  alternates) is localized per page via `generateMetadata`.

## Founder Scoring, forms, and the mock-submission boundary

Founder Scoring is presented publicly as an **illustrative diagnostic**,
never a valuation or investor rating — every score/percentage in the UI is
paired with an explicit "illustrative data" / "not an investor rating"
disclaimer, per the design.

`Join the Community` and `Apply to Pitch` are real, validated, multi-step
client flows (step navigation, per-step validation, back/continue, review,
loading, error and success states) — but there is **no backend**. Submission
goes through `lib/services/submission.ts`, a single, explicit boundary that
currently just simulates latency and always resolves successfully. Phase 2
replaces the two functions in that file with real API calls; no component
needs to change.

## Known gaps / next phase

- **No standalone "Founder Scoring" page.** The Claude Design export
  (`claude-design/`) presents Founder Scoring only as a homepage section —
  there is no dedicated `.dc.html` for it. Rather than invent that page's
  design, V1 links to the homepage section (`/#founder-scoring`) from the
  header/footer. A dedicated Founder Scoring page is a Phase 2 design task.
- **Mobile mockups only cover the top of the homepage.** The design export's
  `AFF Mobile 390.dc.html` stops after the Hero and "Why the Factory"
  sections — none of the other ~15 homepage sections, or any secondary page,
  have a dedicated mobile mockup. Every section below that point was made
  responsive by hand, extrapolating the same spacing/type scale and
  left-aligned rhythm the mobile mockup establishes. This should be
  visually reviewed against real devices, not just assumed correct.
- **No visual regression / screenshot QA was performed.** This environment
  has no browser automation tool available. Verification was: production
  build succeeds (all routes × both locales prerender), lint and typecheck
  pass, and manual `curl`-based route/locale/404 smoke testing against the
  dev server. Actual pixel comparison against the `.dc.html` source at
  1440px and 390px, and a real "no console errors" pass in a browser,
  should be done before shipping.
- **No real favicon/brand mark.** The design export contains no logo asset;
  the default Next.js favicon placeholder is still in `app/favicon.ico`.
- **No automated tests.** Given the size of this batch, adding component/
  e2e tests was out of scope; the multi-step forms and locale routing are
  the highest-value places to start.
- **Mobile nav drawer is a reasonable addition, not from the design.** The
  mobile mockup shows a hamburger icon but no expanded state — the drawer
  panel in `MobileNav.tsx` was designed to match the system's tokens, not
  copied from a mockup.
- Auth, real form persistence, Founder Dashboard, resource content, and
  Pitch Live video embedding are all explicitly Phase 2, per the brief.

## Deployment (Coolify → Contabo VPS)

- Build command: `pnpm install && pnpm build`
- Start command: `pnpm start` (Next's built-in Node server; no
  `output: "standalone"` is configured yet — add it to `next.config.ts` if
  Coolify's build step benefits from a smaller runtime image)
- Node version: 20+ (matches `package.json` engines expectations of
  the installed toolchain — pin one explicitly in Coolify's build settings)
- No environment variables are required for this batch
- Domain: point `AfricaFoundersFactory.com` at the Coolify app; update the
  hardcoded `https://africafoundersfactory.com` base URL in
  `app/[locale]/layout.tsx`, `app/sitemap.ts` and `app/robots.ts` if the
  final domain differs
