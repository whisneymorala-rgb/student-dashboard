import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/airtable";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const tabs = [
    { href: `/dashboard/clients/${clientId}/students`, label: "Students" },
    { href: `/dashboard/clients/${clientId}/drafts`, label: "Drafts" },
    { href: `/dashboard/clients/${clientId}/settings`, label: "Settings" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            ← All clients
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{client.client_name}</h1>
        </div>
      </div>
      <nav className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
