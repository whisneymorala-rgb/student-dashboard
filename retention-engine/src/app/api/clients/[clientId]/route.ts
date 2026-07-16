import { NextRequest, NextResponse } from "next/server";
import { getClient, updateClient } from "@/lib/airtable";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const body = await req.json();
  const client = await updateClient(clientId, body);
  return NextResponse.json({ client });
}
