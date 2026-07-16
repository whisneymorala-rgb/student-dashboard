"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CsvColumnMapping } from "@/lib/connectors/csv";

const FIELDS: { key: keyof CsvColumnMapping; label: string; required: boolean }[] = [
  { key: "nameColumn", label: "Name column", required: true },
  { key: "emailColumn", label: "Email column", required: true },
  { key: "courseColumn", label: "Course column", required: true },
  { key: "enrollmentDateColumn", label: "Enrollment date column", required: true },
  { key: "percentCompleteColumn", label: "% complete column (optional)", required: false },
  { key: "lastActivityColumn", label: "Last activity date column (optional)", required: false },
];

export function CsvUpload({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [mapping, setMapping] = useState<Partial<CsvColumnMapping>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(withMapping: boolean) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    if (withMapping) form.set("mapping", JSON.stringify(mapping));
    const res = await fetch(`/api/clients/${clientId}/students/import`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Import failed.");
      return;
    }
    if (data.needsMapping) {
      setHeaders(data.headers);
      setMapping(data.guess ?? {});
      return;
    }
    setResult(`Imported ${data.imported} of ${data.fetched} rows.${data.errors?.length ? ` ${data.errors.length} errors.` : ""}`);
    setHeaders(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <h3 className="text-sm font-semibold">Upload a CSV</h3>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Works with an export from any course platform. Doc 2&apos;s smart-quote trap is handled
        automatically — the text is sanitized before it&apos;s parsed.
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mt-3 text-sm"
      />

      {headers && (
        <div className="mt-4 space-y-3 rounded-md border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-muted)]">
            Confirm which column is which (detected headers: {headers.join(", ")}).
          </p>
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              {f.label}
              <select
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                value={mapping[f.key] ?? ""}
                onChange={(e) => setMapping((prev) => ({ ...prev, [f.key]: e.target.value }))}
              >
                <option value="">{f.required ? "Select…" : "(none)"}</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            disabled={busy}
            onClick={() => upload(true)}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Importing…" : "Import with this mapping"}
          </button>
        </div>
      )}

      {!headers && file && (
        <button
          disabled={busy}
          onClick={() => upload(false)}
          className="mt-3 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Reading…" : "Continue"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {result && (
        <p className="mt-3 text-sm" style={{ color: "var(--status-active)" }}>
          {result}
        </p>
      )}
    </div>
  );
}
