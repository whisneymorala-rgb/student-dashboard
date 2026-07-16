import { NextRequest, NextResponse } from "next/server";
import { listDrafts } from "@/lib/airtable";
import type { EmailDraft } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const status = req.nextUrl.searchParams.get("status") as
    | EmailDraft["status"]
    | null;
  const drafts = await listDrafts(clientId, status ?? undefined);
  return NextResponse.json({ drafts });
}
