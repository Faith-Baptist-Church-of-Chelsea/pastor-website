# Pastor Adam Summers — Website

The new pastoradamsummers.com, built with Next.js (App Router), TypeScript, and
Tailwind CSS — the same stack and editing workflow as the Faith Baptist Church
site. Deploy on Vercel. The old WordPress site stays live and untouched until
we cut over.

This README is the manual. If something here is out of date or confusing,
that's a bug — fix it or ask Claude Code to.

## Running it locally

You need Node.js 20+ (you have it via nvm). Then:

```bash
npm install    # once, or after pulling changes that touch package.json
npm run dev    # starts the site at http://localhost:3000
```

Stop it with Ctrl+C. `npm run build` checks that the site compiles for
production — run it before pushing if you've edited code by hand.

## Where things live

| What | Where |
|---|---|
| Site facts (verses, email, links) | `content/site.json` — edit this, not the components |
| About page text | `content/pages/about.mdx` |
| Sermons | `content/sermons/*.mdx` (one file per sermon) |
| Blog posts | `content/posts/*.mdx` |
| Family music | `content/music/*.mdx` |
| Shared devotions | Neon Postgres (not files) — reviewed at `/admin` |
| Journal + KJV text | `app/journal/`, `lib/journal/`, `public/kjv/` |
| Pages (one folder per page) | `app/(site)/` |
| Images | `public/images/` |
| Sermon recordings | `public/audio/sermons/` (64 kbps mono MP3 — plenty for preaching) |
| Music recordings | `public/audio/` |

## Editing content — two paths, same files

**Path 1 (browser):** run `npm run dev`, open http://localhost:3000/keystatic.
Edit Site Info, the About page, Sermons, Pastor's Desk posts, Family Music, or
Devotion Videos. Saving writes to the files under `content/` — then commit and
push.

**Path 2 (files):** edit the files under `content/` directly, commit, push.

Both paths touch the same files, so they can never disagree. Every push to
`main` redeploys the live site automatically (once Vercel is connected).

### Adding a sermon

/keystatic → Sermons → "+" → title, date, Bible passage, upload the MP3,
write a sentence or two about it → Save. The newest sermon automatically
becomes the "Latest Sermon" on the homepage.

**Audio file size:** re-encode recordings to 64 kbps mono MP3 before
uploading — sermon speech sounds fine and the files stay small:

```bash
ffmpeg -i original.mp3 -ac 1 -b:a 64k sermon-name.mp3
```

### Adding a blog post

/keystatic → Pastor's Desk (blog) → "+" → title, date, write the post → Save.
Every post ends with Pastor Summers' signature image automatically.

### Adding music or a devotion video

/keystatic → Family Music or Devotion Videos → "+". For YouTube videos, paste
just the video ID (the part after `watch?v=` in the link). The Devotions page
stays hidden from the menu until it has at least one video.

### Letting Pastor Summers edit through the live website

Right now `/keystatic` only works on a computer running the dev server
(Keystatic "local" mode). To let him edit at pastoradamsummers.com/keystatic
from any browser, switch to GitHub storage mode: set
`NEXT_PUBLIC_KEYSTATIC_MODE=github`, update the repo name in
`keystatic.config.ts`, and follow the one-time GitHub App wizard that appears
at /keystatic. His edits become git commits, same as everything else. Ask
Claude Code to do this when ready.

## Editing from any browser (how Pastor Summers edits)

Keystatic runs in **GitHub mode**: anyone whose GitHub account has access to
the `stevenabi6912-prog/pastor-website` repo can open
**`<the live site>/keystatic`** in any browser, log in with GitHub, and edit.
Every save is a git commit to `main`, which redeploys the site automatically.

Pieces involved (all set up July 2026):

- GitHub App **pastor-website-keystatic**
  (github.com/apps/pastor-website-keystatic) — created by the Keystatic
  wizard; its keys live in `.env` locally and in Vercel env vars. If the
  live-site login ever breaks, check that the app's callback URLs (GitHub →
  Settings → Developer settings → GitHub Apps → pastor-website-keystatic)
  include `https://<live domain>/api/keystatic/github/oauth/callback`.
- To give someone edit access: add their GitHub account as a collaborator on
  the repo (Settings → Collaborators). Remove them there to revoke.
- Local editing still works exactly the same at localhost:3000/keystatic.

## The email list — how it works

Visitors subscribe through the form on the homepage and /contact. Under the
hood (July 2026 build):

- **Subscribers** live in a Resend **Audience** (resend.com → Audiences) —
  no database. `/api/subscribe` adds them (honeypot + rate limit for spam).
- **Announcements**: a Vercel Cron hits `/api/announce` daily at 13:00 UTC
  (9 AM ET). It looks for sermons/posts/devotions dated in the last 14 days
  that haven't been emailed about, and sends ONE digest broadcast to the
  audience. "Already announced" is remembered in the names of past
  broadcasts, so nothing is ever sent twice. Unsubscribe links are handled
  by Resend automatically.
- So the pastor's whole workflow is: add the sermon in /keystatic → the
  site deploys → subscribers get the email the next morning. Nothing to
  remember.
- Env vars: `RESEND_API_KEY` (full access), `RESEND_AUDIENCE_ID`,
  `CRON_SECRET`, and optionally `RESEND_FROM` (defaults to Resend's shared
  test sender `onboarding@resend.dev` until pastoradamsummers.com is
  verified as a sending domain in Resend — do that at cutover so emails
  land reliably).
- If the Resend vars are missing, the form degrades gracefully to a
  "email the pastor instead" link. The Subscribe header button is still a
  mailto link on purpose (works everywhere, even in RSS readers).

## The sermon podcast

`/podcast.xml` is a full podcast RSS feed generated from every sermon that
has an uploaded recording. **One-time step still to do:** submit that URL at
podcastsconnect.apple.com and podcasters.spotify.com — after approval, new
sermons appear in people's podcast apps automatically. Cover art is
`public/images/podcast-cover.jpg`.

## Changing the photos on the site

/keystatic → **Site Photos** → click any slot, upload a new image, Save.
That covers: the homepage portrait, the homepage music photo, the About
family photo, the Music page banner, and the signature that ends every
blog post. The description under each slot says what shape works best.
Blog-post images are added inline while writing the post; event-style
graphics aren't a thing on this site.

## Little touches worth knowing about

- Every sermon and blog post has its own share image (dark + gold card) —
  pasting a link into Facebook/iMessage shows a proper preview.
- Bare scripture references in any text ("Ephesians 5:19") automatically
  become KJV BibleGateway links.
- The sermons page has Bible-book filter chips, and sermon/post pages
  cross-link related preaching and writing by book.
- Devotions can be written (just type in the "Devotion text" field), video
  (paste a YouTube ID), or both. The Devotions page stays out of the menu
  until the first one exists.
- Vercel Web Analytics is wired in (`@vercel/analytics`) and enabled —
  traffic shows in the dashboard's Analytics tab, no cookies/banners.
- New subscribers get an instant welcome email with the latest sermon
  and the podcast link.
- The sermon player has a playback-speed button and remembers where each
  listener left off (per browser, via localStorage).
- Blog posts show reading time and older/newer links; the blog also has
  an RSS feed at /feed.xml (separate from the sermon podcast feed).
- /search searches sermons, posts, devotions, and music titles —
  instant, client-side, no service behind it. (Sermon transcripts were
  built and then removed by request in July 2026 — the git history has
  them if that ever changes.)

## The devotion journal and devotion blog

Two halves of one feature, added August 2026.

**The journal (`/journal`)** is a private, installable app. Entries live in
IndexedDB on the writer's own phone — they are never uploaded, and neither
the church nor the pastor can read them. The whole KJV ships with the app
(`public/kjv/`, one file per book, ~4 MB) so scripture lookup works with no
signal. It has reading plans, streaks and a heat map, search, export/import,
and a standalone single-file copy at `/journal/standalone`.

**The devotion blog (`/devotions`)** is what people choose to share. Sharing
is only possible from a saved journal entry, requires an explicit consent
tick, and sends that one entry and nothing else.

### How moderation works

Everything shared lands in a queue at **`/admin`** (password in
`ADMIN_PASSWORD`). Nothing is public until the pastor publishes it.

- Full text is visible in the queue — no clicking into each one
- Keyboard: `J`/`K` move, `A` publish, `R` discard, `E` edit, `X` select
- Bulk publish/discard for whatever is selected
- Anything the pre-screen flagged (profanity, shouting, possible duplicate)
  sorts to the top with a marker
- Links and email addresses are rejected outright at submission
- **Rejections are silent** — nothing is sent to the contributor, ever
- `/admin/published` takes anything down in one click

One digest email a day says how many are waiting (`DEVOTION_NOTIFY_EMAIL`).
Nothing is sent on days when the queue is empty.

### Privacy, and what the server can actually see

| Thing | Where it lives | Who can read it |
|---|---|---|
| Journal entries | IndexedDB, on the device | Only the writer |
| A shared devotion | Postgres | The pastor, then everyone once published |
| Usage counts | Postgres | Aggregate totals only — a random install ID and a date, nothing else |
| Synced entries | Postgres, AES-GCM encrypted | **Nobody but the writer.** The key is derived from their passphrase and never leaves the device |

Sync is opt-in and off by default. Because the server genuinely cannot
decrypt anything, **a forgotten passphrase means the synced copy is gone
for good** — there is deliberately no reset. The setup screen says so
plainly and pushes people to save a file copy first.

### Daily reminders

Optional Web Push, off by default, chosen time. Vercel's Hobby plan only
allows once-a-day crons, but people pick their own hour, so the hourly tick
comes from GitHub Actions (`.github/workflows/reminders.yml`) hitting
`/api/cron/reminders`. **That workflow needs one repository secret:
`CRON_SECRET`, the same value as in Vercel** (repo → Settings → Secrets and
variables → Actions). On iPhones, reminders only work once the journal has
been added to the home screen — that's an Apple restriction, and the
settings screen says so.

### Database

Neon Postgres, provisioned through the Vercel Marketplace (resource
`neon-claret-compass`, free tier). Schema lives in `db/schema.sql` and is
applied with:

```bash
npm run db:migrate
```

Safe to re-run — everything is `IF NOT EXISTS`. Reads go through the
`devotions_api` view, which casts dates and ids to plain strings/numbers
(the driver otherwise hands back JS `Date` objects, which breaks slugs).

## Deploying

- Repo: github.com/stevenabi6912-prog/pastor-website (private)
- Vercel project: `pastor-website` (faith-baptist-church team)
- Live at: https://pastor-website-nine.vercel.app
- Every push to `main` deploys automatically (once the Vercel GitHub App has
  been granted access to this repo — see below). Manual deploy: `vercel deploy --prod`.

**To roll back a bad deploy:** Vercel dashboard → Deployments → find the last
good one → "… → Promote to Production".

**Domain cutover (still to do):** point pastoradamsummers.com's DNS at
Vercel, add the domain in Vercel project settings, set
`NEXT_PUBLIC_SITE_URL=https://pastoradamsummers.com`, and add
`https://pastoradamsummers.com/api/keystatic/github/oauth/callback` to the
pastor-website-keystatic GitHub App's callback URLs.

## Migration notes (July 2026)

Everything on the old WordPress site was migrated:

- **16 sermons** with dates, Bible passages, and descriptions. 9 recordings
  were MP3/M4A files hosted on the old site — they're downloaded, re-encoded,
  and now live in this repo (`public/audio/sermons/`), so they survive the
  WordPress site going away. "The Morality of Music" and "Blessings In
  Christ" live on SermonAudio and link out. The five 2016 sermons have no
  surviving audio — text only.
- **4 blog posts**, full text, with images.
- **11 music recordings** — 7 audio files (downloaded into `public/audio/`)
  and 4 YouTube videos. Note: the "Potter Knows The Clay" video has embedding
  restricted on YouTube; the embed may show "watch on YouTube".
- **All 36 devotion videos on the old site were deleted from YouTube** (they
  404). Nothing to migrate — the Devotions page is ready for new ones.
- The old site's Facebook link: facebook.com/pastoradamsummers.

## Environment variables

Set in Vercel (Project → Settings → Environment Variables). Everything
except `ADMIN_PASSWORD` and the GitHub Actions secret is already in place.

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL — `https://pastoradamsummers.com`. Feeds share links, the podcast feed, and emails |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon Postgres (added automatically by the Marketplace integration) |
| `ADMIN_PASSWORD` | The password for `/admin`. Change it here and it changes everywhere |
| `DEVOTION_NOTIFY_EMAIL` | Who gets the daily "N waiting for review" email |
| `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` | Subscriber list and all outgoing email |
| `CRON_SECRET` | Protects `/api/announce` and `/api/cron/reminders`. Must also be a GitHub Actions repository secret |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push reminders |
| `JOURNAL_SYNC_SECRET` | Signs sync sessions. Not an encryption key — it cannot decrypt anything |
| `KEYSTATIC_*` | The `/keystatic` GitHub login |

## DNS

`pastoradamsummers.com` already points at Vercel and serves this site. The
only DNS work left is for email deliverability — until it's done, mail goes
out from Resend's shared test sender, which works but is more likely to land
in spam.

**To send from the real domain:** add the domain in Resend (resend.com →
Domains), then add the records it gives you at the registrar. They look like:

| Type | Name | Value |
|---|---|---|
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `resend._domainkey` | (the DKIM key Resend shows you) |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

Resend shows the exact values — use theirs, not these, since the DKIM key is
unique. Once verified, set `RESEND_FROM` to something like
`Pastor Adam Summers <pastor@pastoradamsummers.com>`.

## Known notes

- `public/audio/` is ~190 MB. That's fine for git and Vercel (largest file
  ~19 MB), but keep future uploads at 64 kbps mono so it stays that way.
- Old WordPress URLs (`/musical_specials/...`, `/sermon-archives/`) aren't
  redirected. If search traffic matters at cutover, add redirects in
  `next.config.ts`.
