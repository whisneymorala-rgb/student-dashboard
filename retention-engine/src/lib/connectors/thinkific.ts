import type { RawStudentRecord } from "../types";
import { ConnectorConfigError, type CourseConnector } from "./types";

/**
 * Thinkific's public Admin API (developers.thinkific.com). Same caveat as
 * teachable.ts: field names below are our best-effort mapping, not verified
 * against a live response in this session. If the sync errors or the shape
 * looks off, paste one real enrollment JSON object to Claude and ask it to
 * fix the mapping — that's a two-minute fix, not a rebuild.
 */

interface ThinkificEnrollment {
  id: number;
  course_name?: string;
  user_name?: string;
  user_email?: string;
  percentage_completed?: number;
  started_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

interface ThinkificEnrollmentsResponse {
  items: ThinkificEnrollment[];
  meta: { pagination: { current_page: number; total_pages: number } };
}

async function fetchStudents(
  config: Record<string, string>
): Promise<RawStudentRecord[]> {
  const apiKey = config.apiKey;
  const subdomain = config.subdomain;
  if (!apiKey || !subdomain) {
    throw new ConnectorConfigError(
      "Thinkific API key and subdomain are both required."
    );
  }

  const records: RawStudentRecord[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetch(
      `https://api.thinkific.com/api/public/v1/enrollments?page=${page}&limit=100`,
      {
        headers: {
          "X-Auth-API-Key": apiKey,
          "X-Auth-Subdomain": subdomain,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Thinkific API error (${res.status}): ${body}`);
    }
    const data = (await res.json()) as ThinkificEnrollmentsResponse;
    for (const enrollment of data.items ?? []) {
      if (!enrollment.user_email) continue;
      records.push({
        student_name: enrollment.user_name ?? enrollment.user_email,
        email: enrollment.user_email,
        course_name: enrollment.course_name ?? "Untitled course",
        enrollment_date: enrollment.started_at ?? new Date().toISOString(),
        percent_complete: enrollment.percentage_completed,
        last_activity_date: enrollment.updated_at ?? enrollment.started_at,
      });
    }
    totalPages = data.meta?.pagination?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return records;
}

export const thinkificConnector: CourseConnector = {
  id: "thinkific",
  label: "Thinkific",
  supportsFullData: true,
  configFields: [
    { key: "apiKey", label: "Thinkific API key", secret: true },
    { key: "subdomain", label: "Thinkific subdomain (e.g. yourschool)" },
  ],
  fetchStudents,
};
