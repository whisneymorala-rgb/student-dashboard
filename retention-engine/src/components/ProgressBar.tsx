export function ProgressBar({ percent }: { percent: number | null }) {
  if (percent == null) {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }
  const clamped = Math.max(0, Math.min(100, percent));
  const hue = clamped < 33 ? "#d0602f" : clamped < 66 ? "#c98500" : "#0ca30c";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--gridline)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: hue }}
        />
      </div>
      <span className="tabular-nums text-xs text-[var(--text-secondary)]">{clamped}%</span>
    </div>
  );
}
