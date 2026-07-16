import { NextRequest, NextResponse } from "next/server";
import { createClient, listClients } from "@/lib/airtable";

export async function GET() {
  const clients = await listClients();
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.client_name || !body.data_tier) {
    return NextResponse.json(
      { error: "client_name and data_tier are required." },
      { status: 400 }
    );
  }
  const created = await createClient(body);
  return NextResponse.json({ client: created }, { status: 201 });
}
