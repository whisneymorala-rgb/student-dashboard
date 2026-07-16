import { NextRequest, NextResponse } from "next/server";
import { approveAndSendDraft } from "@/lib/send";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  try {
    const result = await approveAndSendDraft(draftId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
