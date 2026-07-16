import {
  createStudent,
  getStudentByEmail,
  updateStudent,
} from "./airtable";
import { getConnector } from "./connectors/registry";
import { sanitizeRecord } from "./sanitize";
import { computeEngagementTrend, computeStatus, daysBetween } from "./status";
import type { Client, RawStudentRecord } from "./types";

export interface SyncResult {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Doc 3, Step 2b-adjacent: pull the latest export from the client's course
 * platform and upsert into the Students table, keyed by email (the doc's
 * "unique key — one row per email"). Also computes status + trend so the
 * Scanner always reads values that are already correct, per Step 3b.
 */
export async function syncClientStudents(client: Client): Promise<SyncResult> {
  const result: SyncResult = { fetched: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  if (client.platform === "csv" || client.platform === "manual") {
    // CSV is push-based (uploaded directly); manual has nothing to pull.
    return result;
  }

  const connector = getConnector(client.platform);
  const raw = await connector.fetchStudents(client.platform_config ?? {});
  result.fetched = raw.length;

  for (const record of raw) {
    try {
      await upsertStudent(client, record);
      result.updated += 1;
    } catch (err) {
      result.errors.push(
        `${record.email}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

export async function upsertStudent(
  client: Client,
  rawRecord: RawStudentRecord
): Promise<void> {
  const record = sanitizeRecord(rawRecord);
  if (!record.email) return; // Doc 3 test matrix: blank email -> skip, don't crash.

  const existing = await getStudentByEmail(client.id, record.email);
  const now = new Date();
  const lastActivityDate = record.last_activity_date ?? null;
  const percentComplete =
    record.percent_complete === undefined ? null : record.percent_complete;

  const daysSinceActivity = lastActivityDate
    ? daysBetween(now, lastActivityDate)
    : daysBetween(now, record.enrollment_date);

  const trend = computeEngagementTrend({
    previousPercentComplete: existing?.percent_complete ?? null,
    percentComplete,
    daysSinceActivity,
  });

  const status = computeStatus({
    enrollmentDate: existing?.enrollment_date ?? record.enrollment_date,
    percentComplete,
    lastActivityDate,
    dataTier: client.data_tier,
  });

  if (existing) {
    await updateStudent(existing.id, {
      student_name: record.student_name,
      course_name: record.course_name,
      percent_complete: percentComplete ?? undefined,
      last_activity_date: lastActivityDate ?? undefined,
      engagement_trend: trend ?? undefined,
      status,
      offer_ladder: client.offer_ladder,
    });
  } else {
    await createStudent({
      client_id: client.id,
      student_name: record.student_name,
      email: record.email,
      course_name: record.course_name,
      enrollment_date: record.enrollment_date,
      percent_complete: percentComplete ?? undefined,
      last_activity_date: lastActivityDate ?? undefined,
      engagement_trend: trend ?? undefined,
      status,
      offer_ladder: client.offer_ladder,
    });
  }
}
