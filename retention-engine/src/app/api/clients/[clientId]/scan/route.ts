import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/airtable";
import { runScan } from "@/lib/scanner";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
  try {
    const result = await runScan(client);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
