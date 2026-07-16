import { NextRequest, NextResponse } from "next/server";
import { discardDraft } from "@/lib/send";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  try {
    const draft = await discardDraft(draftId);
    return NextResponse.json({ draft });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
