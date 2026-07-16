// Central place to read server-only secrets. Never import this from a "use client" file —
// Doc 2 is explicit that keys must never end up anywhere but a server env var.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See SETUP.md for how to get it.`
    );
  }
  return value;
}

export const env = {
  get airtableToken() {
    return required("AIRTABLE_TOKEN");
  },
  get airtableBaseId() {
    return required("AIRTABLE_BASE_ID");
  },
  get anthropicApiKey() {
    return required("ANTHROPIC_API_KEY");
  },
  get dashboardPassword() {
    return required("DASHBOARD_PASSWORD");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get resendFromAddress() {
    return process.env.RESEND_FROM_ADDRESS ?? "";
  },
  get instantlyApiKey() {
    return process.env.INSTANTLY_API_KEY ?? "";
  },

  /** Whether the app is configured enough to run (vs. showing a setup screen). */
  isConfigured(): boolean {
    return Boolean(
      process.env.AIRTABLE_TOKEN &&
        process.env.AIRTABLE_BASE_ID &&
        process.env.ANTHROPIC_API_KEY &&
        process.env.DASHBOARD_PASSWORD &&
        process.env.SESSION_SECRET
    );
  },
};
