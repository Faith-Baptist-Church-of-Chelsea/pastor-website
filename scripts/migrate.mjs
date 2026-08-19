// Applies db/schema.sql. Safe to run repeatedly — every statement is
// IF NOT EXISTS. Uses the DIRECT (unpooled) connection, which is what Neon
// recommends for schema changes.
//
//   npm run db:migrate
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!url) {
  console.error(
    "No database URL found. Run `vercel env pull .env.local` first, or set DATABASE_URL."
  );
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// Split on semicolons at end-of-line, ignoring comment-only chunks.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((l) => l.trim().startsWith("--")));

let applied = 0;
for (const statement of statements) {
  try {
    await sql.query(statement);
    applied++;
  } catch (err) {
    console.error("\nFailed on statement:\n", statement.slice(0, 200));
    throw err;
  }
}
console.log(`Applied ${applied} statements. Database is up to date.`);
