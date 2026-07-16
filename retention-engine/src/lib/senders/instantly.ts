import { env } from "../env";
import type { EmailSender, SendEmailInput, SendEmailResult } from "./types";

/**
 * Doc 3, Module 3: "Add the Instantly module (or an HTTP call to Instantly's
 * API — confirm with Morgan which sending account/domain to use)." Instantly
 * is built around cold-email campaigns rather than one-off transactional
 * sends, so this hits their v2 "send a message" endpoint as a best-effort
 * mapping — verify against Instantly's current API docs before relying on
 * it, per the same caution Doc 2 gives about any tool detail Claude states
 * as current fact.
 */
export const instantlySender: EmailSender = {
  id: "instantly",
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const res = await fetch("https://api.instantly.ai/api/v2/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.instantlyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to_address_email: input.to,
        subject: input.subject,
        body: { text: input.body },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Instantly API error (${res.status}): ${body}`);
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, requiresManualSend: false, providerId: data.id };
  },
};
