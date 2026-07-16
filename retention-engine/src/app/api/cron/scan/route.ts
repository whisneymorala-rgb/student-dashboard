import { NextRequest, NextResponse } from "next/server";
import { listClients } from "@/lib/airtable";
import { env } from "@/lib/env";
import { runScan } from "@/lib/scanner";
import { syncClientStudents } from "@/lib/sync";

/**
 * Doc 3's locked settings: import cadence twice weekly, Scanner schedule
 * matches the import ("no point scanning faster than the data updates").
 * This single endpoint does both, for every client, back to back — wire it
 * to a scheduler (Vercel Cron, GitHub Actions, cron-job.org) hitting it
 * twice a week with `Authorization: Bearer $CRON_SECRET`. Not gated by the
 * dashboard session cookie (see middleware.ts) — a scheduler can't log in —
 * so CRON_SECRET is what stands in its place.
 */
export async function POST(req: NextRequest) {
  if (!env.cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await listClients();
  const results = [];
  for (const client of clients) {
    try {
      const sync = await syncClientStudents(client);
      const scan = await runScan(client);
      results.push({ client: client.client_name, sync, scan });
    } catch (err) {
      results.push({
        client: client.client_name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ results });
}
