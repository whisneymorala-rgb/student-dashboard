import { NextRequest, NextResponse } from "next/server";
import { listStudents } from "@/lib/airtable";
import { upsertStudent } from "@/lib/sync";
import { getClient } from "@/lib/airtable";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const students = await listStudents(clientId);
  return NextResponse.json({ students });
}

/** Add one student by hand — for "manual" platform clients or ad-hoc additions. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const body = await req.json();
  if (!body.email || !body.student_name) {
    return NextResponse.json(
      { error: "student_name and email are required." },
      { status: 400 }
    );
  }

  await upsertStudent(client, {
    student_name: body.student_name,
    email: body.email,
    course_name: body.course_name ?? "",
    enrollment_date: body.enrollment_date ?? new Date().toISOString(),
    percent_complete: body.percent_complete,
    last_activity_date: body.last_activity_date,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
