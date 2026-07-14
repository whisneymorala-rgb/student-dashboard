# Student Completion Dashboard

Real-time student status/completion tracking dashboard powered by Airtable.

## Features

- **Live metrics**: Completion rate, at-risk students, emails sent
- **Date filtering**: Last 7 days, 30 days, 90 days, all time
- **Progress visualization**: Doughnut chart showing progress distribution
- **Email tracking**: Breakdown by email type sent
- **Per-student status table**: Search by name, filter by status, see progress, enrollment date, and last email contact for every student

## Airtable setup

Your Airtable base needs a table (default name `Students`) with these fields (case-insensitive alternates are supported, see `api/students.js`):

| Field | Type | Notes |
|---|---|---|
| `name` | Text | Student's display name |
| `status` | Text | e.g. `completed`, `in_progress`, `at_risk`, `not_started` |
| `percent_complete` | Number | 0–100 |
| `enrollment_date` | Date | |
| `last_email_type` | Text | e.g. `welcome`, `reminder`, `nudge` |
| `last_email_date` | Date | |

## Deploy to Vercel (1 minute)

1. Go to vercel.com
2. Click "Add New" → "Project"
3. Click "Import Git Repository"
4. Paste: https://github.com/whisneymorala-rgb/student-dashboard
5. Click "Import"
6. Before deploying, add these **Environment Variables** in the Vercel project settings:
   - `AIRTABLE_API_KEY` — a personal access token from [airtable.com/create/tokens](https://airtable.com/create/tokens) with `data.records:read` scope on your base
   - `AIRTABLE_BASE_ID` — your base ID (starts with `app...`)
   - `AIRTABLE_TABLE_NAME` — optional, defaults to `Students`
7. Click Deploy — your dashboard is live!

**Never commit your Airtable API key to the repo.** The serverless function in `api/students.js` reads it from environment variables at runtime, so it's never exposed to the browser.

> ⚠️ An earlier version of this project had an Airtable token and base ID hardcoded directly in `api/students.js` and committed to git history. If that token is still active, **revoke/rotate it** in your Airtable account (Developer Hub → Personal access tokens) — anyone with access to this repo's history can read it.

## File Structure

- `index.html` — the dashboard UI (static, no build step)
- `api/students.js` — serverless function that proxies requests to Airtable using server-side environment variables
- `vercel.json` — routing config so `/api/*` hits the function and everything else serves `index.html`
