import Link from "next/link";
import ModerationQueue from "@/components/admin/ModerationQueue";
import { dbConfigured, getPendingDevotions, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!dbConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl">Database not connected</h1>
        <p className="mt-2 text-slate-600">
          DATABASE_URL isn&rsquo;t set, so there&rsquo;s nothing to review yet.
        </p>
      </div>
    );
  }

  const [pending, stats] = await Promise.all([getPendingDevotions(), getStats()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl">Devotions</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Waiting" value={stats.pending} highlight />
        <Stat label="Published" value={stats.published} />
        <Stat label="Shared this week" value={stats.submissionsThisWeek} />
        <Stat label="Journaling this week" value={stats.activeJournalersThisWeek} />
        <Stat label="Entries this week" value={stats.entriesThisWeek} />
        <Stat label="People with the app" value={stats.totalInstalls} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Journal numbers are anonymous counts only — no one&rsquo;s private entries are
        stored or readable here.
      </p>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-xl">Waiting for review</h2>
        <Link href="/admin/published" className="text-sm font-semibold text-brand-700 hover:underline">
          Manage published →
        </Link>
      </div>
      <div className="mt-4">
        <ModerationQueue initial={pending} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight && value > 0 ? "border-brand-500 bg-white" : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
