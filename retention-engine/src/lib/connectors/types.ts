import type { RawStudentRecord } from "../types";

/**
 * Every course platform connector normalizes its export into this shape,
 * matching Doc 3's Students fields. Doc 3's own text ("the client's course
 * platform exports student data one of two ways") never names a specific
 * platform, so the app is built against this adapter interface — add a new
 * platform by implementing one function, not by rewiring the Scanner.
 */
export interface CourseConnector {
  id: "teachable" | "thinkific" | "csv" | "manual";
  label: string;
  /** True if this connector can supply percent_complete + last_activity_date (Doc 3 "FULL" tier). */
  supportsFullData: boolean;
  /** Field names this connector needs in platform_config, shown in the settings form. */
  configFields: { key: string; label: string; secret?: boolean }[];
  fetchStudents(config: Record<string, string>): Promise<RawStudentRecord[]>;
}

export class ConnectorConfigError extends Error {}
