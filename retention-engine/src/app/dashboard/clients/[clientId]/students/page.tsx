import { getClient, listStudents } from "@/lib/airtable";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();
  const students = await listStudents(clientId);

  const sorted = [...students].sort((a, b) =>
    a.status === b.status ? a.student_name.localeCompare(b.student_name) : order(a.status) - order(b.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">
          {students.length} student{students.length === 1 ? "" : "s"} · {client.data_tier} data
        </p>
        <div className="flex items-center gap-3">
          {client.platform !== "csv" && client.platform !== "manual" && (
            <ActionButton
              href={`/api/clients/${clientId}/sync`}
              label="Sync from platform"
              busyLabel="Syncing…"
            />
          )}
          <ActionButton
            href={`/api/clients/${clientId}/scan`}
            label="Run scan"
            busyLabel="Scanning…"
            variant="primary"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--text-secondary)]">
          No students yet. Connect a course platform or upload a CSV from Settings.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Last email</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.student_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar percent={s.percent_complete} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">
                    {formatDate(s.last_activity_date)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {s.last_email_type ? (
                      <span>
                        {s.last_email_type.replace("_", " ")}{" "}
                        <span className="text-xs text-[var(--text-muted)]">
                          ({formatDate(s.last_email_date)})
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function order(status: string): number {
  const rank = ["inactive", "at-risk", "onboarding", "active", "completed"];
  const idx = rank.indexOf(status);
  return idx === -1 ? rank.length : idx;
}
