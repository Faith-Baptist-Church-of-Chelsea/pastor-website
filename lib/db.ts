// Database access (Neon Postgres, provisioned through the Vercel Marketplace).
//
// Only three things live in this database: shared devotions (which people
// deliberately submitted for publication), anonymous counters, and opt-in
// sync ciphertext the server cannot read. Private journal entries never
// touch it — they stay in IndexedDB on the writer's own device.
import "server-only";
import { neon } from "@neondatabase/serverless";

// Pooled connection — correct for serverless functions. Migrations use the
// unpooled URL instead (see scripts/migrate.mjs).
export const sql = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "");

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export type DevotionStatus = "pending" | "approved" | "rejected" | "removed";

export type Devotion = {
  id: number;
  slug: string | null;
  entry_date: string;
  passage: string;
  books: string[];
  reflection: string;
  display_name: string;
  contact_email: string | null;
  status: DevotionStatus;
  flags: string[];
  pastor_note: string | null;
  submitted_at: string;
};

/** Approved devotions for the public blog, newest first. */
export async function getPublishedDevotions(opts: {
  limit: number;
  offset?: number;
  book?: string;
}): Promise<Devotion[]> {
  const { limit, offset = 0, book } = opts;
  const rows = book
    ? await sql`
        SELECT * FROM devotions_api
        WHERE status = 'approved' AND ${book} = ANY(books)
        ORDER BY entry_date DESC, id DESC
        LIMIT ${limit} OFFSET ${offset}`
    : await sql`
        SELECT * FROM devotions_api
        WHERE status = 'approved'
        ORDER BY entry_date DESC, id DESC
        LIMIT ${limit} OFFSET ${offset}`;
  return rows as Devotion[];
}

export async function countPublishedDevotions(book?: string): Promise<number> {
  const rows = book
    ? await sql`SELECT COUNT(*)::int AS n FROM devotions WHERE status = 'approved' AND ${book} = ANY(books)`
    : await sql`SELECT COUNT(*)::int AS n FROM devotions WHERE status = 'approved'`;
  return (rows[0] as { n: number }).n;
}

export async function getDevotionBySlug(slug: string): Promise<Devotion | null> {
  const rows = await sql`
    SELECT * FROM devotions_api WHERE slug = ${slug} AND status = 'approved' LIMIT 1`;
  return (rows[0] as Devotion) ?? null;
}

/** Every book that has at least one published devotion, with counts. */
export async function getPublishedBooks(): Promise<{ book: string; n: number }[]> {
  const rows = await sql`
    SELECT UNNEST(books) AS book, COUNT(*)::int AS n
    FROM devotions WHERE status = 'approved'
    GROUP BY book ORDER BY n DESC, book ASC`;
  return rows as { book: string; n: number }[];
}

/** Full-text-ish search across published devotions (used by /search). */
export async function searchPublishedDevotions(query: string, limit = 20) {
  const q = `%${query.trim()}%`;
  const rows = await sql`
    SELECT slug, entry_date, passage, display_name, reflection
    FROM devotions_api
    WHERE status = 'approved' AND (reflection ILIKE ${q} OR passage ILIKE ${q})
    ORDER BY entry_date DESC
    LIMIT ${limit}`;
  return rows as Pick<
    Devotion,
    "slug" | "entry_date" | "passage" | "display_name" | "reflection"
  >[];
}

/** The moderation queue: flagged first, then oldest first. */
export async function getPendingDevotions(): Promise<Devotion[]> {
  const rows = await sql`
    SELECT * FROM devotions_api
    WHERE status = 'pending'
    ORDER BY (CARDINALITY(flags) > 0) DESC, submitted_at ASC`;
  return rows as Devotion[];
}

export async function countPending(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS n FROM devotions WHERE status = 'pending'`;
  return (rows[0] as { n: number }).n;
}

/** Aggregate, content-free numbers for the pastor's dashboard. */
export async function getStats() {
  const [journalers, entriesWeek, installs, pendingRow, publishedRow, weekSubs] =
    await Promise.all([
      sql`SELECT COUNT(DISTINCT install_id)::int AS n FROM journal_pings WHERE ping_date > CURRENT_DATE - 7`,
      sql`SELECT COUNT(*)::int AS n FROM journal_pings WHERE ping_date > CURRENT_DATE - 7`,
      sql`SELECT COUNT(DISTINCT install_id)::int AS n FROM journal_pings`,
      sql`SELECT COUNT(*)::int AS n FROM devotions WHERE status = 'pending'`,
      sql`SELECT COUNT(*)::int AS n FROM devotions WHERE status = 'approved'`,
      sql`SELECT COUNT(*)::int AS n FROM devotions WHERE submitted_at > now() - INTERVAL '7 days'`,
    ]);
  const n = (r: unknown) => (r as { n: number }[])[0].n;
  return {
    activeJournalersThisWeek: n(journalers),
    entriesThisWeek: n(entriesWeek),
    totalInstalls: n(installs),
    pending: n(pendingRow),
    published: n(publishedRow),
    submissionsThisWeek: n(weekSubs),
  };
}
