import {
  createDraft,
  hasRecentEmailOfType,
  listScannableStudents,
} from "./airtable";
import { draftEmail } from "./claude";
import { computeDropoutBand, daysBetween } from "./status";
import type { Client, EmailType, Student } from "./types";

interface RouteDefinition {
  order: number;
  type: EmailType;
  requiresFullData: boolean;
  matches: (student: Student) => boolean;
}

function daysSinceActivity(student: Student): number {
  const anchor = student.last_activity_date ?? student.enrollment_date;
  return daysBetween(new Date(), anchor);
}

function daysSinceEnrollment(student: Student): number {
  return daysBetween(new Date(), student.enrollment_date);
}

// Doc 3, Step 2c — same order, same conditions. Order matters: within one
// scan pass, a student is only ever routed to the first branch that matches
// (see runScan below), which is what makes "a student matching two routes at
// once" resolve to a single email, per the doc's own test matrix.
const ROUTES: RouteDefinition[] = [
  {
    order: 1,
    type: "onboarding",
    requiresFullData: false,
    matches: (s) => s.status === "onboarding",
  },
  {
    order: 2,
    type: "reactivation",
    requiresFullData: false,
    matches: (s) => s.status === "inactive",
  },
  {
    order: 3,
    type: "at_risk",
    requiresFullData: true,
    matches: (s) => {
      const d = daysSinceActivity(s);
      return s.engagement_trend === "slowing" && d >= 3 && d <= 6;
    },
  },
  {
    order: 4,
    type: "finish_line",
    requiresFullData: true,
    matches: (s) =>
      s.percent_complete != null &&
      s.percent_complete >= 90 &&
      s.percent_complete <= 99 &&
      daysSinceActivity(s) <= 3,
  },
  {
    order: 5,
    type: "early_momentum",
    requiresFullData: true,
    matches: (s) =>
      s.engagement_trend === "accelerating" && daysSinceEnrollment(s) <= 14,
  },
  {
    order: 6,
    type: "testimonial",
    requiresFullData: false,
    matches: (s) => s.percent_complete === 100 && !s.testimonial_sent,
  },
  {
    order: 7,
    type: "referral",
    requiresFullData: false,
    matches: (s) => Boolean(s.testimonial_sent) && Boolean(s.testimonial_positive),
  },
  {
    order: 8,
    type: "upsell",
    requiresFullData: false,
    matches: (s) =>
      s.percent_complete === 100 && (s.offer_ladder ?? "").trim().length > 0,
  },
];

export interface ScanResult {
  scanned: number;
  drafted: { studentEmail: string; type: EmailType }[];
  skippedByGuard: number;
  errors: string[];
}

/**
 * Doc 3, Step 2 + Step 3 combined: read the scannable list once, decide once
 * per student (Doc 1's "one scanner, not eight robots"), and never let a
 * student through two routes in the same pass. Every route re-checks the
 * anti-double-send guard immediately before drafting — the "sacred" rule
 * from Doc 1 — even though the base query already filtered for it, because
 * a student earlier in this same batch may have just been drafted for a
 * different type.
 */
export async function runScan(client: Client): Promise<ScanResult> {
  const students = await listScannableStudents(client.id);
  const result: ScanResult = {
    scanned: students.length,
    drafted: [],
    skippedByGuard: 0,
    errors: [],
  };

  const routes = ROUTES.filter(
    (r) => client.data_tier === "full" || !r.requiresFullData
  ).sort((a, b) => a.order - b.order);

  for (const student of students) {
    const route = routes.find((r) => r.matches(student));
    if (!route) continue;

    const guardOk = await passesDoubleSendGuard(client.id, student, route.type);
    if (!guardOk) {
      result.skippedByGuard += 1;
      continue;
    }

    try {
      const dropoutBand =
        route.type === "reactivation" ? computeDropoutBand(student.percent_complete) : null;

      const { subject, body } = await draftEmail({
        client,
        student,
        emailType: route.type,
        dropoutBand,
      });

      await createDraft({
        client_id: client.id,
        student_id: student.id,
        email_type: route.type,
        dropout_band: dropoutBand,
        subject,
        body,
      });

      result.drafted.push({ studentEmail: student.email, type: route.type });
    } catch (err) {
      result.errors.push(
        `${student.email} (${route.type}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

async function passesDoubleSendGuard(
  clientId: string,
  student: Student,
  type: EmailType
): Promise<boolean> {
  if (student.last_email_date) {
    const days = daysBetween(new Date(), student.last_email_date);
    if (days < 7) return false;
  }
  const sentThisTypeRecently = await hasRecentEmailOfType(clientId, student.id, type, 30);
  return !sentThisTypeRecently;
}
