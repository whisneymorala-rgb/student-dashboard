# Setup

This app is the coded version of the "Retention Engine" described in the
product docs (Doc 1: Product Vision, Doc 2: How to Use Claude, Doc 3: The
Build Guide) — same student schema, same detection logic, same anti-spam
guard, same email psychology, just running as a website with real code
instead of wired up by hand in Make.com.

## 1. Create the Airtable base

Same as Doc 3, Step 1 — this app reads and writes an Airtable base exactly
like the one the build guide describes, plus one more table for drafts.

Create a new Airtable base called **Student Dashboard** (or anything you
like — only the table and field names below matter).

### Table: `Students`

| Field | Type | Notes |
|---|---|---|
| `student_name` | Single line text | |
| `email` | Single line text | Unique key — one row per email |
| `course_name` | Single line text | |
| `enrollment_date` | **Date** | |
| `status` | Single select | `onboarding` / `active` / `at-risk` / `inactive` / `completed` |
| `percent_complete` | Number | FULL-data only |
| `last_activity_date` | **Date** | FULL-data only |
| `engagement_trend` | Single select | `accelerating` / `steady` / `slowing` |
| `last_email_type` | Single select | `onboarding` / `early_momentum` / `at_risk` / `reactivation` / `finish_line` / `testimonial` / `referral` / `upsell` |
| `last_email_date` | **Date** | Powers the double-send guard |
| `offer_ladder` | Single line text | |
| `client_id` | Single line text | The linked Clients record ID — lets one base hold more than one client |
| `flagged_reactivation` | Checkbox | |
| `testimonial_sent` | Checkbox | |
| `testimonial_positive` | Checkbox | Set by hand from the Students tab — the app can't infer sentiment |

### Table: `Clients`

| Field | Type | Notes |
|---|---|---|
| `client_name` | Single line text | |
| `creator_voice_notes` | Long text | Feeds every email prompt |
| `sales_page_url` | URL | |
| `offer_ladder` | Single line text | |
| `data_tier` | Single select | `full` / `coarse` |
| `platform` | Single line text | `teachable` / `thinkific` / `csv` / `manual` |
| `platform_config` | Long text | JSON — the app writes this, you don't need to touch it |
| `auto_send` | Checkbox | |

### Table: `Drafts` (addition beyond Doc 3 — the review queue)

| Field | Type | Notes |
|---|---|---|
| `client_id` | Single line text | |
| `student_id` | Single line text | |
| `email_type` | Single line text | |
| `dropout_band` | Single line text | `early` / `mid` / `late`, reactivation only |
| `subject` | Single line text | |
| `body` | Long text | |
| `status` | Single select | `pending_review` / `approved` / `sent` / `discarded` |
| `sent_at` | Date | |

⚠️ Every `Date` field must actually be typed **Date**, not text — Doc 2's
"Problem 2." The app sends ISO date strings; Airtable's own filter formulas
(used by the Scanner) only work correctly against real Date fields.

### Get your Airtable token

Airtable → Builder Hub → Personal Access Tokens. Create one scoped to
`data.records:read` and `data.records:write` for this base only. Paste it
into your environment variables (`AIRTABLE_TOKEN`) — never into a chat.

## 2. Get an Anthropic API key

console.anthropic.com → API Keys. This is what drafts every email.

## 3. Set environment variables

Copy `.env.example` to `.env.local` (local dev) or set the same names in
your hosting provider's dashboard (production). See that file for what each
one is and where it comes from.

Generate `SESSION_SECRET` with:

```
openssl rand -base64 32
```

## 4. Connect a course platform

From a client's Settings tab, pick a platform:

- **Teachable / Thinkific** — paste the API key (and Thinkific subdomain).
  The field mappings in `src/lib/connectors/` are a best-effort guess at
  each platform's current API shape (this build session couldn't reach
  their live docs to verify). If a sync errors or comes back empty, paste
  the actual error — or one real JSON record from that platform's API — to
  Claude and ask it to fix the mapping in that one file. That's a two-minute
  fix, not a rebuild, per Doc 2.
- **CSV upload** — works with an export from any platform. Upload once, map
  the columns, and the mapping is remembered for the next upload.
- **Manual** — add students one at a time from the dashboard.

## 5. Decide the data tier per client

Same rule as Doc 3, Step 0: if the platform gives you `% complete` AND
`last activity date`, use **full** (all 8 email types). If it only gives you
enroll/complete flags, use **coarse** (4 email types: Onboarding,
Reactivation, Testimonial, Upsell). Don't guess — check what the export
actually contains.

## 6. Wire up the twice-weekly schedule (recommended for production)

Doc 3's locked setting: import cadence and Scanner schedule both twice
weekly. `POST /api/cron/scan` runs sync + scan for every client, gated by
`CRON_SECRET`. Point any scheduler at it:

- **Vercel Cron** — add to `vercel.json`:
  ```json
  {
    "crons": [{ "path": "/api/cron/scan", "schedule": "0 13 * * 1,4" }]
  }
  ```
  (Vercel Cron sends its own auth automatically when `CRON_SECRET` is set as
  the `CRON_SECRET` env var — see Vercel's cron docs for the exact header.)
- **Any other scheduler** (GitHub Actions, cron-job.org) — have it send
  `Authorization: Bearer $CRON_SECRET` to `POST https://your-domain/api/cron/scan`
  twice a week.

Without this, you can still run everything by hand from each client's
Students tab ("Sync from platform" / "Run scan").

## 7. Set up an email sender (optional at first)

Until `RESEND_API_KEY`/`RESEND_FROM_ADDRESS` or `INSTANTLY_API_KEY` are set,
approving a draft marks it "ready" without actually transmitting it — copy
it out by hand. Resend is the simplest to set up for a first real send.

## 8. Test before connecting a real client

Same spirit as Doc 3, Step 5: add a handful of test students covering every
status (just-enrolled, 8-days-silent at 5%/40%/75% complete, 95% complete,
100% complete) to a test client, run a scan, and confirm each one gets
exactly one draft of the right type — including that a student who could
match two routes only gets one draft.
