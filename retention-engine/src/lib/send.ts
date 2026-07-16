import {
  getClient,
  getDraft,
  getStudentById,
  recordEmailSent,
  updateDraft,
  updateStudent,
} from "./airtable";
import { getActiveSender } from "./senders/registry";
import type { EmailDraft, StudentStatus } from "./types";

export interface ApproveResult {
  draft: EmailDraft;
  requiresManualSend: boolean;
}

/** Doc 3, Module 4: "Never skip the write-back." This is that write-back, wired to whichever sender is active. */
export async function approveAndSendDraft(draftId: string): Promise<ApproveResult> {
  const draft = await getDraft(draftId);
  if (!draft) throw new Error("Draft not found.");
  if (draft.status !== "pending_review") {
    throw new Error(`Draft is already ${draft.status}.`);
  }

  const [client, student] = await Promise.all([
    getClient(draft.client_id),
    getStudentById(draft.student_id),
  ]);
  if (!client) throw new Error("Client not found.");
  if (!student) throw new Error("Student not found.");

  const sender = getActiveSender();
  const result = await sender.send({
    to: student.email,
    toName: student.student_name,
    fromName: client.client_name,
    subject: draft.subject,
    body: draft.body,
  });

  const advanceStatus: StudentStatus | undefined =
    student.status === "onboarding" ? "active" : undefined;

  await recordEmailSent(student.id, draft.email_type, { advanceStatus });

  if (draft.email_type === "testimonial") {
    await updateStudent(student.id, { testimonial_sent: true });
  }

  const updated = await updateDraft(draftId, {
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  return { draft: updated, requiresManualSend: result.requiresManualSend };
}

export async function discardDraft(draftId: string): Promise<EmailDraft> {
  return updateDraft(draftId, { status: "discarded" });
}

export async function editDraft(
  draftId: string,
  fields: { subject?: string; body?: string }
): Promise<EmailDraft> {
  return updateDraft(draftId, fields);
}
