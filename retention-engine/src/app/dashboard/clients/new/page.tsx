"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: "",
    creator_voice_notes: "",
    sales_page_url: "",
    offer_ladder: "",
    data_tier: "coarse",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create client.");
      return;
    }
    const { client } = await res.json();
    router.push(`/dashboard/clients/${client.id}/settings`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Add a client</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Doc 3&apos;s Table B — this is the per-client info every email prompt pulls from.
        You&apos;ll connect a course platform and confirm the data tier next.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Client / creator name">
          <input
            required
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Creator voice notes" hint="How they write — feeds every email prompt.">
          <textarea
            rows={4}
            value={form.creator_voice_notes}
            onChange={(e) => setForm({ ...form, creator_voice_notes: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Sales page URL" hint="Used by the reactivation prompt.">
          <input
            type="url"
            value={form.sales_page_url}
            onChange={(e) => setForm({ ...form, sales_page_url: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Next offer / upsell" hint="Their next product + price, if any.">
          <input
            value={form.offer_ladder}
            onChange={(e) => setForm({ ...form, offer_ladder: e.target.value })}
            className="input"
          />
        </Field>

        <Field
          label="Data tier"
          hint="FULL = platform gives % complete + last activity → all 8 email types. COARSE = only enroll/complete flags → 4 email types."
        >
          <select
            value={form.data_tier}
            onChange={(e) => setForm({ ...form, data_tier: e.target.value })}
            className="input"
          >
            <option value="coarse">Coarse (enroll/complete only)</option>
            <option value="full">Full (% complete + last activity)</option>
          </select>
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create client"}
        </button>
      </form>

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
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}
