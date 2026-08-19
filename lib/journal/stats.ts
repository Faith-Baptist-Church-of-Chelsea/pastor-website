// Streaks and the heat map — all computed on the device, from entries
// that never leave it.
//
// Tone rule for anything built on these numbers: consistency is worth
// celebrating, but a broken streak is not a failure. Missing days is
// normal. Nothing here returns anything that could be rendered as a
// penalty, and the copy that uses it should welcome people back rather
// than scold them.
import type { Entry } from "./store";

export type JournalStats = {
  currentStreak: number;
  longestStreak: number;
  total: number;
  thisMonth: number;
  wroteToday: boolean;
  daysSinceLast: number | null;
};

const dayMs = 24 * 60 * 60 * 1000;

function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function computeStats(entries: Entry[], today: string): JournalStats {
  const dates = [...new Set(entries.map((e) => e.date))].sort(); // oldest first
  if (dates.length === 0) {
    return {
      currentStreak: 0, longestStreak: 0, total: 0, thisMonth: 0,
      wroteToday: false, daysSinceLast: null,
    };
  }

  // Longest run of consecutive days, ever.
  let longest = 1, run = 1;
  for (let i = 1; i < dates.length; i++) {
    const gap = (toUTC(dates[i]) - toUTC(dates[i - 1])) / dayMs;
    run = gap === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current streak counts back from today — and from yesterday too, so
  // that someone who hasn't written *yet* today doesn't watch their
  // streak evaporate before breakfast.
  const set = new Set(dates);
  const todayMs = toUTC(today);
  let current = 0;
  const startOffset = set.has(today) ? 0 : set.has(isoFrom(todayMs - dayMs)) ? 1 : -1;
  if (startOffset >= 0) {
    for (let i = startOffset; ; i++) {
      if (!set.has(isoFrom(todayMs - i * dayMs))) break;
      current++;
    }
  }

  const last = dates[dates.length - 1];
  const daysSinceLast = Math.round((todayMs - toUTC(last)) / dayMs);
  const monthPrefix = today.slice(0, 7);

  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    total: dates.length,
    thisMonth: dates.filter((d) => d.startsWith(monthPrefix)).length,
    wroteToday: set.has(today),
    daysSinceLast,
  };
}

function isoFrom(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Calendar grid for the heat map: the last `weeks` weeks, Sunday-first. */
export function heatmapDays(entries: Entry[], today: string, weeks = 26) {
  const written = new Set(entries.map((e) => e.date));
  const todayMs = toUTC(today);
  const todayDow = new Date(todayMs).getUTCDay();
  // End on the Saturday of this week so columns line up.
  const endMs = todayMs + (6 - todayDow) * dayMs;
  const days: { date: string; written: boolean; future: boolean }[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const ms = endMs - i * dayMs;
    const date = isoFrom(ms);
    days.push({ date, written: written.has(date), future: ms > todayMs });
  }
  return days;
}

/**
 * A short, honest line about where they are. Never guilt — someone
 * returning after a long gap should feel welcomed, not measured.
 */
export function encouragement(stats: JournalStats): string {
  if (stats.total === 0) return "Your first entry is the only hard one. Start today.";
  if (stats.wroteToday) {
    if (stats.currentStreak === 1) return "Written today. That's the whole job.";
    return `Written today — ${stats.currentStreak} days running.`;
  }
  if (stats.currentStreak > 0) return `${stats.currentStreak} days running. Today's page is waiting.`;
  if (stats.daysSinceLast !== null && stats.daysSinceLast > 14) {
    return "Good to see you back. Today is a fine place to pick it up again.";
  }
  if (stats.daysSinceLast !== null && stats.daysSinceLast > 1) {
    return "Welcome back — no catching up needed, just today.";
  }
  return "Today's page is waiting.";
}
