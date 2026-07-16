import Link from "next/link";
import { listClients, listStudents } from "@/lib/airtable";
import { env } from "@/lib/env";
import type { Student } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

async function ClientCard({ id, name, dataTier }: { id: string; name: string; dataTier: string }) {
  let students: Student[] = [];
  try {
    students = await listStudents(id);
  } catch {
    // Airtable not reachable for this base yet — show the card with zeroed stats.
  }
  const atRisk = students.filter((s) => s.status === "at-risk" || s.status === "inactive").length;

  return (
    <Link
      href={`/dashboard/clients/${id}`}
      className="block rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 transition hover:border-[var(--accent)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{name}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {dataTier} data
          </p>
        </div>
        <span className="rounded-full bg-[var(--surface-1)] px-2.5 py-1 text-xs font-medium tabular-nums">
          {students.length} students
        </span>
      </div>
      {atRisk > 0 && (
        <p className="mt-3 text-sm" style={{ color: "var(--status-inactive)" }}>
          {atRisk} need attention
        </p>
      )}
    </Link>
  );
}

export default async function DashboardHome() {
  if (!env.isConfigured()) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-8">
        <h1 className="text-lg font-semibold">Set up the Retention Engine</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          This deployment is missing required environment variables (Airtable, Anthropic,
          dashboard password/session secret). See <code className="rounded bg-[var(--surface-1)] px-1">SETUP.md</code>{" "}
          in the repo for the exact values to set and where they come from.
        </p>
      </div>
    );
  }

  const clients = await listClients();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            One database per client&apos;s students, scanned on schedule for who needs an email.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Add client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No clients yet. Add one to connect a course platform and start tracking students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <ClientCard key={c.id} id={c.id} name={c.client_name} dataTier={c.data_tier} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Clients" value={clients.length} />
        <StatTile label="Auto-send on" value={clients.filter((c) => c.auto_send).length} />
        <StatTile label="Full-data clients" value={clients.filter((c) => c.data_tier === "full").length} />
        <StatTile label="Coarse-data clients" value={clients.filter((c) => c.data_tier === "coarse").length} />
      </div>
    </div>
  );
}
