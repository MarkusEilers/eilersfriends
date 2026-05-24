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
export const recommendationReasonEnum = pgEnum('recommendation_reason', ['low_wissen', 'low_koennen', 'low_machen'])
export const recommendationStatusEnum = pgEnum('recommendation_status', ['pending', 'accepted', 'dismissed'])
export const hvcoTypeEnum = pgEnum('hvco_type', ['pdf', 'tool', 'video', 'newsletter'])
export const hvcoDeliveryEnum = pgEnum('hvco_delivery', ['email', 'unlock', 'redirect'])
export const sessionTypeEnum = pgEnum('session_type', ['sparring', 'group_qa', 'training'])
export const newsletterStatusEnum = pgEnum('newsletter_status', ['pending', 'active', 'unsubscribed', 'bounced'])

// ─── Companies ────────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'),
  size: companySizeEnum('size'),
  contractStart: timestamp('contract_start'),
  website: text('website'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').default('participant').notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  emailVerified: timestamp('email_verified'),
  avatarUrl: text('avatar_url'),
  linkedinUrl: text('linkedin_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Programs ─────────────────────────────────────────────────────────────────

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  type: programTypeEnum('type').notNull(),
  heroHeadline: text('hero_headline').notNull(),
  tagline: text('tagline'),
  heroSubtext: text('hero_subtext'),
  introVideoUrl: text('intro_video_url'),
  problemStatements: json('problem_statements').$type<string[]>(),
  statHighlights: json('stat_highlights').$type<{ value: string; label: string; color: string }[]>(),
  criteriaJson: json('criteria_json').$type<string[]>(),
  ctaType: ctaTypeEnum('cta_type').default('apply').notNull(),
  ctaLabel: text('cta_label'),
  ctaTargetUrl: text('cta_target_url'),
  spotsTotal: integer('spots_total'),
  spotsTaken: integer('spots_taken').default(0),
  isPublished: boolean('is_published').default(false).notNull(),
  coachId: uuid('coach_id').references(() => users.id, { onDelete: 'set null' }),
  accentColor: text('accent_color').default('orange'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Signature Solution ───────────────────────────────────────────────────────

export const signatureSolutions = pgTable('signature_solutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }).unique(),
  badPlaceTitle: text('bad_place_title').notNull(),
  badPlaceDescription: text('bad_place_description'),
  happyPlaceTitle: text('happy_place_title').notNull(),
  happyPlaceDescription: text('happy_place_description'),
  solutionName: text('solution_name').notNull(),
  solutionTagline: text('solution_tagline'),
})

export const solutionPhases = pgTable('solution_phases', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').notNull().references(() => signatureSolutions.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  outcome: text('outcome'),
  colorKey: text('color_key'),
})

export const solutionSteps = pgTable('solution_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  phaseId: uuid('phase_id').notNull().references(() => solutionPhases.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  theme: text('theme'),
  title: text('title').notNull(),
  microTransformation: text('micro_transformation'),
  linkedLessonId: uuid('linked_lesson_id'),
  linkedSkillId: uuid('linked_skill_id'),
})

// ─── Modules & Lessons ────────────────────────────────────────────────────────

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull(),
  dripDelayDays: integer('drip_delay_days').default(0),
})

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull(),
  contentType: contentTypeEnum('content_type').default('video').notNull(),
  videoUrl: text('video_url'),
  body: text('body'),
  durationMinutes: integer('duration_minutes'),
  primarySkillId: uuid('primary_skill_id'),
  skillDimension: skillDimensionEnum('skill_dimension'),
})

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  programId: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  status: enrollmentStatusEnum('status').default('pending').notNull(),
  goal: text('goal'),
  assessmentIntervalDays: integer('assessment_interval_days').default(30),
  nextAssessmentAt: timestamp('next_assessment_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  status: lessonStatusEnum('status').default('locked').notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => [
  unique().on(table.enrollmentId, table.lessonId),
])

// ─── Skills ───────────────────────────────────────────────────────────────────

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
})

export const assessmentQuestions = pgTable('assessment_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  dimension: skillDimensionEnum('dimension').notNull(),
  questionText: text('question_text').notNull(),
  answerType: answerTypeEnum('answer_type').default('scale_1_5').notNull(),
  weight: real('weight').default(1.0),
})

// ─── Assessments ──────────────────────────────────────────────────────────────

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  type: assessmentTypeEnum('type').notNull(),
  status: assessmentStatusEnum('status').default('pending').notNull(),
  dueAt: timestamp('due_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const assessmentAnswers = pgTable('assessment_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => assessmentQuestions.id, { onDelete: 'cascade' }),
  answerValue: text('answer_value').notNull(),
  scoreRaw: real('score_raw'),
})

// ─── Skill Scores (append-only!) ──────────────────────────────────────────────

export const skillScores = pgTable('skill_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  wissen: real('wissen').notNull(),
  koennen: real('koennen').notNull(),
  machen: real('machen').notNull(),
  overall: real('overall').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const skillRecommendations = pgTable('skill_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  contentType: text('content_type'),
  contentId: uuid('content_id'),
  reason: recommendationReasonEnum('reason').notNull(),
  status: recommendationStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── HVCO Resources ───────────────────────────────────────────────────────────

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

export const emailTemplateTypeEnum = pgEnum('email_template_type', [
  'doi_confirmation',   // Double Opt-In Bestätigung
  'doi_welcome',        // Welcome nach DOI-Bestätigung
  'sequence_step',      // Für Email-Sequenz-Schritte
  'transactional',      // Einzelne Transaktions-Mails
])

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

export const landingPageStatusEnum = pgEnum('landing_page_status', ['draft', 'published', 'archived'])

export const landingPageSectionTypeEnum = pgEnum('landing_page_section_type', [
  'hero',           // Headline + Subtext + CTA / Email-Form
  'video',          // VSL oder Erklär-Video
  'social_proof',   // Logos, Zahlen, "Wie bekannt aus"
  'problem',        // Problem-Agitation
  'solution',       // Lösung / Was du bekommst
  'features',       // Feature-Liste mit Icons
  'how_it_works',   // Schritt-für-Schritt
  'testimonials',   // Kunden-Stimmen
  'offer',          // Angebot / Preis-Box
  'faq',            // FAQ Accordion
  'email_capture',  // Standalone Email-Formular / Lead-Magnet
  'cta',            // Finaler Call-to-Action
  'coach_bio',      // Coach-Vorstellung
  'spacer',         // Abstandhalter
])

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
  // Inhalt ist typ-abhängiges JSON, z.B.:
  // hero: { headline, subheadline, ctaLabel, ctaHref, backgroundImage, showEmailForm }
  // video: { embedUrl, posterUrl, headline }
  // features: { headline, items: [{icon, title, text}] }
  // testimonials: { items: [{name, role, text, avatar, rating}] }
  // faq: { headline, items: [{question, answer}] }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Email Sequenzen ──────────────────────────────────────────────────────────

export const emailSequenceTriggerEnum = pgEnum('email_sequence_trigger', [
  'newsletter_signup',       // Nach Newsletter-Anmeldung
  'doi_confirmed',           // Nach DOI-Bestätigung
  'landing_page_signup',     // Nach Landing-Page-Formular
  'program_enrollment',      // Nach Programm-Buchung
  'manual',                  // Manuell ausgelöst
])

export const emailSequences = pgTable('email_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  trigger: emailSequenceTriggerEnum('trigger').notNull(),
  triggerFilter: json('trigger_filter').$type<Record<string, unknown>>().default({}),
  // z.B. { source: 'salesmade' } — nur für SalesMade-Signups
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

// ─── Page Views (Cookie-Consent gated) ────────────────────────────────────────
// Wird NUR befüllt wenn der Nutzer "Analyse"-Cookies akzeptiert hat.
export const pageViews = pgTable('page_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  path: text('path').notNull(),                  // z.B. /salesmade, /blog/post-x
  locale: text('locale').default('de').notNull(),
  sessionHash: text('session_hash'),             // anonymer 1st-party Session-Hash (kein User-ID)
  referrerHost: text('referrer_host'),           // nur Host, kein Querystring (DSGVO)
  uaClass: text('ua_class'),                     // 'desktop' | 'mobile' | 'tablet' | 'bot'
  country: text('country'),                      // ISO-Code aus Cloudflare/Vercel-Header (falls verfügbar)
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Site Events (Audit-Trail für "Gesamt-Briefing") ──────────────────────────
// Generischer Event-Log: subscriber.confirmed, sequence.sent, content.published, ...
export const siteEvents = pgTable('site_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: text('category').notNull(),          // 'subscriber' | 'sequence' | 'content' | 'offer' | 'system'
  eventType: text('event_type').notNull(),       // 'created' | 'updated' | 'sent' | 'confirmed' | 'published' ...
  title: text('title').notNull(),                // "Neuer Subscriber" / "Email versendet" / "Framework geupdated"
  summary: text('summary'),                      // freie Zusammenfassung für das Briefing
  refType: text('ref_type'),                     // 'newsletter_subscriber' | 'email_sequence' | 'landing_page'
  refId: uuid('ref_id'),
  actorId: uuid('actor_id'),                     // Wer hat es ausgelöst (User-ID), null wenn System
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
