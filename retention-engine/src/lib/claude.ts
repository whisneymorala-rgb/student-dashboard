import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import { buildSystemPrompt } from "./prompts";
import type { Client, DropoutBand, EmailType, Student } from "./types";

// Doc 3's build guide (written for a hand-wired Make.com HTTP module) pins
// "claude-sonnet-4-20250514" as a wiring example. Since this is a real SDK
// call rather than hand-typed JSON, we target the current model instead —
// the doc's actual requirement is email quality (it calls the early-band
// reactivation email "the highest-leverage asset in the whole system"), not
// a specific frozen model string.
const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.anthropicApiKey });
  return client;
}

export interface DraftEmailInput {
  client: Client;
  student: Student;
  emailType: EmailType;
  dropoutBand: DropoutBand | null;
}

export interface DraftEmailOutput {
  subject: string;
  body: string;
}

/**
 * Doc 3, Module 1 + Module 2: call Claude, pull content[0].text out of the
 * wrapped response, strip stray markdown fences, then split the "Subject:"
 * line from the body so the word "Subject:" never ends up inside the sent
 * email.
 */
export async function draftEmail(input: DraftEmailInput): Promise<DraftEmailOutput> {
  const system = buildSystemPrompt(input);
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system,
    messages: [
      {
        role: "user",
        content: `Write the ${input.emailType.replace("_", " ")} email for ${input.student.student_name} now.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Claude returned a non-text response block.");
  }

  return splitSubjectAndBody(block.text);
}

export function splitSubjectAndBody(raw: string): DraftEmailOutput {
  const cleaned = raw.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
  const lines = cleaned.split("\n");
  const subjectLineIndex = lines.findIndex((l) => /^subject:\s*/i.test(l));

  if (subjectLineIndex === -1) {
    // Claude didn't follow the format — fail loudly rather than send a
    // malformed email with no subject.
    throw new Error(
      `Claude's response didn't include a "Subject:" line. Raw response: ${cleaned.slice(0, 200)}`
    );
  }

  const subject = lines[subjectLineIndex].replace(/^subject:\s*/i, "").trim();
  const body = lines
    .slice(subjectLineIndex + 1)
    .join("\n")
    .trim();

  return { subject, body };
}
