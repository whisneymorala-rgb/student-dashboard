# Retention Engine

Connects to a course platform, tracks every student's engagement state, and
drafts the personalized re-engagement email that wins them back before they
disappear for good — the coded version of the system described in the
product docs (Product Vision, How to Use Claude, The Build Guide).

## What it does

1. **Connects** to a client's course platform (Teachable, Thinkific, a CSV
   export from anything else, or manual entry) and pulls in student data on
   a schedule.
2. **Scans** the student list and classifies every student's state —
   onboarding, active, at-risk, inactive, or completed — plus, where the
   platform gives granular data, engagement trend and dropout stage.
3. **Drafts** the one matching email in the creator's own voice using
   Claude, tone-matched to how far a lapsed student got before they went
   quiet (early / mid / late).
4. **Guards** against spam: no student gets more than one email in any
   7-day window, and never the same type twice in 30 days — enforced both
   in the database query and again immediately before every send.
5. **Holds every draft for review** by default (an approve/edit/discard
   queue) — nothing goes out until a human says so, unless a client is
   explicitly switched to auto-send.

## Tech

Next.js (App Router, TypeScript) · Airtable as the student database (same
schema as the build guide) · Anthropic API for email drafting · pluggable
connectors for the course-platform side and the sending side.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values — see SETUP.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on a login
screen (single shared password, `DASHBOARD_PASSWORD`) and, until Airtable +
Anthropic are configured, a setup screen instead of a crash.

**Full setup instructions — the Airtable base schema, API keys, connecting a
platform, scheduling the twice-weekly scan — are in [`SETUP.md`](./SETUP.md).**

## Project structure

```
src/
  app/
    login/                    Password gate
    dashboard/                 The UI: clients, students, drafts, settings
    api/                       Everything the UI (and the cron job) calls
  lib/
    airtable.ts                 The Students/Clients/Drafts data layer
    connectors/                 Course-platform adapters (Teachable, Thinkific, CSV, manual)
    senders/                    Email-sending adapters (Resend, Instantly, manual fallback)
    status.ts                   Engagement-state + dropout-band computation
    scanner.ts                  The router: who gets which email, in order, with the guard
    prompts.ts / claude.ts      The email-drafting prompts + Anthropic call
    send.ts                     Approve → send → write-back
```

## A deliberate deviation from the build guide

The build guide's Doc 1 says to reuse an existing hand-built Make.com
reactivation scenario rather than rebuild it — sound advice when that
scenario already exists and works. It doesn't exist in this codebase, so
reactivation is implemented here like every other email type, just with
extra care on the prompt (tone-matched to dropout stage) since it's still
the highest-leverage email in the system.

It also fixes one inconsistency in the original build guide: the documented
base Scanner query excludes `status = completed`, but three of the
documented routes (Testimonial, Referral, Upsell) only fire for
100%-complete students — who that same query would have already excluded.
See the comment on `listScannableStudents` in `src/lib/airtable.ts`.
