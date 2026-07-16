import type { Client, DropoutBand, EmailType, Student } from "./types";

// Doc 1's two non-negotiables, prepended to every prompt this system sends.
const CORE_RULES = `You are ghostwriting a single email in this course creator's own voice.

NEVER FABRICATE. Do not invent student activity details ("I saw you finished lesson 4"), do not invent testimonials or quotes, do not invent outcomes. If you don't have a real detail to reference, don't reference one — write around it instead of making one up. This is the single rule that protects the creator's reputation; treat any temptation to "fill in a realistic detail" as a hard stop.

REDUCE FRICTION, NEVER APPLY PRESSURE. No guilt ("you committed to this!"). The email should ask for exactly one action that takes 15 minutes or less, stated plainly.

Match the creator's voice using the notes provided — their real phrasing, tone, and typical length, not a generic template.

Output format (follow exactly, nothing before or after):
Subject: <the subject line>

<the email body, written as the creator would send it>`;

const DROPOUT_ANGLE: Record<DropoutBand, string> = {
  early:
    "This student is 0-25% through the course — barely started, low investment. They probably don't feel guilty, they just drifted. Angle: casual, no guilt, just re-introduce the value of what's waiting for them. This is the highest-leverage email in the whole system (most dropout happens right here) — make it genuinely good, not a template filled in.",
  mid:
    "This student is 26-60% through the course — they hit the wall mid-course. Angle: validate their progress, normalize the slump ('this is exactly where most people pause'), and hand them the smallest possible next step.",
  late:
    "This student is 61-99% through the course — so close, and often afraid to finish or scared it won't live up to the effort. Angle: 'you're almost there, don't stop now' — make finishing feel close and easy, not like more work.",
};

function studentContext(student: Student): string {
  return `Student: ${student.student_name}
Course: ${student.course_name}
Percent complete: ${student.percent_complete ?? "unknown (coarse data)"}
Enrolled: ${student.enrollment_date}
Last activity: ${student.last_activity_date ?? "unknown (coarse data)"}`;
}

function clientContext(client: Client): string {
  return `Creator name: ${client.client_name}
Creator voice notes: ${client.creator_voice_notes || "(none provided — write in a warm, plain, direct voice)"}
Sales page: ${client.sales_page_url || "(none provided)"}
Next offer: ${client.offer_ladder || "(none — this client has no next product yet)"}`;
}

const TYPE_INSTRUCTIONS: Record<EmailType, (student: Student) => string> = {
  onboarding: () =>
    "This student just enrolled. Welcome them warmly and get them into lesson 1 fast. Their single action: open the course and start lesson 1 today.",
  early_momentum: () =>
    "This student is moving fast early on (accelerating, within their first 14 days). Reinforce the streak before the typical early drop-off — genuine, specific-to-the-pattern encouragement (not fabricated details about what they did), and point them to the next lesson.",
  at_risk: (s) =>
    `This student was active and has now gone quiet for a few days (trend: slowing). This is a gentle nudge before they fully disappear — low-key, no guilt, one tiny action to pick back up where they left off (course: ${s.course_name}).`,
  reactivation: () =>
    "This is the reactivation email — the centerpiece of this whole system. See the dropout-stage angle below and match it exactly.",
  finish_line: (s) =>
    `This student is ${s.percent_complete}% done — push them over the finish line. Make the remaining stretch feel small and doable, one concrete next action.`,
  testimonial: () =>
    "This student just hit 100% completion. Ask for a real testimonial/review at peak happiness. Ask for their own real words — do not suggest specific phrases for them to say, and do not imply what they should have felt.",
  referral: () =>
    "This student finished and was positive (they gave a testimonial). Ask them to refer exactly one person who'd benefit from this course. Keep the ask small and specific.",
  upsell: (s) =>
    `This student finished and the creator has a next offer: ${s.offer_ladder}. Bridge them naturally into it — connect it to what they just accomplished, not a hard sell.`,
};

export function buildSystemPrompt(input: {
  client: Client;
  student: Student;
  emailType: EmailType;
  dropoutBand: DropoutBand | null;
}): string {
  const { client, student, emailType, dropoutBand } = input;
  const parts = [
    CORE_RULES,
    "",
    `--- Email type: ${emailType} ---`,
    TYPE_INSTRUCTIONS[emailType](student),
  ];
  if (emailType === "reactivation" && dropoutBand) {
    parts.push("", DROPOUT_ANGLE[dropoutBand]);
  }
  parts.push("", "--- Creator ---", clientContext(client));
  parts.push("", "--- Student ---", studentContext(student));
  return parts.join("\n");
}
