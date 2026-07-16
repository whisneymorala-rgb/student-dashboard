import type { RawStudentRecord } from "../types";
import { ConnectorConfigError, type CourseConnector } from "./types";

/**
 * Teachable's public API (developers.teachable.com/v1). This build session
 * couldn't reach Teachable's live docs to double-check field names (blocked
 * by their bot protection), so the shape below is our best-effort mapping of
 * their documented "list students" response. Doc 2's own warning applies
 * here in the most literal way possible: if a sync fails or comes back
 * empty, paste the actual JSON Teachable returns to Claude and it'll fix
 * this file in one pass — don't assume the mapping below is gospel.
 */

interface TeachableCourseEnrollment {
  name?: string;
  id: number;
  percent_complete?: number;
  enrolled_at?: string;
  completed_at?: string | null;
}

interface TeachableStudent {
  name: string;
  email: string;
  id: number;
  courses?: TeachableCourseEnrollment[];
}

interface TeachableStudentsResponse {
  students: TeachableStudent[];
  meta: { page: number; number_of_pages: number };
}

async function fetchStudents(
  config: Record<string, string>
): Promise<RawStudentRecord[]> {
  const apiKey = config.apiKey;
  if (!apiKey) throw new ConnectorConfigError("Teachable API key is required.");

  const records: RawStudentRecord[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetch(
      `https://developers.teachable.com/v1/students?page=${page}`,
      { headers: { apiKey }, cache: "no-store" }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Teachable API error (${res.status}): ${body}`);
    }
    const data = (await res.json()) as TeachableStudentsResponse;
    for (const student of data.students ?? []) {
      for (const course of student.courses ?? []) {
        records.push({
          student_name: student.name,
          email: student.email,
          course_name: course.name ?? "Untitled course",
          enrollment_date: course.enrolled_at ?? new Date().toISOString(),
          percent_complete: course.percent_complete,
          // Teachable's public API doesn't expose a granular last-activity
          // timestamp. We fall back to enrolled_at; the status computation
          // in lib/status.ts treats this as a soft signal, not a hard one.
          last_activity_date: course.completed_at ?? course.enrolled_at,
        });
      }
    }
    totalPages = data.meta?.number_of_pages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return records;
}

export const teachableConnector: CourseConnector = {
  id: "teachable",
  label: "Teachable",
  supportsFullData: true,
  configFields: [{ key: "apiKey", label: "Teachable API key", secret: true }],
  fetchStudents,
};
