import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/** Antworten aus dem Academy-Quiz („What does your team need right now?“). */
let ready = false
async function ensure() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS academy_quiz_leads (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email           TEXT NOT NULL,
      first_name      TEXT,
      answers         JSONB NOT NULL DEFAULT '{}'::jsonb,
      challenge       TEXT,
      stage           TEXT,
      recommendation  TEXT,
      consent_at      TIMESTAMPTZ,
      page            TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  ready = true
}

export interface QuizLead {
  email: string; firstName?: string; answers: Record<string, string>; challenge?: string
  stage?: string; recommendation?: string; consent: boolean; page?: string
}

export async function saveQuizLead(l: QuizLead) {
  await ensure()
  await db.execute(sql`
    INSERT INTO academy_quiz_leads (email, first_name, answers, challenge, stage, recommendation, consent_at, page)
    VALUES (${l.email}, ${l.firstName ?? null}, ${JSON.stringify(l.answers)}::jsonb, ${l.challenge ?? null}, ${l.stage ?? null},
            ${l.recommendation ?? null}, ${l.consent ? new Date().toISOString() : null}, ${l.page ?? null})`)
}
