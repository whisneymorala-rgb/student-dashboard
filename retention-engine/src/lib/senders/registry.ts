import { env } from "../env";
import { instantlySender } from "./instantly";
import { manualSender } from "./manual";
import { resendSender } from "./resend";
import type { EmailSender } from "./types";

export function getActiveSender(): EmailSender {
  if (env.resendApiKey && env.resendFromAddress) return resendSender;
  if (env.instantlyApiKey) return instantlySender;
  return manualSender;
}
