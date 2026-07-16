import { NextRequest, NextResponse } from "next/server";
import { getStudentById, updateStudent } from "@/lib/airtable";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ student });
}

/** Mostly used to flip testimonial_positive by hand — that's a judgment call, not something the Scanner infers. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const body = await req.json();
  const student = await updateStudent(studentId, body);
  return NextResponse.json({ student });
}
