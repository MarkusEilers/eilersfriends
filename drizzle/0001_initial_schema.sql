-- =============================================================================
-- Eilers+Friends — Initial Schema Migration
-- Paste this into Supabase SQL Editor and run once
-- =============================================================================

-- Enums
CREATE TYPE IF NOT EXISTS "user_role" AS ENUM ('admin', 'coach', 'participant');
CREATE TYPE IF NOT EXISTS "company_size" AS ENUM ('startup', 'scaleup', 'enterprise');
CREATE TYPE IF NOT EXISTS "program_type" AS ENUM ('academy', 'coaching', 'training');
CREATE TYPE IF NOT EXISTS "cta_type" AS ENUM ('apply', 'buy', 'waitlist', 'calendly');
CREATE TYPE IF NOT EXISTS "content_type" AS ENUM ('video', 'text', 'exercise', 'pdf');
CREATE TYPE IF NOT EXISTS "skill_dimension" AS ENUM ('wissen', 'koennen', 'machen');
CREATE TYPE IF NOT EXISTS "enrollment_status" AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS "lesson_status" AS ENUM ('locked', 'available', 'done');
CREATE TYPE IF NOT EXISTS "assessment_type" AS ENUM ('initial', 'periodic', 'final');
CREATE TYPE IF NOT EXISTS "assessment_status" AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE IF NOT EXISTS "answer_type" AS ENUM ('scale_1_5', 'multiple_choice', 'text');
CREATE TYPE IF NOT EXISTS "recommendation_reason" AS ENUM ('low_wissen', 'low_koennen', 'low_machen');
CREATE TYPE IF NOT EXISTS "recommendation_status" AS ENUM ('pending', 'accepted', 'dismissed');
CREATE TYPE IF NOT EXISTS "hvco_type" AS ENUM ('pdf', 'tool', 'video', 'newsletter');
CREATE TYPE IF NOT EXISTS "hvco_delivery" AS ENUM ('email', 'unlock', 'redirect');
CREATE TYPE IF NOT EXISTS "session_type" AS ENUM ('sparring', 'group_qa', 'training');

-- =============================================================================
-- COMPANIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS "companies" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"           TEXT NOT NULL,
  "industry"       TEXT,
  "size"           "company_size",
  "contract_start" TIMESTAMP,
  "website"        TEXT,
  "notes"          TEXT,
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "users" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"          TEXT NOT NULL UNIQUE,
  "full_name"      TEXT NOT NULL,
  "password_hash"  TEXT,
  "role"           "user_role" NOT NULL DEFAULT 'participant',
  "company_id"     UUID REFERENCES "companies"("id") ON DELETE SET NULL,
  "email_verified" TIMESTAMP,
  "avatar_url"     TEXT,
  "linkedin_url"   TEXT,
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PROGRAMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "programs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"              TEXT NOT NULL UNIQUE,
  "type"              "program_type" NOT NULL,
  "hero_headline"     TEXT NOT NULL,
  "tagline"           TEXT,
  "hero_subtext"      TEXT,
  "intro_video_url"   TEXT,
  "problem_statements" JSONB,
  "stat_highlights"   JSONB,
  "criteria_json"     JSONB,
  "cta_type"          "cta_type" NOT NULL DEFAULT 'apply',
  "cta_label"         TEXT,
  "cta_target_url"    TEXT,
  "spots_total"       INTEGER,
  "spots_taken"       INTEGER DEFAULT 0,
  "is_published"      BOOLEAN NOT NULL DEFAULT FALSE,
  "coach_id"          UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "accent_color"      TEXT DEFAULT 'orange',
  "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SIGNATURE SOLUTION
-- =============================================================================
CREATE TABLE IF NOT EXISTS "signature_solutions" (
  "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "program_id"              UUID NOT NULL UNIQUE REFERENCES "programs"("id") ON DELETE CASCADE,
  "bad_place_title"         TEXT NOT NULL,
  "bad_place_description"   TEXT,
  "happy_place_title"       TEXT NOT NULL,
  "happy_place_description" TEXT,
  "solution_name"           TEXT NOT NULL,
  "solution_tagline"        TEXT
);

CREATE TABLE IF NOT EXISTS "solution_phases" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "solution_id" UUID NOT NULL REFERENCES "signature_solutions"("id") ON DELETE CASCADE,
  "position"    INTEGER NOT NULL,
  "title"       TEXT NOT NULL,
  "subtitle"    TEXT,
  "outcome"     TEXT,
  "color_key"   TEXT
);

CREATE TABLE IF NOT EXISTS "solution_steps" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phase_id"            UUID NOT NULL REFERENCES "solution_phases"("id") ON DELETE CASCADE,
  "position"            INTEGER NOT NULL,
  "theme"               TEXT,
  "title"               TEXT NOT NULL,
  "micro_transformation" TEXT,
  "linked_lesson_id"    UUID,
  "linked_skill_id"     UUID
);

-- =============================================================================
-- MODULES & LESSONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "modules" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "program_id"      UUID NOT NULL REFERENCES "programs"("id") ON DELETE CASCADE,
  "title"           TEXT NOT NULL,
  "position"        INTEGER NOT NULL,
  "drip_delay_days" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "lessons" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_id"        UUID NOT NULL REFERENCES "modules"("id") ON DELETE CASCADE,
  "title"            TEXT NOT NULL,
  "position"         INTEGER NOT NULL,
  "content_type"     "content_type" NOT NULL DEFAULT 'video',
  "video_url"        TEXT,
  "body"             TEXT,
  "duration_minutes" INTEGER,
  "primary_skill_id" UUID,
  "skill_dimension"  "skill_dimension"
);

-- =============================================================================
-- ENROLLMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "enrollments" (
  "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"                 UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "program_id"              UUID NOT NULL REFERENCES "programs"("id") ON DELETE CASCADE,
  "assigned_by"             UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "status"                  "enrollment_status" NOT NULL DEFAULT 'pending',
  "goal"                    TEXT,
  "assessment_interval_days" INTEGER DEFAULT 30,
  "next_assessment_at"      TIMESTAMP,
  "started_at"              TIMESTAMP,
  "completed_at"            TIMESTAMP,
  "created_at"              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "lesson_progress" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "lesson_id"     UUID NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
  "status"        "lesson_status" NOT NULL DEFAULT 'locked',
  "completed_at"  TIMESTAMP,
  UNIQUE ("enrollment_id", "lesson_id")
);

-- =============================================================================
-- SKILLS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "skills" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"      TEXT NOT NULL,
  "slug"       TEXT NOT NULL UNIQUE,
  "category"   TEXT,
  "icon"       TEXT,
  "sort_order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "assessment_questions" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "skill_id"      UUID NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "dimension"     "skill_dimension" NOT NULL,
  "question_text" TEXT NOT NULL,
  "answer_type"   "answer_type" NOT NULL DEFAULT 'scale_1_5',
  "weight"        REAL DEFAULT 1.0
);

-- =============================================================================
-- ASSESSMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "assessments" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "type"          "assessment_type" NOT NULL,
  "status"        "assessment_status" NOT NULL DEFAULT 'pending',
  "due_at"        TIMESTAMP,
  "completed_at"  TIMESTAMP,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "assessment_answers" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_id" UUID NOT NULL REFERENCES "assessments"("id") ON DELETE CASCADE,
  "question_id"   UUID NOT NULL REFERENCES "assessment_questions"("id") ON DELETE CASCADE,
  "answer_value"  TEXT NOT NULL,
  "score_raw"     REAL
);

-- =============================================================================
-- SKILL SCORES (append-only — never UPDATE, only INSERT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "skill_scores" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "skill_id"      UUID NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "assessment_id" UUID NOT NULL REFERENCES "assessments"("id") ON DELETE CASCADE,
  "wissen"        REAL NOT NULL,
  "koennen"       REAL NOT NULL,
  "machen"        REAL NOT NULL,
  "overall"       REAL NOT NULL,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "skill_recommendations" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "skill_id"      UUID NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "content_type"  TEXT,
  "content_id"    UUID,
  "reason"        "recommendation_reason" NOT NULL,
  "status"        "recommendation_status" NOT NULL DEFAULT 'pending',
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- HVCO RESOURCES
-- =============================================================================
CREATE TABLE IF NOT EXISTS "program_hvcos" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "program_id"      UUID REFERENCES "programs"("id") ON DELETE SET NULL,
  "type"            "hvco_type" NOT NULL,
  "title"           TEXT NOT NULL,
  "description"     TEXT,
  "is_featured"     BOOLEAN DEFAULT FALSE,
  "gate_fields"     JSONB,
  "delivery_type"   "hvco_delivery" NOT NULL DEFAULT 'email',
  "delivery_target" TEXT,
  "sort_order"      INTEGER DEFAULT 0,
  "is_published"    BOOLEAN DEFAULT TRUE
);

-- =============================================================================
-- TESTIMONIALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "program_testimonials" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "program_id"     UUID REFERENCES "programs"("id") ON DELETE SET NULL,
  "author_name"    TEXT NOT NULL,
  "author_role"    TEXT,
  "author_company" TEXT,
  "quote"          TEXT NOT NULL,
  "avatar_url"     TEXT,
  "sort_order"     INTEGER DEFAULT 0
);

-- =============================================================================
-- COACH NOTES
-- =============================================================================
CREATE TABLE IF NOT EXISTS "coach_notes" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "author_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body"          TEXT NOT NULL,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SESSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS "sessions" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type"          "session_type" NOT NULL,
  "scheduled_at"  TIMESTAMP,
  "calendly_url"  TEXT,
  "coach_id"      UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "program_id"    UUID REFERENCES "programs"("id") ON DELETE SET NULL,
  "enrollment_id" UUID REFERENCES "enrollments"("id") ON DELETE SET NULL,
  "notes"         TEXT,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CERTIFICATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS "certificates" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "issued_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "pdf_url"       TEXT,
  "verify_token"  TEXT NOT NULL UNIQUE
);

-- =============================================================================
-- INDEXES (performance)
-- =============================================================================
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_company" ON "users"("company_id");
CREATE INDEX IF NOT EXISTS "idx_enrollments_user" ON "enrollments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_enrollments_program" ON "enrollments"("program_id");
CREATE INDEX IF NOT EXISTS "idx_lesson_progress_enrollment" ON "lesson_progress"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_skill_scores_enrollment" ON "skill_scores"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_assessments_enrollment" ON "assessments"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_assessments_due" ON "assessments"("due_at") WHERE "status" = 'pending';

-- =============================================================================
-- Seed: 13 Core Skills (Wissen-Können-Machen Framework)
-- =============================================================================
INSERT INTO "skills" ("title", "slug", "category", "sort_order") VALUES
  ('Discovery & Qualification', 'discovery', 'vertrieb', 1),
  ('Bedarfsanalyse', 'bedarfsanalyse', 'vertrieb', 2),
  ('Präsentation & Demo', 'praesentation', 'vertrieb', 3),
  ('Einwandbehandlung', 'einwandbehandlung', 'vertrieb', 4),
  ('Abschluss & Closing', 'closing', 'vertrieb', 5),
  ('Pipeline Management', 'pipeline', 'vertrieb', 6),
  ('Account Management', 'account-management', 'vertrieb', 7),
  ('Führung & Delegation', 'fuehrung', 'leadership', 8),
  ('Kommunikation', 'kommunikation', 'leadership', 9),
  ('Strategie & Planung', 'strategie', 'leadership', 10),
  ('Teamaufbau & Kultur', 'teamaufbau', 'leadership', 11),
  ('Selbstmanagement', 'selbstmanagement', 'persoenlichkeit', 12),
  ('Mindset & Resilienz', 'mindset', 'persoenlichkeit', 13)
ON CONFLICT ("slug") DO NOTHING;

-- Done!
SELECT 'Schema migration completed successfully.' AS status;
