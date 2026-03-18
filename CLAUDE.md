# Eilers+Friends — Claude Code Projektkontext

## Projektübersicht
Website-Relaunch für eilersfriends.com — Coaching & Training für Gründer:innen.
Coaches: Markus Eilers (Revenue Systems / B2B-Vertrieb) + Aljona Eilers (Transformational Leadership).

## Repo
https://github.com/MarkusEilers/eilersfriends

## Tokens & Secrets
Tokens liegen in `.claude-secrets.local` (git-ignoriert, via Dropbox synced).

---

## Tech Stack
| Tool | Detail |
|---|---|
| Framework | Next.js 15, App Router, Turbopack |
| Package Manager | pnpm |
| Styling | Tailwind CSS v4 |
| Fonts | DM Serif Display + DM Sans (Google Fonts CDN) |
| ORM | Drizzle ORM |
| Datenbank | Vercel Postgres |
| Auth | NextAuth v5 (Credentials + bcrypt) |
| i18n | next-intl (DE default no prefix, EN at `/en/`) |
| Icons | Lucide React |
| E-Mail | Resend |
| File Storage | Vercel Blob |
| Payments | Stripe |
| Newsletter | Beehiiv API (Double Opt-In aktiviert) |
| Deployment | Vercel |

---

## Design System
- **Fonts:** DM Serif Display (Headlines) + DM Sans (Body)
- **Orange** `#F05A1A` → Homepage / Energy (bg `#FFF1EB`, border `#FECDBB`)
- **Blue** `#1A5FD4` → Markus / SalesMade (bg `#EBF1FF`, border `#BBCFF5`)
- **Red** `#D4192B` → Aljona / Liquid Leadership (bg `#FFEBEC`, border `#F5BBBC`)
- **Purple** `#6B5CE7` → Topbar (bg `#F0EEFF`)
- **Amber** `#B07C0A` → Aljona Stat-Chips (bg `#FFF8E6`)
- **Ink** `#0D0D0B` — Base-Text
- **Cream** `#FAFAF8` — Section-Backgrounds
- **Navy** `#0F1E3A` — Dark accents
- **Near-Black** `#0A0D14` — Footer bg

---

## Architektur

### Route-Groups
```
app/[locale]/
├── (marketing)/layout.tsx   → Topbar + Navbar + Footer + CookieBanner
├── (landing)/layout.tsx     → NavbarSlim + FooterSlim (keine Topbar)
├── (portal)/layout.tsx      → Auth-required, Portal-Sidebar
└── (admin)/layout.tsx       → Admin-Sidebar
```

### Multi-Domain via Middleware
```
salesmade.com      → /salesmade   (landing layout)
aljonaeilers.com   → /aljona      (landing layout)
markuseilers.com   → /markus      (landing layout)
eilersfriends.com  → normale Seiten
```

### Komponentenstruktur
```
components/
├── layout/       Topbar, Navbar, NavbarSlim, Footer, FooterSlim, CookieBanner
├── blocks/       LogoScrollbar, AnimatedNumber, SectionHeader, PillTag, TestimonialCard
├── sections/     Alle Homepage-Sektionen
└── ui/           Button, Card, Badge, Input, Dialog, etc.
```

### i18n
- Lokale: `de` (default, kein Prefix), `en` (Prefix `/en/`)
- Nachrichten: `lib/i18n/messages/de.json` + `en.json`
- Sprache wechseln: `router.replace(pathname, { locale: code })`

---

## Konventionen
- **Seitennamen/Slugs auf Englisch** (z.B. `/b2b-offers`, nicht `/b2b-angebote`)
- Layout NICHT in jede Seite kopieren — Route-Group-Layouts verwenden
- Wiederverwendbare Blöcke in `components/blocks/` (keine Einmal-Lösungen)
- Keine automatischen Commits — nur wenn explizit gewünscht
- Standard-Sprache für Nutzer: **Deutsch**

---

## Homepage-Sektionen (Reihenfolge)
1. `HeroSection` — "Entfessle Dein Winning Team für planbares Wachstum"
2. `LogoStripSection` — Kundenlogos (Marquee)
3. `ProblemSection` — "Was die besten Gründer anders machen" (2×2 Grid)
4. `BentoGrid` — "Ein Ökosystem für echtes Wachstum"
5. `SalesMadeAcademySection` — Blue, Soft-Launch, 2 Steps, Stats
6. `CoachesSection` — B&W Fotos, "Zwei Disziplinen. Ein Ergebnis."
7. `ProgrammeSection` — "Finde Deinen Einstieg" (3 Cards)
8. `HVCOSection` — Kostenlose Ressourcen
9. `TestimonialsSection` — Klienten-Stimmen
10. `CtaBlock` — "45 Minuten für Deine nächsten 36 Monate"
11. `NewsletterSection` — Double Opt-In, orange bg

---

## Aktueller Status (März 2026)

### Fertig ✅
- Kompletter Neuaufbau (Manus-Code verworfen)
- Foundation: package.json, next.config, tailwind, tsconfig, drizzle.config
- DB-Schema (20+ Tabellen per Datenmodell)
- Auth (NextAuth v5, bcrypt), i18n, Middleware
- Layout-Komponenten: Topbar, Navbar, NavbarSlim, Footer, FooterSlim, CookieBanner
- Block-Komponenten: LogoScrollbar, AnimatedNumber, SectionHeader, PillTag, TestimonialCard
- Alle 11 Homepage-Sektionen gebaut
- Landing Pages: /salesmade, /markus, /aljona (Placeholder), /b2b-offers (HVCO)
- Portal: /dashboard (Placeholder)
- Admin: /admin (Placeholder)
- Auth: /auth/login
- API: /api/newsletter/subscribe (Beehiiv, DOI), /api/cron/assessments

### Noch offen 🔲
- Fotos einfügen: `/public/markus-photo.jpg` + `/public/aljona-photo.jpg`
- Logo-Dateien für LogoStrip: `/public/logos/*.png`
- Vercel Postgres DB verbinden + `drizzle-kit push`
- Landing Pages ausbauen: /salesmade, /markus, /aljona (echte Inhalte)
- Portal (Dashboard, Lerninterface, Assessment)
- Admin-Backend
- Testimonials mit echten Inhalten füllen
- Stripe-Integration
- Resend E-Mail-Templates

---

## Drizzle DB Schema
`lib/db/schema.ts` enthält:
- users, companies
- programs, signature_solutions, solution_phases, solution_steps
- modules, lessons
- enrollments, lesson_progress
- skills, assessment_questions, assessments, assessment_answers
- skill_scores (append-only!), skill_recommendations
- program_hvcos, program_testimonials
- coach_notes, sessions, certificates
