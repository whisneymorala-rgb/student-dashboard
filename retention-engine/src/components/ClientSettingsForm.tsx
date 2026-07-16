"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { connectorMeta } from "@/lib/connectors/meta";
import type { Client } from "@/lib/types";

export function ClientSettingsForm({ client }: { client: Client }) {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: client.client_name,
    creator_voice_notes: client.creator_voice_notes,
    sales_page_url: client.sales_page_url,
    offer_ladder: client.offer_ladder,
    data_tier: client.data_tier,
    platform: client.platform,
    auto_send: client.auto_send,
  });
  const [platformConfig, setPlatformConfig] = useState<Record<string, string>>(
    client.platform_config ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConnector = connectorMeta.find((c) => c.id === form.platform);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        platform_config: activeConnector?.configFields.length ? platformConfig : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-muted)]">Creator profile</h2>
        <Field label="Client / creator name">
          <input
            className="input"
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          />
        </Field>
        <Field label="Creator voice notes">
          <textarea
            rows={4}
            className="input"
            value={form.creator_voice_notes}
            onChange={(e) => setForm({ ...form, creator_voice_notes: e.target.value })}
          />
        </Field>
        <Field label="Sales page URL">
          <input
            className="input"
            value={form.sales_page_url}
            onChange={(e) => setForm({ ...form, sales_page_url: e.target.value })}
          />
        </Field>
        <Field label="Next offer / upsell">
          <input
            className="input"
            value={form.offer_ladder}
            onChange={(e) => setForm({ ...form, offer_ladder: e.target.value })}
          />
        </Field>
        <Field label="Data tier">
          <select
            className="input"
            value={form.data_tier}
            onChange={(e) => setForm({ ...form, data_tier: e.target.value as Client["data_tier"] })}
          >
            <option value="coarse">Coarse (enroll/complete only)</option>
            <option value="full">Full (% complete + last activity)</option>
          </select>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-muted)]">Course platform connection</h2>
        <Field label="Platform">
          <select
            className="input"
            value={form.platform}
            onChange={(e) => {
              setForm({ ...form, platform: e.target.value as Client["platform"] });
              setPlatformConfig({});
            }}
          >
            {connectorMeta.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        {activeConnector?.configFields.map((field) => (
          <Field key={field.key} label={field.label}>
            <input
              type={field.secret ? "password" : "text"}
              className="input"
              value={platformConfig[field.key] ?? ""}
              onChange={(e) =>
                setPlatformConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          </Field>
        ))}
        {form.platform === "csv" && (
          <p className="text-xs text-[var(--text-muted)]">
            Column mapping is confirmed the first time you upload a CSV, from the Students tab
            or below.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-muted)]">Sending</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.auto_send}
            onChange={(e) => setForm({ ...form, auto_send: e.target.checked })}
          />
          Send approved drafts automatically (off = hold every draft for manual review, the safe
          default)
        </label>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm" style={{ color: "var(--status-active)" }}>Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          margin-top: 0.375rem;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: transparent;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
