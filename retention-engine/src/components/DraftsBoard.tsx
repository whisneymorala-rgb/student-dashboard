"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EmailDraft } from "@/lib/types";

interface DraftWithStudent extends EmailDraft {
  studentName: string;
  studentEmail: string;
}

const TYPE_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  early_momentum: "Early momentum",
  at_risk: "At-risk",
  reactivation: "Reactivation",
  finish_line: "Finish-line",
  testimonial: "Testimonial",
  referral: "Referral",
  upsell: "Upsell",
};

export function DraftsBoard({ drafts }: { drafts: DraftWithStudent[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, { subject: string; body: string }>>({});
  const [error, setError] = useState<string | null>(null);

  function startEdit(d: DraftWithStudent) {
    setEditing((prev) => ({ ...prev, [d.id]: { subject: d.subject, body: d.body } }));
  }

  async function saveEdit(id: string) {
    const draft = editing[id];
    if (!draft) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save edit.");
      return;
    }
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    router.refresh();
  }

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/drafts/${id}/approve`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send.");
      return;
    }
    router.refresh();
  }

  async function discard(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/drafts/${id}/discard`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not discard.");
      return;
    }
    router.refresh();
  }

  if (drafts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--text-secondary)]">
        No drafts waiting for review. Run a scan from the Students tab to generate some.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {drafts.map((d) => {
        const edit = editing[d.id];
        const busy = busyId === d.id;
        return (
          <div key={d.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="rounded-full bg-[var(--surface-1)] px-2.5 py-0.5 text-xs font-medium">
                  {TYPE_LABEL[d.email_type] ?? d.email_type}
                  {d.dropout_band ? ` · ${d.dropout_band}` : ""}
                </span>
                <p className="mt-1.5 text-sm">
                  <span className="font-medium">{d.studentName}</span>{" "}
                  <span className="text-[var(--text-muted)]">{d.studentEmail}</span>
                </p>
              </div>
            </div>

            {edit ? (
              <div className="mt-3 space-y-2">
                <input
                  className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-medium outline-none focus:border-[var(--accent)]"
                  value={edit.subject}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [d.id]: { ...edit, subject: e.target.value } }))
                  }
                />
                <textarea
                  rows={8}
                  className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  value={edit.body}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [d.id]: { ...edit, body: e.target.value } }))
                  }
                />
              </div>
            ) : (
              <div className="mt-3">
                <p className="font-medium">{d.subject}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{d.body}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {edit ? (
                <>
                  <button
                    disabled={busy}
                    onClick={() => saveEdit(d.id)}
                    className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      setEditing((prev) => {
                        const next = { ...prev };
                        delete next[d.id];
                        return next;
                      })
                    }
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={busy}
                    onClick={() => approve(d.id)}
                    className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {busy ? "Sending…" : "Approve & send"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => startEdit(d)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => discard(d.id)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-red-500"
                  >
                    Discard
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
