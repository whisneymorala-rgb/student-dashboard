"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  // Starts null on both server and client so the first client render matches
  // the server's — then syncs to the real value post-mount. This effect is
  // the standard hydration-safe pattern for reading localStorage/matchMedia,
  // not a synchronization loop, so the setState-in-effect lint rule is
  // suppressed deliberately here.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  if (!theme) return <div className="h-8 w-8" />;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
