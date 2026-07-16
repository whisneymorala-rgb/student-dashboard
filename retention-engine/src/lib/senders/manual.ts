import type { EmailSender, SendEmailResult } from "./types";

/** No ESP configured yet — approving a draft marks it ready for copy-paste sending. */
export const manualSender: EmailSender = {
  id: "manual",
  async send(): Promise<SendEmailResult> {
    return { sent: false, requiresManualSend: true };
  },
};
