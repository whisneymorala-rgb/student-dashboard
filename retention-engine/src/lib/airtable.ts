import { env } from "./env";
import type {
  Client,
  DataTier,
  DropoutBand,
  EmailDraft,
  EmailType,
  EngagementTrend,
  Student,
  StudentStatus,
} from "./types";

// Table + field names match Doc 3, Step 1 exactly. Table B ("Clients") adds one
// field beyond the doc's spec — `client_id` on Students — a plain text foreign key
// (the Clients record ID) so one base can hold more than one client's students,
// per Doc 1's "repeatable system, not one working scenario" goal. Table C
// ("Drafts") is a further addition, holding AI-written emails for review before
// they send — see SETUP.md. Everything else is as specified.
const STUDENTS_TABLE = "Students";
const CLIENTS_TABLE = "Clients";
const DRAFTS_TABLE = "Drafts";

const AIRTABLE_API = "https://api.airtable.com/v0";

interface AirtableRecord<F> {
  id: string;
  fields: F;
  createdTime: string;
}

interface AirtableListResponse<F> {
  records: AirtableRecord<F>[];
  offset?: string;
}

async function airtableRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${AIRTABLE_API}/${env.airtableBaseId}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.airtableToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable request failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

async function listAll<F>(
  table: string,
  filterByFormula?: string
): Promise<AirtableRecord<F>[]> {
  const records: AirtableRecord<F>[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    if (filterByFormula) params.set("filterByFormula", filterByFormula);
    if (offset) params.set("offset", offset);
    params.set("pageSize", "100");
    const page = await airtableRequest<AirtableListResponse<F>>(
      `${encodeURIComponent(table)}?${params.toString()}`
    );
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

// ---- Students ----------------------------------------------------------

interface StudentFields {
  student_name: string;
  email: string;
  course_name: string;
  enrollment_date: string;
  status: StudentStatus;
  percent_complete?: number;
  last_activity_date?: string;
  engagement_trend?: EngagementTrend;
  last_email_type?: EmailType;
  last_email_date?: string;
  offer_ladder?: string;
  client_id: string;
  flagged_reactivation?: boolean;
  testimonial_sent?: boolean;
  testimonial_positive?: boolean;
}

function fromStudentRecord(record: AirtableRecord<StudentFields>): Student {
  const f = record.fields;
  return {
    id: record.id,
    client_id: f.client_id,
    student_name: f.student_name,
    email: f.email,
    course_name: f.course_name,
    enrollment_date: f.enrollment_date,
    status: f.status,
    percent_complete: f.percent_complete ?? null,
    last_activity_date: f.last_activity_date ?? null,
    engagement_trend: f.engagement_trend ?? null,
    last_email_type: f.last_email_type ?? null,
    last_email_date: f.last_email_date ?? null,
    offer_ladder: f.offer_ladder ?? "",
    flagged_reactivation: f.flagged_reactivation ?? false,
    testimonial_sent: f.testimonial_sent ?? false,
    testimonial_positive: f.testimonial_positive ?? false,
  };
}

export async function listStudents(
  clientId: string,
  extraFormula?: string
): Promise<Student[]> {
  const clauses = [`{client_id} = '${clientId}'`];
  if (extraFormula) clauses.push(extraFormula);
  const formula = `AND(${clauses.join(", ")})`;
  const records = await listAll<StudentFields>(STUDENTS_TABLE, formula);
  return records.map(fromStudentRecord);
}

/**
 * Doc 3, Step 2b's filter as written is `{status} != 'completed'` AND the
 * 7-day guard. But three of the doc's own routes — Testimonial, Referral,
 * Upsell — only fire for 100%-complete students, who Step 3b's own status
 * logic marks `completed`. Taken literally, the base query would exclude
 * every student those three routes are meant to catch. That's the kind of
 * gap Doc 1 says to resolve by asking "does this protect the student from
 * spam and keep the system correct?" — dropping the completed exclusion
 * here (and letting each route's own condition decide who it wants) does
 * both: the guard below still caps every email type, including those three,
 * at one per 7 days.
 */
export async function listScannableStudents(clientId: string): Promise<Student[]> {
  const formula = `OR(
    {last_email_date} = BLANK(),
    DATETIME_DIFF(NOW(), {last_email_date}, 'days') >= 7
  )`;
  return listStudents(clientId, formula);
}

export async function getStudentById(id: string): Promise<Student | null> {
  try {
    const record = await airtableRequest<AirtableRecord<StudentFields>>(
      `${STUDENTS_TABLE}/${id}`
    );
    return fromStudentRecord(record);
  } catch {
    return null;
  }
}

export async function getStudentByEmail(
  clientId: string,
  email: string
): Promise<Student | null> {
  const formula = `AND({client_id} = '${clientId}', LOWER({email}) = LOWER('${email.replace(/'/g, "\\'")}'))`;
  const records = await listAll<StudentFields>(STUDENTS_TABLE, formula);
  return records[0] ? fromStudentRecord(records[0]) : null;
}

export async function createStudent(
  fields: Omit<StudentFields, never>
): Promise<Student> {
  const res = await airtableRequest<AirtableListResponse<StudentFields>>(
    STUDENTS_TABLE,
    {
      method: "POST",
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );
  return fromStudentRecord(res.records[0]);
}

export async function updateStudent(
  recordId: string,
  fields: Partial<StudentFields>
): Promise<Student> {
  const res = await airtableRequest<AirtableListResponse<StudentFields>>(
    STUDENTS_TABLE,
    {
      method: "PATCH",
      body: JSON.stringify({ records: [{ id: recordId, fields }] }),
    }
  );
  return fromStudentRecord(res.records[0]);
}

/** Every send path funnels through here — it's what makes the guard hold on the next scan. */
export async function recordEmailSent(
  recordId: string,
  emailType: EmailType,
  opts?: { advanceStatus?: StudentStatus }
): Promise<Student> {
  return updateStudent(recordId, {
    last_email_type: emailType,
    last_email_date: new Date().toISOString(),
    ...(opts?.advanceStatus ? { status: opts.advanceStatus } : {}),
  });
}

// ---- Clients -------------------------------------------------------------

interface ClientFields {
  client_name: string;
  creator_voice_notes?: string;
  sales_page_url?: string;
  offer_ladder?: string;
  data_tier: DataTier;
  platform?: string;
  platform_config?: string; // JSON-encoded
  auto_send?: boolean;
}

function fromClientRecord(record: AirtableRecord<ClientFields>): Client {
  const f = record.fields;
  let platformConfig: Record<string, string> | undefined;
  try {
    platformConfig = f.platform_config ? JSON.parse(f.platform_config) : undefined;
  } catch {
    platformConfig = undefined;
  }
  return {
    id: record.id,
    client_name: f.client_name,
    creator_voice_notes: f.creator_voice_notes ?? "",
    sales_page_url: f.sales_page_url ?? "",
    offer_ladder: f.offer_ladder ?? "",
    data_tier: f.data_tier ?? "coarse",
    platform: (f.platform as Client["platform"]) ?? "manual",
    platform_config: platformConfig,
    auto_send: f.auto_send ?? false,
    created_at: record.createdTime,
  };
}

export async function listClients(): Promise<Client[]> {
  const records = await listAll<ClientFields>(CLIENTS_TABLE);
  return records.map(fromClientRecord);
}

export async function getClient(id: string): Promise<Client | null> {
  try {
    const record = await airtableRequest<AirtableRecord<ClientFields>>(
      `${CLIENTS_TABLE}/${id}`
    );
    return fromClientRecord(record);
  } catch {
    return null;
  }
}

export async function createClient(input: {
  client_name: string;
  creator_voice_notes?: string;
  sales_page_url?: string;
  offer_ladder?: string;
  data_tier: DataTier;
  platform?: Client["platform"];
  platform_config?: Record<string, string>;
  auto_send?: boolean;
}): Promise<Client> {
  const fields: ClientFields = {
    client_name: input.client_name,
    creator_voice_notes: input.creator_voice_notes,
    sales_page_url: input.sales_page_url,
    offer_ladder: input.offer_ladder,
    data_tier: input.data_tier,
    platform: input.platform ?? "manual",
    platform_config: input.platform_config
      ? JSON.stringify(input.platform_config)
      : undefined,
    auto_send: input.auto_send ?? false,
  };
  const res = await airtableRequest<AirtableListResponse<ClientFields>>(
    CLIENTS_TABLE,
    { method: "POST", body: JSON.stringify({ records: [{ fields }] }) }
  );
  return fromClientRecord(res.records[0]);
}

export async function updateClient(
  id: string,
  input: Partial<{
    client_name: string;
    creator_voice_notes: string;
    sales_page_url: string;
    offer_ladder: string;
    data_tier: DataTier;
    platform: Client["platform"];
    platform_config: Record<string, string>;
    auto_send: boolean;
  }>
): Promise<Client> {
  const fields: Partial<ClientFields> = { ...input, platform_config: undefined };
  if (input.platform_config) {
    fields.platform_config = JSON.stringify(input.platform_config);
  }
  const res = await airtableRequest<AirtableListResponse<ClientFields>>(
    CLIENTS_TABLE,
    {
      method: "PATCH",
      body: JSON.stringify({ records: [{ id, fields }] }),
    }
  );
  return fromClientRecord(res.records[0]);
}

// ---- Drafts (addition beyond Doc 3 — the hold-for-review queue) ----------

interface DraftFields {
  client_id: string;
  student_id: string;
  email_type: EmailType;
  dropout_band?: DropoutBand;
  subject: string;
  body: string;
  status: EmailDraft["status"];
  sent_at?: string;
}

function fromDraftRecord(record: AirtableRecord<DraftFields>): EmailDraft {
  const f = record.fields;
  return {
    id: record.id,
    client_id: f.client_id,
    student_id: f.student_id,
    email_type: f.email_type,
    dropout_band: f.dropout_band ?? null,
    subject: f.subject,
    body: f.body,
    status: f.status,
    created_at: record.createdTime,
    sent_at: f.sent_at ?? null,
  };
}

export async function createDraft(input: {
  client_id: string;
  student_id: string;
  email_type: EmailType;
  dropout_band?: DropoutBand | null;
  subject: string;
  body: string;
  status?: EmailDraft["status"];
}): Promise<EmailDraft> {
  const fields: DraftFields = {
    client_id: input.client_id,
    student_id: input.student_id,
    email_type: input.email_type,
    dropout_band: input.dropout_band ?? undefined,
    subject: input.subject,
    body: input.body,
    status: input.status ?? "pending_review",
  };
  const res = await airtableRequest<AirtableListResponse<DraftFields>>(
    DRAFTS_TABLE,
    { method: "POST", body: JSON.stringify({ records: [{ fields }] }) }
  );
  return fromDraftRecord(res.records[0]);
}

export async function listDrafts(
  clientId: string,
  status?: EmailDraft["status"]
): Promise<EmailDraft[]> {
  const clauses = [`{client_id} = '${clientId}'`];
  if (status) clauses.push(`{status} = '${status}'`);
  const records = await listAll<DraftFields>(
    DRAFTS_TABLE,
    `AND(${clauses.join(", ")})`
  );
  return records.map(fromDraftRecord).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );
}

export async function getDraft(id: string): Promise<EmailDraft | null> {
  try {
    const record = await airtableRequest<AirtableRecord<DraftFields>>(
      `${DRAFTS_TABLE}/${id}`
    );
    return fromDraftRecord(record);
  } catch {
    return null;
  }
}

export async function updateDraft(
  id: string,
  fields: Partial<DraftFields>
): Promise<EmailDraft> {
  const res = await airtableRequest<AirtableListResponse<DraftFields>>(
    DRAFTS_TABLE,
    { method: "PATCH", body: JSON.stringify({ records: [{ id, fields }] }) }
  );
  return fromDraftRecord(res.records[0]);
}

/** Has this student already received this exact type within the last 30 days? */
export async function hasRecentEmailOfType(
  clientId: string,
  studentId: string,
  emailType: EmailType,
  withinDays = 30
): Promise<boolean> {
  const drafts = await listDrafts(clientId, "sent");
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;
  return drafts.some(
    (d) =>
      d.student_id === studentId &&
      d.email_type === emailType &&
      d.sent_at &&
      new Date(d.sent_at).getTime() >= cutoff
  );
}
