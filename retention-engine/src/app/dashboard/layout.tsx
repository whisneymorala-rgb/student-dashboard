import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-1)]/90 px-6 py-3 backdrop-blur">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Retention Engine
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
