import type { DataTier, DropoutBand, EngagementTrend, StudentStatus } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(a: Date | string, b: Date | string): number {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.floor(Math.abs(t1 - t2) / DAY_MS);
}

/**
 * Doc 3, Step 3b: "who sets status and when." The doc says compute status
 * during/after import from the dates so the Scanner always reads a status
 * that's already correct, and flags a couple of the exact thresholds as a
 * "confirm with Morgan" item. There's no Morgan in this build — these are
 * the defaults, kept consistent with the doc's own locked settings
 * (onboarding window, 7-day silence = inactive). Adjust the constants below
 * if a client's course rhythm genuinely runs faster or slower.
 */
export function computeStatus(input: {
  enrollmentDate: string;
  percentComplete: number | null;
  lastActivityDate: string | null;
  dataTier: DataTier;
}): StudentStatus {
  const now = new Date();
  const daysSinceEnrollment = daysBetween(now, input.enrollmentDate);
  const daysSinceActivity = input.lastActivityDate
    ? daysBetween(now, input.lastActivityDate)
    : daysSinceEnrollment;

  if (input.percentComplete != null && input.percentComplete >= 100) {
    return "completed";
  }
  // Doc 3 locked setting: treat the row as "new" for 2 days.
  if (daysSinceEnrollment < 2) {
    return "onboarding";
  }
  // Doc 3 locked setting: 7+ days silent = inactive, the reactivation trigger.
  if (daysSinceActivity >= 7) {
    return "inactive";
  }
  if (input.dataTier === "full" && daysSinceActivity >= 3) {
    return "at-risk";
  }
  return "active";
}

/**
 * FULL-tier only. Compares this sync's percent_complete against the
 * previous value on record to classify momentum. No previous value (first
 * sync) reads as "steady" rather than guessing.
 */
export function computeEngagementTrend(input: {
  previousPercentComplete: number | null;
  percentComplete: number | null;
  daysSinceActivity: number;
}): EngagementTrend | null {
  if (input.percentComplete == null) return null;
  if (
    input.previousPercentComplete != null &&
    input.percentComplete > input.previousPercentComplete + 5
  ) {
    return "accelerating";
  }
  if (input.daysSinceActivity <= 2) return "steady";
  return "slowing";
}

/** Doc 1's dropout bands, used to tone-match the reactivation email. */
export function computeDropoutBand(percentComplete: number | null): DropoutBand | null {
  if (percentComplete == null) return null;
  if (percentComplete <= 25) return "early";
  if (percentComplete <= 60) return "mid";
  return "late"; // 61-99; 100 never reaches this path (status = completed)
}
