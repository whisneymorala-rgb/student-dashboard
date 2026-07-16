import { NextRequest, NextResponse } from "next/server";
import { getClient, updateClient } from "@/lib/airtable";
import { guessColumnMapping, parseCsv, type CsvColumnMapping } from "@/lib/connectors/csv";
import { upsertStudent } from "@/lib/sync";

/**
 * The CSV push path (Doc 3, Step 1's "smart-quote trap" applies directly
 * here — parseCsv sanitizes before anything is parsed). Accepts either a
 * previously-saved column mapping (client.platform_config) or one supplied
 * in this request; if headers are sent with no mapping, returns a best-guess
 * mapping for the UI to confirm instead of importing blind.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No CSV file uploaded." }, { status: 400 });
  }
  const csvText = await file.text();

  const mappingOverride = form.get("mapping");
  let mapping: Partial<CsvColumnMapping> | undefined;
  if (typeof mappingOverride === "string" && mappingOverride) {
    mapping = JSON.parse(mappingOverride);
  } else if (client.platform_config && Object.keys(client.platform_config).length) {
    mapping = client.platform_config as Partial<CsvColumnMapping>;
  }

  if (
    !mapping?.nameColumn ||
    !mapping?.emailColumn ||
    !mapping?.courseColumn ||
    !mapping?.enrollmentDateColumn
  ) {
    // Not enough to import yet — hand back a best guess for the user to confirm.
    const firstLine = csvText.split(/\r?\n/, 1)[0] ?? "";
    const headers = firstLine.split(",").map((h) => h.trim());
    return NextResponse.json(
      { needsMapping: true, headers, guess: guessColumnMapping(headers) },
      { status: 200 }
    );
  }

  let records;
  try {
    records = parseCsv(csvText, mapping as CsvColumnMapping);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  let imported = 0;
  for (const record of records) {
    try {
      await upsertStudent(client, record);
      imported += 1;
    } catch (err) {
      errors.push(`${record.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Remember the mapping so the next twice-weekly upload doesn't need re-confirming.
  await updateClient(clientId, {
    platform: "csv",
    platform_config: mapping as Record<string, string>,
  });

  return NextResponse.json({ fetched: records.length, imported, errors });
}
