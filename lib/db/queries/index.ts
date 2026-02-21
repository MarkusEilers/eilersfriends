import { db } from "@/lib/db";
import {
  contacts,
  companies,
  enrollments,
  stepCompletions,
  workbookSubmissions,
  sparringSessions,
  sequences,
  sequenceEnrollments,
  frameworkDownloads,
  newsletterSubscribers,
  formSubmissions,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

// ============================================================
// CONTACTS
// ============================================================

export async function getContactById(id: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  return contact;
}

export async function getContactByEmail(email: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.email, email))
    .limit(1);
  return contact;
}

export async function getAllContacts() {
  return db
    .select()
    .from(contacts)
    .orderBy(desc(contacts.createdAt));
}

// ============================================================
// COMPANIES
// ============================================================

export async function getCompanyById(id: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  return company;
}

export async function getAllCompanies() {
  return db
    .select()
    .from(companies)
    .orderBy(desc(companies.createdAt));
}

// ============================================================
// ENROLLMENTS
// ============================================================

export async function getEnrollmentsByContact(contactId: string) {
  return db
    .select()
    .from(enrollments)
    .where(eq(enrollments.contactId, contactId))
    .orderBy(desc(enrollments.createdAt));
}

export async function getEnrollmentWithProgress(enrollmentId: string) {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) return null;

  const completions = await db
    .select()
    .from(stepCompletions)
    .where(eq(stepCompletions.enrollmentId, enrollmentId));

  return { ...enrollment, stepCompletions: completions };
}

// ============================================================
// STEP COMPLETIONS
// ============================================================

export async function getStepCompletion(
  enrollmentId: string,
  stepId: string
) {
  const [completion] = await db
    .select()
    .from(stepCompletions)
    .where(
      and(
        eq(stepCompletions.enrollmentId, enrollmentId),
        eq(stepCompletions.stepId, stepId)
      )
    )
    .limit(1);
  return completion;
}

// ============================================================
// WORKBOOK SUBMISSIONS
// ============================================================

export async function getPendingReviews() {
  return db
    .select()
    .from(workbookSubmissions)
    .where(eq(workbookSubmissions.reviewStatus, "pending"))
    .orderBy(desc(workbookSubmissions.submittedAt));
}

// ============================================================
// SPARRING SESSIONS
// ============================================================

export async function getUpcomingSparrings() {
  return db
    .select()
    .from(sparringSessions)
    .where(eq(sparringSessions.status, "booked"))
    .orderBy(sparringSessions.scheduledAt);
}

// ============================================================
// ADMIN STATS
// ============================================================

export async function getAdminStats() {
  const [activeEnrollmentsCount] = await db
    .select({ count: count() })
    .from(enrollments)
    .where(eq(enrollments.status, "active"));

  const [pendingReviewsCount] = await db
    .select({ count: count() })
    .from(workbookSubmissions)
    .where(eq(workbookSubmissions.reviewStatus, "pending"));

  const [upcomingSparringsCount] = await db
    .select({ count: count() })
    .from(sparringSessions)
    .where(eq(sparringSessions.status, "booked"));

  const [totalContactsCount] = await db
    .select({ count: count() })
    .from(contacts);

  return {
    activeEnrollments: activeEnrollmentsCount?.count ?? 0,
    pendingReviews: pendingReviewsCount?.count ?? 0,
    upcomingSparrings: upcomingSparringsCount?.count ?? 0,
    totalContacts: totalContactsCount?.count ?? 0,
  };
}
