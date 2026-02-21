# Eilers & Friends – Unternimm Dich

Coaching-Platform mit LMS, CRM und Outreach-Automationen.

## Tech Stack

| Komponente | Technologie |
|-----------|-------------|
| Framework | Next.js 15 (App Router) |
| Hosting | Vercel |
| Database | Vercel Postgres (Neon) + Drizzle ORM |
| CMS | Sanity v3 |
| Auth | NextAuth v5 (Credentials) |
| i18n | next-intl (DE, EN, RU) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| E-Mail | Resend |
| Storage | Vercel Blob |
| Scheduling | Calendly (Webhook) |

## Projektstruktur

```
app/
  [locale]/
    (marketing)/     → Öffentliche Seiten (Home, Programme, Blog, etc.)
    (portal)/        → Teilnehmer-Portal (Dashboard, Programm-Fortschritt)
    (admin)/         → Coach/Admin Dashboard (CRM, Reviews, Sequences)
  api/               → API Routes (Auth, Upload, Webhooks, Cron)
  studio/            → Sanity Studio (/studio)

lib/
  db/
    schema.ts        → 12 Drizzle-Tabellen (CRM + LMS + Sequences)
    queries/         → Query Helpers
  sanity/
    client.ts        → Sanity Client
    queries.ts       → GROQ Queries
  auth/
    config.ts        → NextAuth v5 Konfiguration
  i18n/
    routing.ts       → Locale Routing (de, en, ru)
    messages/        → Übersetzungsdateien

sanity/
  schemas/           → 9 Sanity Schemas (Program, Phase, Step, etc.)

components/
  shared/            → Header, Footer
  marketing/         → Marketing-Komponenten
  portal/            → Portal-Komponenten
  admin/             → Admin-Komponenten
  ui/                → shadcn/ui Basis-Komponenten
```

## Datenmodell

### CMS (Sanity) – 9 Content-Types
- **Program** → ProgramPhase → ProgramStep (4 Typen: Information, Exercise, Workbook, Sparring)
- **Framework** (kostenfreie Downloads mit Lead-Capture)
- **BlogPost** → Category
- **Coach**, **Testimonial**, **SiteSettings**

### Database (PostgreSQL) – 12 Tabellen
- **CRM:** companies, contacts
- **LMS:** enrollments, step_completions, workbook_submissions, sparring_sessions
- **Sequences:** sequences, sequence_steps, sequence_enrollments, sequence_step_executions
- **Marketing:** framework_downloads, newsletter_subscribers, form_submissions, cookie_consents

## Setup

### 1. Accounts erstellen
- [Vercel](https://vercel.com) – Hosting + Postgres + Blob
- [Sanity](https://sanity.io) – CMS
- [Resend](https://resend.com) – E-Mail

### 2. Environment Variables

```bash
cp .env.example .env
```

Alle Variablen in `.env.example` ausfüllen.

### 3. Dependencies installieren

```bash
pnpm install
```

### 4. Database migrieren

```bash
pnpm db:push
```

### 5. Dev Server starten

```bash
pnpm dev
```

### 6. Sanity Studio

Öffne `http://localhost:3000/studio` für das CMS.

## Deployment

```bash
# Vercel CLI
vercel

# Oder via Git Push (wenn mit Vercel verbunden)
git push origin main
```

## Sprachen

| Code | Sprache | URL-Prefix |
|------|---------|-----------|
| de | Deutsch | / (Standard) |
| en | English | /en/ |
| ru | Русский | /ru/ (versteckt in Navigation) |

## Rollen

| Rolle | Zugang |
|-------|--------|
| admin | Alles (CRM, Sequences, Reviews) |
| coach | Reviews, Sparrings, Teilnehmer |
| participant | Portal (eigene Programme, Fortschritt) |
