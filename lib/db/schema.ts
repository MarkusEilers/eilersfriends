import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  boolean,
  jsonb,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const companyStatusEnum = pgEnum("company_status", [
  "lead",
  "customer",
  "alumni",
  "inactive",
]);

export const companySizeEnum = pgEnum("company_size", [
  "startup",
  "scaleup",
  "enterprise",
]);

export const contactStageEnum = pgEnum("contact_stage", [
  "lead",
  "qualified",
  "customer",
  "alumni",
]);

export const contactLanguageEnum = pgEnum("contact_language", [
  "de",
  "en",
  "ru",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "coach",
  "participant",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled",
  "active",
  "completed",
  "cancelled",
]);

export const stepTypeEnum = pgEnum("step_type", [
  "information",
  "exercise",
  "workbook",
  "sparring",
]);

export const stepCompletionStatusEnum = pgEnum("step_completion_status", [
  "locked",
  "available",
  "in_progress",
  "submitted",
  "completed",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "revision_requested",
]);

export const sparringStatusEnum = pgEnum("sparring_status", [
  "bookable",
  "booked",
  "completed",
  "cancelled",
  "no_show",
]);

export const sequenceChannelEnum = pgEnum("sequence_channel", [
  "email",
  "linkedin",
  "whatsapp",
  "multi_channel",
]);

export const sequenceStatusEnum = pgEnum("sequence_status", [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const sequenceStepTypeEnum = pgEnum("sequence_step_type", [
  "email",
  "linkedin_connect",
  "linkedin_message",
  "whatsapp",
  "wait",
  "condition",
  "task",
]);

export const sequenceEnrollmentStatusEnum = pgEnum(
  "sequence_enrollment_status",
  ["active", "paused", "completed", "replied", "bounced", "unsubscribed"]
);

export const sequenceExecutionStatusEnum = pgEnum(
  "sequence_execution_status",
  [
    "pending",
    "sent",
    "delivered",
    "opened",
    "clicked",
    "replied",
    "bounced",
    "failed",
  ]
);

// ============================================================
// CRM TABLES
// ============================================================

/**
 * Companies - Firmen/Kunden im Ökosystem
 */
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  status: companyStatusEnum("status").default("lead").notNull(),
  size: companySizeEnum("size"),
  industry: text("industry"),
  website: text("website"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Contacts - Personen, die an einer Company hängen
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    position: text("position"),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    stage: contactStageEnum("stage").default("lead").notNull(),
    language: contactLanguageEnum("language").default("de").notNull(),
    linkedinUrl: text("linkedin_url"),
    notes: text("notes"),
    tags: jsonb("tags").$type<string[]>().default([]),
    // Auth fields (for portal access)
    role: userRoleEnum("role").default("participant").notNull(),
    passwordHash: text("password_hash"),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("contacts_email_idx").on(table.email)]
);

// ============================================================
// LMS TABLES
// ============================================================

/**
 * Enrollments - Contact enrolled in a Program
 * programId references a Sanity document ID
 */
export const enrollments = pgTable("enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  contactId: uuid("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  programId: text("program_id").notNull(), // Sanity document ID
  status: enrollmentStatusEnum("status").default("enrolled").notNull(),
  progressPercent: integer("progress_percent").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * StepCompletions - Tracking which steps a participant has completed
 * stepId and phaseId reference Sanity document IDs
 */
export const stepCompletions = pgTable("step_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  enrollmentId: uuid("enrollment_id")
    .references(() => enrollments.id, { onDelete: "cascade" })
    .notNull(),
  phaseId: text("phase_id").notNull(), // Sanity document ID
  stepId: text("step_id").notNull(), // Sanity document ID
  stepType: stepTypeEnum("step_type").notNull(),
  status: stepCompletionStatusEnum("status").default("locked").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * WorkbookSubmissions - Uploaded workbooks for review
 */
export const workbookSubmissions = pgTable("workbook_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  stepCompletionId: uuid("step_completion_id")
    .references(() => stepCompletions.id, { onDelete: "cascade" })
    .notNull(),
  fileUrl: text("file_url").notNull(), // Vercel Blob URL
  fileKey: text("file_key").notNull(), // Vercel Blob key
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"), // bytes
  reviewStatus: reviewStatusEnum("review_status")
    .default("pending")
    .notNull(),
  reviewedBy: uuid("reviewed_by").references(() => contacts.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * SparringSessions - Booked coaching sessions
 */
export const sparringSessions = pgTable("sparring_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  stepCompletionId: uuid("step_completion_id")
    .references(() => stepCompletions.id, { onDelete: "cascade" })
    .notNull(),
  coachId: text("coach_id").notNull(), // Sanity document ID (Coach)
  status: sparringStatusEnum("status").default("bookable").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  meetingUrl: text("meeting_url"), // Calendly/Zoom link
  calendlyEventId: text("calendly_event_id"),
  coachNotes: text("coach_notes"),
  participantNotes: text("participant_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================
// SEQUENCE / OUTREACH TABLES
// ============================================================

/**
 * Sequences - Automated outreach campaigns
 */
export const sequences = pgTable("sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  channel: sequenceChannelEnum("channel").default("email").notNull(),
  status: sequenceStatusEnum("status").default("draft").notNull(),
  totalEnrolled: integer("total_enrolled").default(0).notNull(),
  totalReplied: integer("total_replied").default(0).notNull(),
  createdBy: uuid("created_by").references(() => contacts.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * SequenceSteps - Individual steps within a sequence
 */
export const sequenceSteps = pgTable("sequence_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  sequenceId: uuid("sequence_id")
    .references(() => sequences.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  stepType: sequenceStepTypeEnum("step_type").notNull(),
  // Content fields
  subject: text("subject"), // E-Mail subject
  body: text("body"), // Message body (supports {{placeholders}})
  // Wait step
  waitDays: integer("wait_days"),
  waitHours: integer("wait_hours"),
  // Condition step
  conditionType: text("condition_type"), // e.g., "opened", "clicked", "replied"
  conditionYesBranch: integer("condition_yes_branch"), // order of next step if true
  conditionNoBranch: integer("condition_no_branch"), // order of next step if false
  // Task step
  taskDescription: text("task_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * SequenceEnrollments - Contact enrolled in a sequence
 */
export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sequenceId: uuid("sequence_id")
    .references(() => sequences.id, { onDelete: "cascade" })
    .notNull(),
  contactId: uuid("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),
  status: sequenceEnrollmentStatusEnum("status").default("active").notNull(),
  currentStepId: uuid("current_step_id").references(() => sequenceSteps.id),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * SequenceStepExecutions - Execution log per contact per step
 */
export const sequenceStepExecutions = pgTable("sequence_step_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  enrollmentId: uuid("enrollment_id")
    .references(() => sequenceEnrollments.id, { onDelete: "cascade" })
    .notNull(),
  stepId: uuid("step_id")
    .references(() => sequenceSteps.id, { onDelete: "cascade" })
    .notNull(),
  contactId: uuid("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),
  status: sequenceExecutionStatusEnum("status").default("pending").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  bouncedAt: timestamp("bounced_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================
// MARKETING TABLES
// ============================================================

/**
 * FrameworkDownloads - Tracking downloads (lead capture)
 */
export const frameworkDownloads = pgTable("framework_downloads", {
  id: uuid("id").defaultRandom().primaryKey(),
  frameworkId: text("framework_id").notNull(), // Sanity document ID
  email: text("email").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  downloadedAt: timestamp("downloaded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * NewsletterSubscribers
 */
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    language: contactLanguageEnum("language").default("de").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("newsletter_email_idx").on(table.email)]
);

/**
 * FormSubmissions - Contact form entries
 */
export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * CookieConsents - DSGVO compliance tracking
 */
export const cookieConsents = pgTable("cookie_consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  ipAddress: text("ip_address").notNull(),
  accepted: boolean("accepted").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================
// RELATIONS
// ============================================================

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  enrollments: many(enrollments),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  enrollments: many(enrollments),
  sequenceEnrollments: many(sequenceEnrollments),
  frameworkDownloads: many(frameworkDownloads),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [enrollments.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [enrollments.companyId],
    references: [companies.id],
  }),
  stepCompletions: many(stepCompletions),
}));

export const stepCompletionsRelations = relations(
  stepCompletions,
  ({ one, many }) => ({
    enrollment: one(enrollments, {
      fields: [stepCompletions.enrollmentId],
      references: [enrollments.id],
    }),
    workbookSubmissions: many(workbookSubmissions),
    sparringSessions: many(sparringSessions),
  })
);

export const workbookSubmissionsRelations = relations(
  workbookSubmissions,
  ({ one }) => ({
    stepCompletion: one(stepCompletions, {
      fields: [workbookSubmissions.stepCompletionId],
      references: [stepCompletions.id],
    }),
    reviewer: one(contacts, {
      fields: [workbookSubmissions.reviewedBy],
      references: [contacts.id],
    }),
  })
);

export const sparringSessionsRelations = relations(
  sparringSessions,
  ({ one }) => ({
    stepCompletion: one(stepCompletions, {
      fields: [sparringSessions.stepCompletionId],
      references: [stepCompletions.id],
    }),
  })
);

export const sequencesRelations = relations(sequences, ({ many }) => ({
  steps: many(sequenceSteps),
  enrollments: many(sequenceEnrollments),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one }) => ({
  sequence: one(sequences, {
    fields: [sequenceSteps.sequenceId],
    references: [sequences.id],
  }),
}));

export const sequenceEnrollmentsRelations = relations(
  sequenceEnrollments,
  ({ one, many }) => ({
    sequence: one(sequences, {
      fields: [sequenceEnrollments.sequenceId],
      references: [sequences.id],
    }),
    contact: one(contacts, {
      fields: [sequenceEnrollments.contactId],
      references: [contacts.id],
    }),
    currentStep: one(sequenceSteps, {
      fields: [sequenceEnrollments.currentStepId],
      references: [sequenceSteps.id],
    }),
    executions: many(sequenceStepExecutions),
  })
);

export const sequenceStepExecutionsRelations = relations(
  sequenceStepExecutions,
  ({ one }) => ({
    enrollment: one(sequenceEnrollments, {
      fields: [sequenceStepExecutions.enrollmentId],
      references: [sequenceEnrollments.id],
    }),
    step: one(sequenceSteps, {
      fields: [sequenceStepExecutions.stepId],
      references: [sequenceSteps.id],
    }),
    contact: one(contacts, {
      fields: [sequenceStepExecutions.contactId],
      references: [contacts.id],
    }),
  })
);

export const frameworkDownloadsRelations = relations(
  frameworkDownloads,
  ({ one }) => ({
    contact: one(contacts, {
      fields: [frameworkDownloads.contactId],
      references: [contacts.id],
    }),
  })
);
