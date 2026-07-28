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
| Devotion videos | `content/devotions/*.mdx` |
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

## Subscribe / contact — how it works

There is deliberately no backend yet. "Subscribe" and "Contact" buttons open
the visitor's own email app addressed to the pastor (address lives in
`content/site.json`), pre-filled with a subject line. Pastor Summers keeps his
update list wherever he keeps it today (his email). If a real mailing list is
ever wanted, Resend + a small form is the church-site pattern to copy.

## Deploying (not yet set up)

1. Push this repo to GitHub.
2. Import it in Vercel → every push to `main` deploys automatically.
3. When ready to cut over: point pastoradamsummers.com's DNS at Vercel and
   set `NEXT_PUBLIC_SITE_URL=https://pastoradamsummers.com`.

**To roll back a bad deploy:** Vercel dashboard → Deployments → find the last
good one → "… → Promote to Production".

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

## Known notes

- `public/audio/` is ~190 MB. That's fine for git and Vercel (largest file
  ~19 MB), but keep future uploads at 64 kbps mono so it stays that way.
- Old WordPress URLs (`/musical_specials/...`, `/sermon-archives/`) aren't
  redirected. If search traffic matters at cutover, add redirects in
  `next.config.ts`.
