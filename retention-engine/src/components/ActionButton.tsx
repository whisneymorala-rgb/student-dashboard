"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActionButton({
  href,
  label,
  busyLabel,
  variant = "secondary",
  onResult,
}: {
  href: string;
  label: string;
  busyLabel: string;
  variant?: "primary" | "secondary";
  onResult?: (data: unknown) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(href, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      onResult?.(data);
      setMessage(summarize(data));
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const base =
    "rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60 transition";
  const cls =
    variant === "primary"
      ? `${base} bg-[var(--accent)] text-white`
      : `${base} border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]`;

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={loading} className={cls}>
        {loading ? busyLabel : label}
      </button>
      {message && <span className="text-xs text-[var(--text-muted)]">{message}</span>}
    </div>
  );
}

function summarize(data: unknown): string {
  if (typeof data !== "object" || data === null) return "Done.";
  const d = data as Record<string, unknown>;
  if ("drafted" in d && Array.isArray(d.drafted)) {
    return `${d.drafted.length} draft(s) created, ${d.skippedByGuard ?? 0} blocked by guard.`;
  }
  if ("updated" in d) {
    return `${d.updated} updated, ${d.created ?? 0} created, ${(d as { errors?: unknown[] }).errors?.length ?? 0} errors.`;
  }
  return "Done.";
}
