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
