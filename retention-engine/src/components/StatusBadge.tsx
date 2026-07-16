import type { StudentStatus } from "@/lib/types";

const LABEL: Record<StudentStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
  "at-risk": "At-risk",
  inactive: "Inactive",
  completed: "Completed",
};

const VAR: Record<StudentStatus, string> = {
  onboarding: "--status-onboarding",
  active: "--status-active",
  "at-risk": "--status-at-risk",
  inactive: "--status-inactive",
  completed: "--status-completed",
};

export function StatusBadge({ status }: { status: StudentStatus }) {
  const color = `var(${VAR[status]})`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ color, borderColor: color, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {LABEL[status]}
    </span>
  );
}
