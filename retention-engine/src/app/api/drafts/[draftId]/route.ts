import { NextRequest, NextResponse } from "next/server";
import { editDraft } from "@/lib/send";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const { subject, body } = await req.json();
  try {
    const draft = await editDraft(draftId, { subject, body });
    return NextResponse.json({ draft });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
