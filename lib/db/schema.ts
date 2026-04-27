import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  serial,
  uuid,
  json,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'coach', 'participant'])
export const companySizeEnum = pgEnum('company_size', ['startup', 'scaleup', 'enterprise'])
export const programTypeEnum = pgEnum('program_type', ['academy', 'coaching', 'training'])
export const ctaTypeEnum = pgEnum('cta_type', ['apply', 'buy', 'waitlist', 'calendly'])
export const contentTypeEnum = pgEnum('content_type', ['video', 'text', 'exercise', 'pdf'])
export const skillDimensionEnum = pgEnum('skill_dimension', ['wissen', 'koennen', 'machen'])
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['pending', 'active', 'completed', 'cancelled'])
export const lessonStatusEnum = pgEnum('lesson_status', ['locked', 'available', 'done'])
export const assessmentTypeEnum = pgEnum('assessment_type', ['initial', 'periodic', 'final'])
export const assessmentStatusEnum = pgEnum('assessment_status', ['pending', 'in_progress', 'completed'])
export const answerTypeEnum = pgEnum('answer_type', ['scale_1_5', 'multiple_choice', 'text'])
export const recommendationReasonEnum = pgEnum('recommendation_reason', ['high_poorest_skill', 'low_improvement', 'program_prereq', 'manual'])
export const hvcoTypeEnum = pgEnum('hvco_type', ['pdf', 'tool', 'video', 'newsletter'])
export const hvcoDeliveryEnum = pgEnum('hvco_delivery', ['email', 'unlock', 'redirect'])
export const sessionTypeEnum = pgEnum('session_type', ['sparring', 'group_qa', 'training'])
export const newsletterStatusEnum = pgEnum('newsletter_status', ['pending', 'active', 'unsubscribed', 'bounced'])
export const emailTemplateTypeEnum = pgEnum('email_template_type', [
  'doi_confirmation',   // Double Opt-In Bestätigung
  'doi_welcome',        // Welcome nach DOI-Bestätigung
  'sequence_step',      // Für Email-Sequenz-Schritte
  'transactional',      // Einzelne Transaktions-Mails
])
export const landingPageStatusEnum = pgEnum('landing_page_status', ['draft', 'published', 'archived'])
export const landingPageSectionTypeEnum = pgEnum('landing_page_section_type', [
  'hero',                // Headline + Subtext + CTA / Email-Form
  'video',               // VSL oder Erklär-Video
  'social_proof',        // Logos, Zahlen, "Wie bekannt aus"
  'problem',             // Problem-Agitation
  'origin_story',        // Long-form Narrative (Welsh: 'Once upon a time...')
  'solution',            // Lösung / Was du bekommst
  'features',            // Feature-Liste mit Icons
  'how_it_works',        // Schritt-für-Schritt
  'curriculum',          // Kapitel-/Modul-Liste mit Beschreibungen (NEW)
  'bonus_deliverables',  // 'More than just theory' — Bonus-Materialien (NEW)
  'fit_check',           // 'Good fit / Not good fit' 2-Spalten (NEW)
  'testimonials',        // Kunden-Stimmen
  'tweet_wall',          // Social-Proof-Wand mit kurzen Quotes / Tweets (NEW)
  'offer',               // Angebot / Preis-Box
  'pricing_card',        // Single-Tier-Pricing mit Deliverables-Liste (NEW)
  'risk_reversal',       // 'Why I'm not offering refunds' / Garantie-Erklärung (NEW)
  'faq',                 // FAQ Accordion
  'email_capture',       // Standalone Email-Formular / Lead-Magnet
  'cta',                 // Finaler Call-to-Action
  'coach_bio',           // Coach/Instructor-Vorstellung
  'spacer',              // Abstandhalter
])
export const emailSequenceTriggerEnum = pgEnum('email_sequence_trigger', [
  'newsletter_signup',       // Nach Newsletter-Aneldung
  'doi_confirmed',           // Nach DOI-Bestätigung
  'landing_page_signup',     // Nach Landing-Page-Formular
  'program_enrollment',      // Nach Programm-Buchung
  'manual',                   // Manuell ausgelöst
])

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('participant').notNull(),
  companyId: uuid('company_id'),
  avatarUrl: text('avatar_url'),
  locale: text('locale').default('de').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Companies ─────────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'),
  size: companySizeEnum('size'),
  website: text('website'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Programs ─────────────────────────────────────────────────────────────────

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  coachId: uuid('coach_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  type: programTypeEnum('type').notNull(),
  ctaType: ctaTypeEnum('cta_type').default('apply'),
  status: text('status').default('draft').notNull(),
  price: real('price'),
  maxParticipants: integer('max_participants'),
  locale: text('locale').default('de').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Signature Solutions ─────────────────────────────────────────────────────

export const signatureSolutions = pgTable('signature_solutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  outcome: text('outcome'),
  overviewHtml: text('overview_html'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Solution Phases ────────────────────────────────────────────────────────

export const solutionPhases = pgTable('solution_phases', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').notNull().references(() => signatureSolutions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  durationWeeks: integer('duration_weeks'),
})

export const solutionSteps = pgTable('solution_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  phaseId: uuid('phase_id').notNull().references(() => solutionPhases.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
})

// ─── Modules — Lessons ─────────────────────────────────────────────────────────

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  unlockAfterDays: integer('unlock_after_days').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  contentType: contentTypeEnum('content_type').notNull(),
  videoUrl: text('video_url'),
  contentHtml: text('content_html'),
  durationMin: integer('duration_min'),
  order: integer('order').notNull(),
  status: lessonStatusEnum('status').default('locked').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Enrollments — Progress ──────────────────────────────────────────────────────

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  programId: uuid('program_id').notNull().references(() => programs.id),
  status: enrollmentStatusEnum('status').default('pending').notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  status: lessonStatusEnum('status').default('locked').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
})

// ─── Skills ──────────────────────────────────────────────────────────────────

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  dimension: skillDimensionEnum('dimension').notNull(),
  programId: uuid('program_id').references(() => programs.id),
})

export const assessmentQuestions = pgTable('assessment_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
  question: text('question').notNull(),
  type: answerTypeEnum('type').notNull(),
  options: json('options').$type<string[]>(),
  order: integer('order').notNull(),
})

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  type: assessmentTypeEnum('type').notNull(),
  status: assessmentStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  score: real('score'),
})

export const assessmentAnswers = pgTable('assessment_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => assessmentQuestions.id),
  answer: text('answer').notNull(),
  score: real('score'),
})

// ─── Skill Scores ────────────────────────────────────────────────────────────

export const skillScores = pgTable('skill_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
  assessmentId: uuid('assessment_id').references(() => assessments.id),
  score: real('score').notNull(),
  scoredAt: timestamp('scored_at').defaultNow().notNull(),
})

export const skillRecommendations = pgTable('skill_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
  reason: recommendationReasonEnum('reason').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Resources / HVCO ─────────────────────────────────────────────────

export const programHvcos = pgTable('program_hvcos', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').references(() => programs.id, { onDelete: 'set null' }),
  type: hvcoTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  isFeatured: boolean('is_featured').default(false),
  gateFields: json('gate_fields').$type<string[]>(),
  deliveryType: hvcoDeliveryEnum('delivery_type').default('email').notNull(),
  deliveryTarget: text('delivery_target'),
  sortOrder: integer('sort_order').default(0),
  isPublished: boolean('is_published').default(true),
})

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const programTestimonials = pgTable('program_testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').references(() => programs.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role'),
  authorCompany: text('author_company'),
  quote: text('quote').notNull(),
  avatarUrl: text('avatar_url'),
  sortOrder: integer('sort_order').default(0),
})

// ─── Coach Notes ──────────────────────────────────────────────────────────────

export const coachNotes = pgTable('coach_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: sessionTypeEnum('type').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  calendlyUrl: text('calendly_url'),
  coachId: uuid('coach_id').references(() => users.id, { onDelete: 'set null' }),
  programId: uuid('program_id').references(() => programs.id, { onDelete: 'set null' }),
  enrollmentId: uuid('enrollment_id').references(() => enrollments.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  pdfUrl: text('pdf_url'),
  verifyToken: text('verify_token').notNull().unique(),
})

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  source: text('source').default('website'), // 'website', 'salesmade', 'markus', 'aljona', etc.
  status: newsletterStatusEnum('status').default('pending').notNull(),
  lists: json('lists').$type<string[]>().default([]), // e.g. ['general', 'salesmade']
  consentGiven: boolean('consent_given').default(false).notNull(),
  consentAt: timestamp('consent_at'),
  // DOI (Double Opt-In) flow
  doiToken: text('doi_token').unique(),
  doiSentAt: timestamp('doi_sent_at'),
  doiConfirmedAt: timestamp('doi_confirmed_at'),
  // Beehiiv sync
  beehiivId: text('beehiiv_id'),
  beehiivSyncedAt: timestamp('beehiiv_synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Email Templates ──────────────────────────────────────────────────────────

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: emailTemplateTypeEnum('type').notNull(),
  name: text('name').notNull(),                 // z.B. "DOI-Bestätigung Deutsch"
  locale: text('locale').default('de').notNull(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),         // HTML mit {{firstName}}, {{confirmUrl}} etc.
  bodyText: text('body_text'),                   // Plaintext-Fallback
  fromName: text('from_name').default('Eilers+Friends'),
  fromEmail: text('from_email').default('hallo@eilersfriends.com'),
  isDefault: boolean('is_default').default(false).notNull(), // Standardtemplate je Typ+Locale
  variables: json('variables').$type<string[]>().default([]), // Dokumentiert verfügbare Variablen
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Landing Pages ────────────────────────────────────────────────────────────

export const landingPages = pgTable('landing_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),          // URL: /lp/salesmade-bootcamp
  title: text('title').notNull(),
  metaDescription: text('meta_description'),
  ogImageUrl: text('og_image_url'),
  status: landingPageStatusEnum('status').default('draft').notNull(),
  // Welche Email-Liste soll hier befüllt werden?
  emailList: text('email_list'),                  // z.B. 'salesmade', 'liquid-leadership'
  emailSequenceId: uuid('email_sequence_id'),     // Welche Sequenz soll triggern?
  // Tracking & Analytics
  utmSource: text('utm_source'),
  locale: text('locale').default('de').notNull(),
  // Design-Overrides
  accentColor: text('accent_color'),              // z.B. '#1A5FD4' für SalesMade
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const landingPageSections = pgTable('landing_page_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  landingPageId: uuid('landing_page_id').notNull().references(() => landingPages.id, { onDelete: 'cascade' }),
  type: landingPageSectionTypeEnum('type').notNull(),
  order: integer('order').notNull().default(0),
  isVisible: boolean('is_visible').default(true).notNull(),
  content: json('content').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Email Sequenzen ────────────────────────────────────────────────────────────

export const emailSequences = pgTable('email_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  trigger: emailSequenceTriggerEnum('trigger').notNull(),
  triggerFilter: json('trigger_filter').$type<Record<string, unknown>>().default({}),
  // z.B. { source: 'salesmade' } —"nur für SalesMade-Signups
  isActive: boolean('is_active').default(false).notNull(),
  locale: text('locale').default('de').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const emailSequenceSteps = pgTable('email_sequence_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id').notNull().references(() => emailSequences.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').notNull().references(() => emailTemplates.id),
  order: integer('order').notNull().default(0),
  delayHours: integer('delay_hours').notNull().default(0), // 0 = sofort, 24 = nach 1 Tag
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Welche Subscriber bekommen welche Sequenz-Steps (Tracking)
export const emailSequenceEnrollments = pgTable('email_sequence_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriberId: uuid('subscriber_id').notNull().references(() => newsletterSubscribers.id, { onDelete: 'cascade' }),
  sequenceId: uuid('sequence_id').notNull().references(() => emailSequences.id, { onDelete: 'cascade' }),
  currentStep: integer('current_step').default(0).notNull(),
  status: text('status').default('active').notNull(), // 'active', 'completed', 'unsubscribed'
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  nextSendAt: timestamp('next_send_at'),
  lastSentAt: timestamp('last_sent_at'),
  completedAt: timestamp('completed_at'),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  enrollments: many(enrollments),
  coachPrograms: many(programs),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}))

export const programsRelations = relations(programs, ({ one, many }) => ({
  coach: one(users, { fields: [programs.coachId], references: [users.id] }),
  signatureSolution: one(signatureSolutions),
  modules: many(modules),
  enrollments: many(enrollments),
  hvcos: many(programHvcos),
  testimonials: many(programTestimonials),
  sessions: many(sessions),
}))

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  program: one(programs, { fields: [enrollments.programId], references: [programs.id] }),
  lessonProgress: many(lessonProgress),
  assessments: many(assessments),
  skillScores: many(skillScores),
  coachNotes: many(coachNotes),
  sessions: many(sessions),
  certificate: one(certificates),
}))
