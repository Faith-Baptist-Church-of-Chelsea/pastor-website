-- Devotion journal + moderated devotion blog.
--
-- Everything here is either PUBLIC-BY-INTENT (a devotion someone chose to
-- share) or ANONYMOUS COUNTERS. Private journal entries never reach this
-- database — they live in IndexedDB on the writer's own device. The only
-- exception is sync_blobs, which stores ciphertext the server cannot read.
--
-- Apply with: npm run db:migrate   (safe to re-run — everything is IF NOT EXISTS)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Shared devotions (the moderation queue and the public blog are the same
-- table at different statuses).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devotions (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT UNIQUE,              -- assigned on approval, used in the public URL

  -- What the contributor wrote
  entry_date    DATE NOT NULL,            -- the date they journaled, not the submit date
  passage       TEXT NOT NULL DEFAULT '', -- free text, e.g. "John 15:1-8"
  books         TEXT[] NOT NULL DEFAULT '{}', -- parsed Bible books, for filtering
  reflection    TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT 'Anonymous',

  -- Contact, for removal requests only. Never displayed publicly.
  contact_email TEXT,

  -- Moderation
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  flags         TEXT[] NOT NULL DEFAULT '{}', -- pre-screen findings; non-empty sorts to top
  pastor_note   TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at    TIMESTAMPTZ,

  -- Anti-abuse. ip_hash is HMAC(ip, CRON_SECRET) — never the raw address.
  ip_hash       TEXT,
  fingerprint   TEXT  -- normalized text hash, for near-duplicate detection
);

CREATE INDEX IF NOT EXISTS devotions_status_idx   ON devotions (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS devotions_public_idx   ON devotions (status, entry_date DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS devotions_books_idx    ON devotions USING GIN (books);
CREATE INDEX IF NOT EXISTS devotions_search_idx   ON devotions USING GIN (reflection gin_trgm_ops);
CREATE INDEX IF NOT EXISTS devotions_fp_idx       ON devotions (fingerprint);
CREATE INDEX IF NOT EXISTS devotions_iphash_idx   ON devotions (ip_hash, submitted_at DESC);

-- ---------------------------------------------------------------------------
-- Anonymous usage pings. One row per install per day, nothing else.
-- No content, no passage, no name, no email, no IP.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_pings (
  install_id  UUID NOT NULL,
  ping_date   DATE NOT NULL,
  PRIMARY KEY (install_id, ping_date)
);

CREATE INDEX IF NOT EXISTS journal_pings_date_idx ON journal_pings (ping_date DESC);

-- ---------------------------------------------------------------------------
-- Web Push subscriptions for the optional daily reminder.
-- Pseudonymous: tied to the anonymous install id, never to a person.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subs (
  install_id   UUID PRIMARY KEY,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  reminder_utc SMALLINT NOT NULL,  -- hour 0-23 in UTC, converted from their local pick
  minute_utc   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_on DATE                -- so a given install gets at most one nudge per day
);

CREATE INDEX IF NOT EXISTS push_subs_time_idx ON push_subs (reminder_utc, minute_utc);

-- ---------------------------------------------------------------------------
-- Opt-in encrypted sync. The server stores ciphertext and nothing else:
-- no plaintext entries, no passphrase, no key. Losing the passphrase means
-- the data is unrecoverable — that is the point.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_accounts (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  -- Verifier proves the client knows the passphrase without revealing it:
  -- a second, separately-salted derivation. Never the encryption key itself.
  verifier_hash TEXT NOT NULL,
  kdf_salt      TEXT NOT NULL,   -- client-side key derivation salt (public by design)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sync_blobs (
  account_id  BIGINT NOT NULL REFERENCES sync_accounts(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL,      -- plaintext date only, so sync can merge without decrypting
  ciphertext  TEXT NOT NULL,      -- AES-GCM payload, base64
  iv          TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted     BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (account_id, entry_date)
);

CREATE INDEX IF NOT EXISTS sync_blobs_updated_idx ON sync_blobs (account_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Read view. Postgres hands DATE/TIMESTAMPTZ back as JS Date objects through
-- the driver, which breaks slug building and date formatting downstream, so
-- every read goes through this view and gets plain ISO strings instead.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS devotions_api;

CREATE VIEW devotions_api AS
  SELECT
    id::int AS id, slug,
    entry_date::text   AS entry_date,
    passage, books, reflection, display_name, contact_email, status, flags,
    pastor_note,
    submitted_at::text AS submitted_at
  FROM devotions;
