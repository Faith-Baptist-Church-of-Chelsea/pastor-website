// Keystatic admin panel configuration.
//
// Keystatic is a git-based CMS: everything edited at /keystatic is written
// to the same files under content/ that you can also edit by hand, so the
// two editing paths can never drift apart.
//
// storage "local" = edits write straight to files on the machine running
// the site. For volunteers/Pastor Summers to edit through the DEPLOYED
// site, switch to GitHub storage — same one-time setup as the church site
// (set NEXT_PUBLIC_KEYSTATIC_MODE=github and fill in the repo below).
import { config, fields, singleton, collection } from "@keystatic/core";

// The seal, shown in the editor's sidebar header. Keystatic offers exactly
// two ways to make its UI feel like ours — this mark and the sidebar
// grouping below — so both are used. Its colours and type are its own.
function BrandMark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/logo.png" alt="" width={28} height={28} style={{ display: "block" }} />;
}

export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_MODE === "github"
      ? { kind: "github", repo: "Faith-Baptist-Church-of-Chelsea/pastor-website" }
      : { kind: "local" },

  ui: {
    brand: { name: "Pastor Adam Summers", mark: BrandMark },
    // Sidebar groups, in the order the pastor thinks about them.
    navigation: {
      "Preaching & writing": ["sermons", "posts"],
      "Music & photos": ["music", "photos"],
      "The site itself": ["site", "about"],
    },
  },

  singletons: {
    // Edits content/site.json — name, verses, email, links.
    site: singleton({
      label: "Site Info (verses, email, links)",
      path: "content/site",
      format: { data: "json" },
      schema: {
        name: fields.text({ label: "Site name" }),
        verse: fields.object(
          {
            text: fields.text({ label: "Verse text", multiline: true }),
            reference: fields.text({ label: "Reference" }),
          },
          { label: "Main verse (shown in the header/hero)" }
        ),
        secondaryVerse: fields.object(
          {
            text: fields.text({ label: "Verse text", multiline: true }),
            reference: fields.text({ label: "Reference" }),
          },
          { label: "Second verse (shown on the homepage)" }
        ),
        email: fields.text({
          label: "Email address",
          description: "Where the Contact and Subscribe buttons send mail",
        }),
        facebook: fields.url({ label: "Facebook link" }),
        church: fields.object(
          {
            name: fields.text({ label: "Church name" }),
            url: fields.url({ label: "Church website" }),
            city: fields.text({ label: "City, State" }),
          },
          { label: "Church" }
        ),
        subscribeBlurb: fields.text({
          label: "Subscribe invitation",
          description: "The sentence inviting people to subscribe to updates",
          multiline: true,
        }),
      },
    }),

    // The About page body → content/pages/about.mdx
    about: singleton({
      label: "About page",
      path: "content/pages/about",
      format: { contentField: "body" },
      schema: {
        body: fields.mdx({ label: "About Pastor Summers" }),
      },
    }),

    // The photos used across the site → content/photos.json
    // Uploading a new image here replaces it on the live site.
    photos: singleton({
      label: "Site Photos",
      path: "content/photos",
      format: { data: "json" },
      schema: {
        hero: fields.image({
          label: "Homepage photo (Pastor Summers)",
          description: "Tall portrait works best (roughly 2:3)",
          directory: "public/images",
          publicPath: "/images/",
        }),
        music: fields.image({
          label: "Homepage music photo (Adam & Melody)",
          description: "Wide photo (roughly 3:2)",
          directory: "public/images",
          publicPath: "/images/",
        }),
        family: fields.image({
          label: "About page family photo",
          directory: "public/images",
          publicPath: "/images/",
        }),
        musicHeader: fields.image({
          label: "Music page header photo",
          description: "Very wide banner (roughly 2:1)",
          directory: "public/images",
          publicPath: "/images/",
        }),
        signature: fields.image({
          label: "Signature image (ends every blog post)",
          directory: "public/images",
          publicPath: "/images/",
        }),
      },
    }),
  },

  collections: {
    // Sermons → content/sermons/*.mdx
    sermons: collection({
      label: "Sermons",
      path: "content/sermons/*",
      slugField: "title",
      format: { contentField: "description" },
      schema: {
        title: fields.slug({ name: { label: "Sermon title" } }),
        date: fields.date({ label: "Date preached", validation: { isRequired: true } }),
        passage: fields.text({
          label: "Bible passage",
          description: "e.g. \"Ephesians 5:19, Colossians 3:16\"",
        }),
        duration: fields.text({
          label: "Length",
          description: "e.g. \"53 minutes\" — optional",
        }),
        audioFile: fields.file({
          label: "Audio recording",
          description: "Upload the sermon MP3 — it plays right on the page",
          directory: "public/audio/sermons",
          publicPath: "/audio/sermons/",
        }),
        audioUrl: fields.url({
          label: "External audio link (optional)",
          description: "A SermonAudio (or similar) link — used when there's no uploaded recording",
        }),
        videoUrl: fields.url({
          label: "Video link (optional)",
          description: "A YouTube link, if the sermon is on video",
        }),
        description: fields.mdx({ label: "About this sermon" }),
      },
    }),

    // Blog posts (Pastor's Desk) → content/posts/*.mdx
    posts: collection({
      label: "Pastor's Desk (blog)",
      path: "content/posts/*",
      slugField: "title",
      format: { contentField: "body" },
      schema: {
        title: fields.slug({ name: { label: "Post title" } }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        body: fields.mdx({ label: "The post" }),
      },
    }),

    // Special music → content/music/*.mdx
    music: collection({
      label: "Family Music",
      path: "content/music/*",
      slugField: "title",
      format: { contentField: "note" },
      schema: {
        title: fields.slug({ name: { label: "Song title" } }),
        singers: fields.text({
          label: "Who sings it",
          description: "e.g. \"Adam & Melody\" — optional, shown under the title",
        }),
        order: fields.integer({
          label: "Display order",
          description: "Lower numbers appear first on the Music page",
          defaultValue: 99,
        }),
        audio: fields.file({
          label: "Audio file",
          description: "An .m4a or .mp3 recording (leave empty if it's a video)",
          directory: "public/audio",
          publicPath: "/audio/",
        }),
        youtube: fields.text({
          label: "YouTube video ID",
          description:
            "Just the ID — the part after \"watch?v=\" in the YouTube link (leave empty if it's audio)",
        }),
        note: fields.mdx({ label: "Note (optional)" }),
      },
    }),

  },
});
