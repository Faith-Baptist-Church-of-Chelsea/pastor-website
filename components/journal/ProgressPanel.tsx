"use client";

import { computeStats, encouragement, heatmapDays } from "@/lib/journal/stats";
import type { Entry } from "@/lib/journal/store";

// Progress, shown warmly. There are no crosses, no red, no "you missed
// N days" — an unwritten day simply isn't filled in. The point is to make
// faithfulness visible, not to keep score against anyone.
export default function ProgressPanel({
  entries,
  today,
}: {
  entries: Entry[];
  today: string;
}) {
  const stats = computeStats(entries, today);
  const days = heatmapDays(entries, today);

  // Group into week columns for the grid.
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <p className="text-lg text-slate-800" style={{ fontFamily: "var(--font-display)" }}>
        {encouragement(stats)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.currentStreak} label={stats.currentStreak === 1 ? "day running" : "days running"} />
        <Stat value={stats.longestStreak} label="longest run" />
        <Stat value={stats.thisMonth} label="this month" />
        <Stat value={stats.total} label="entries in all" />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700">The last six months</h3>
        <div className="mt-3 overflow-x-auto pb-2">
          <div className="flex gap-1" role="img" aria-label={`${stats.total} days journaled in the last six months`}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((d) => (
                  <span
                    key={d.date}
                    title={
                      d.future
                        ? ""
                        : `${new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}${d.written ? " — written" : ""}`
                    }
                    className={`h-3 w-3 rounded-[3px] ${
                      d.future
                        ? "bg-transparent"
                        : d.written
                          ? "bg-brand-600"
                          : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Gaps are just gaps. Everyone has them — the only day that matters is
          the one in front of you.
        </p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
