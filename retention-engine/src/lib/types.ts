// Shared types for the Retention Engine.
// Field names intentionally mirror Doc 3's Airtable schema (Students / Clients tables)
// so the data model matches "the documents" exactly.

export type DataTier = "full" | "coarse";

export type StudentStatus =
  | "onboarding"
  | "active"
  | "at-risk"
  | "inactive"
  | "completed";

export type EngagementTrend = "accelerating" | "steady" | "slowing";

// The nine email types from Doc 1. "reactivation" fires once but is tone-matched
// to the dropout band (early/mid/late) at send time.
export type EmailType =
  | "onboarding"
  | "early_momentum"
  | "at_risk"
  | "reactivation"
  | "finish_line"
  | "testimonial"
  | "referral"
  | "upsell";

export type DropoutBand = "early" | "mid" | "late";

export interface Client {
  id: string;
  client_name: string;
  creator_voice_notes: string;
  sales_page_url: string;
  offer_ladder: string;
  data_tier: DataTier;
  /** Which course platform connector to pull students from. */
  platform: "teachable" | "thinkific" | "csv" | "manual";
  /** Connector-specific config (API key, subdomain, etc). Never rendered to the client bundle. */
  platform_config?: Record<string, string>;
  /** If false, drafts require manual approval before sending (the safe default). */
  auto_send: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  client_id: string;
  student_name: string;
  email: string;
  course_name: string;
  enrollment_date: string; // ISO date
  status: StudentStatus;
  percent_complete: number | null; // FULL-data only
  last_activity_date: string | null; // FULL-data only, ISO date
  engagement_trend: EngagementTrend | null; // FULL-data only
  last_email_type: EmailType | null;
  last_email_date: string | null; // ISO date — powers the double-send guard
  offer_ladder: string;
  flagged_reactivation?: boolean;
  testimonial_sent?: boolean;
  testimonial_positive?: boolean;
}

export interface RawStudentRecord {
  student_name: string;
  email: string;
  course_name: string;
  enrollment_date: string;
  percent_complete?: number;
  last_activity_date?: string;
}

export interface EmailDraft {
  id: string;
  client_id: string;
  student_id: string;
  email_type: EmailType;
  dropout_band: DropoutBand | null;
  subject: string;
  body: string;
  status: "pending_review" | "approved" | "sent" | "discarded";
  created_at: string;
  sent_at: string | null;
}
