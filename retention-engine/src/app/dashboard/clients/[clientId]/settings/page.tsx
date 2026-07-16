import { notFound } from "next/navigation";
import { getClient } from "@/lib/airtable";
import { ClientSettingsForm } from "@/components/ClientSettingsForm";
import { CsvUpload } from "@/components/CsvUpload";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  return (
    <div className="space-y-8">
      <ClientSettingsForm client={client} />
      {(client.platform === "csv" || client.platform === "manual") && (
        <div className="max-w-2xl">
          <CsvUpload clientId={clientId} />
        </div>
      )}
    </div>
  );
}
