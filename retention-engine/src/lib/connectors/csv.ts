import Papa from "papaparse";
import { sanitizeText } from "../sanitize";
import type { RawStudentRecord } from "../types";
import { ConnectorConfigError, type CourseConnector } from "./types";

/**
 * The universal fallback: any course platform can export a CSV, even ones
 * with no API at all (Kajabi, Podia, LearnDash, a spreadsheet someone
 * maintains by hand). This is what makes the app usable with "any platform"
 * on day one — column mapping is configurable per client since every export
 * names its columns differently.
 */
export interface CsvColumnMapping {
  nameColumn: string;
  emailColumn: string;
  courseColumn: string;
  enrollmentDateColumn: string;
  percentCompleteColumn?: string;
  lastActivityColumn?: string;
}

function findColumn(headers: string[], wanted: string): string | undefined {
  const normalized = wanted.trim().toLowerCase();
  return headers.find((h) => h.trim().toLowerCase() === normalized);
}

export function guessColumnMapping(headers: string[]): Partial<CsvColumnMapping> {
  const guess = (candidates: string[]) => {
    for (const c of candidates) {
      const found = findColumn(headers, c);
      if (found) return found;
    }
    return undefined;
  };
  return {
    nameColumn: guess(["name", "student_name", "student name", "full name"]),
    emailColumn: guess(["email", "student_email", "email address"]),
    courseColumn: guess(["course", "course_name", "course name", "product"]),
    enrollmentDateColumn: guess([
      "enrollment_date",
      "enrolled_at",
      "enrolled",
      "signup date",
      "created at",
    ]),
    percentCompleteColumn: guess([
      "percent_complete",
      "progress",
      "% complete",
      "completion",
      "percentage_completed",
    ]),
    lastActivityColumn: guess([
      "last_activity_date",
      "last_activity",
      "last active",
      "updated_at",
      "last login",
    ]),
  } as Partial<CsvColumnMapping>;
}

/** Doc 2, "Problem 1": clean curly quotes / em-dashes / hidden breaks before anything else touches this text. */
export function parseCsv(
  csvText: string,
  mapping: CsvColumnMapping
): RawStudentRecord[] {
  const cleaned = sanitizeText(csvText);
  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    throw new Error(
      `CSV parse error on row ${parsed.errors[0].row}: ${parsed.errors[0].message}`
    );
  }

  const records: RawStudentRecord[] = [];
  for (const row of parsed.data) {
    const email = row[mapping.emailColumn]?.trim();
    if (!email) continue; // Doc 3 test matrix: blank email -> skip the row, don't crash.

    const percentRaw = mapping.percentCompleteColumn
      ? row[mapping.percentCompleteColumn]
      : undefined;
    const percent = percentRaw ? Number(percentRaw.replace("%", "").trim()) : undefined;

    records.push({
      student_name: sanitizeText(row[mapping.nameColumn]) || email,
      email: email.toLowerCase(),
      course_name: sanitizeText(row[mapping.courseColumn]) || "Untitled course",
      enrollment_date:
        row[mapping.enrollmentDateColumn] || new Date().toISOString(),
      percent_complete: Number.isFinite(percent) ? percent : undefined,
      last_activity_date: mapping.lastActivityColumn
        ? row[mapping.lastActivityColumn]
        : undefined,
    });
  }
  return records;
}

export const csvConnector: CourseConnector = {
  id: "csv",
  label: "CSV upload (any platform)",
  supportsFullData: true, // depends on which columns are mapped; see status.ts
  configFields: [
    { key: "nameColumn", label: "Name column" },
    { key: "emailColumn", label: "Email column" },
    { key: "courseColumn", label: "Course column" },
    { key: "enrollmentDateColumn", label: "Enrollment date column" },
    { key: "percentCompleteColumn", label: "% complete column (optional)" },
    { key: "lastActivityColumn", label: "Last activity date column (optional)" },
  ],
  async fetchStudents() {
    throw new ConnectorConfigError(
      "CSV is a push connector — upload a file via /api/clients/[id]/students/import instead of syncing."
    );
  },
};
