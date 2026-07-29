// Shared HTML email template — used by the subscribe welcome email and
// the announcement digest so everything from the site looks the same.
//
// Email HTML is its own world: tables for layout, inline styles only,
// max ~600px wide, system serif stack (webfonts are unreliable in mail
// clients). Colors mirror the site: slate-950 header, warm gold accents.

const GOLD = "#e5b45b";
const GOLD_DARK = "#a16207";
const INK = "#1f2937";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export type EmailItem = {
  kind: string; // "New sermon", "From the Pastor's Desk", …
  title: string;
  url: string;
  detail?: string; // passage or date line
};

export function renderEmail(opts: {
  preheader: string; // hidden preview line shown next to the subject
  heading: string;
  intro: string; // may contain simple inline HTML
  items?: EmailItem[];
  cta?: { label: string; url: string };
  footerNote: string; // may contain simple inline HTML (unsubscribe link etc.)
}): string {
  const items = (opts.items ?? [])
    .map(
      (i) => `
      <tr>
        <td style="padding:18px 28px;border-top:1px solid #f3f4f6;">
          <div style="font-family:${SANS};font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD_DARK};padding-bottom:6px;">
            ${esc(i.kind)}
          </div>
          <a href="${i.url}" style="font-family:${SERIF};font-size:20px;line-height:1.3;font-weight:bold;color:${INK};text-decoration:none;">
            ${esc(i.title)}
          </a>
          ${
            i.detail
              ? `<div style="font-family:${SANS};font-size:13px;color:${MUTED};padding-top:5px;">${esc(i.detail)}</div>`
              : ""
          }
        </td>
      </tr>`
    )
    .join("");

  const cta = opts.cta
    ? `
      <tr>
        <td align="center" style="padding:8px 28px 30px;">
          <a href="${opts.cta.url}"
             style="display:inline-block;background:${GOLD_DARK};color:#ffffff;font-family:${SANS};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 34px;border-radius:8px;">
            ${esc(opts.cta.label)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pastor Adam Summers</title>
</head>
<body style="margin:0;padding:0;background:#f3f1ec;">
  <!-- Preheader: invisible in the body, shows as the preview line -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${esc(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ec;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.08);">

          <!-- Header band -->
          <tr>
            <td style="background:#020617;padding:34px 28px 30px;" align="center">
              <div style="width:46px;height:4px;background:${GOLD};font-size:0;line-height:0;">&nbsp;</div>
              <div style="font-family:${SERIF};font-size:27px;font-weight:bold;color:#ffffff;padding-top:16px;">
                Pastor Adam Summers
              </div>
              <div style="font-family:${SERIF};font-style:italic;font-size:14px;color:${GOLD};padding-top:8px;">
                &ldquo;For to me to live is Christ, and to die is gain.&rdquo;&nbsp; &mdash;&nbsp;Philippians&nbsp;1:21
              </div>
            </td>
          </tr>

          <!-- Heading + intro -->
          <tr>
            <td style="padding:30px 28px 6px;">
              <div style="font-family:${SERIF};font-size:22px;font-weight:bold;color:${INK};">
                ${esc(opts.heading)}
              </div>
              <div style="font-family:${SANS};font-size:15px;line-height:1.6;color:#374151;padding-top:10px;padding-bottom:14px;">
                ${opts.intro}
              </div>
            </td>
          </tr>

          ${items}
          ${cta}

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf8;border-top:1px solid #f3f4f6;padding:20px 28px;" align="center">
              <div style="font-family:${SANS};font-size:12px;line-height:1.6;color:${FAINT};">
                ${opts.footerNote}
              </div>
            </td>
          </tr>
        </table>

        <div style="font-family:${SANS};font-size:11px;color:#b0aca3;padding-top:16px;">
          Pastor M. Adam Summers &middot; Faith Baptist Church &middot; Chelsea, Michigan
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
