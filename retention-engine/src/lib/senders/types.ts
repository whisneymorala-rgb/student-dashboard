export interface SendEmailInput {
  to: string;
  toName: string;
  fromName: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  sent: boolean;
  /** True for the manual fallback: nothing was actually transmitted. */
  requiresManualSend: boolean;
  providerId?: string;
}

export interface EmailSender {
  id: "resend" | "instantly" | "manual";
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
