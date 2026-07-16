import { env } from "../env";
import type { EmailSender, SendEmailInput, SendEmailResult } from "./types";

export const resendSender: EmailSender = {
  id: "resend",
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${input.fromName} <${env.resendFromAddress}>`,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend API error (${res.status}): ${body}`);
    }
    const data = (await res.json()) as { id: string };
    return { sent: true, requiresManualSend: false, providerId: data.id };
  },
};
