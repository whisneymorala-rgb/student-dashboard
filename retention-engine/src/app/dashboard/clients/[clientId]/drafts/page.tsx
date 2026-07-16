import { notFound } from "next/navigation";
import { getClient, getStudentById, listDrafts } from "@/lib/airtable";
import { DraftsBoard } from "@/components/DraftsBoard";

export const dynamic = "force-dynamic";

export default async function DraftsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const drafts = await listDrafts(clientId, "pending_review");
  const withStudents = await Promise.all(
    drafts.map(async (d) => {
      const student = await getStudentById(d.student_id);
      return {
        ...d,
        studentName: student?.student_name ?? "Unknown student",
        studentEmail: student?.email ?? "",
      };
    })
  );

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        {drafts.length} draft{drafts.length === 1 ? "" : "s"} waiting for review. Approving sends
        the email and writes the guard fields back to Airtable immediately.
      </p>
      <DraftsBoard drafts={withStudents} />
    </div>
  );
}
