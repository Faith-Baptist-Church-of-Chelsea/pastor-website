// A single self-contained HTML file someone can keep on their own computer
// and open with no internet at all.
//
// It reads and writes exactly the same backup format as the web journal
// (format: "pastor-journal", version 1), so entries move freely between
// the two: export here, import there, and back again. Storage is
// localStorage in whatever browser opens the file — the whole point is
// that it depends on nothing.
export const dynamic = "force-static";

const HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Devotion Journal</title>
<style>
  :root { --ink:#1f2937; --gold:#a16207; --gold-dark:#854d0e; --paper:#faf7f2; --line:#e2e8f0; }
  * { box-sizing: border-box; }
  body { margin:0; background:#fff; color:var(--ink);
         font:16px/1.65 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif; }
  header { background:#020617; color:#fff; padding:20px 16px; }
  h1 { margin:0; font-family:Georgia,serif; font-size:22px; }
  header p { margin:4px 0 0; font-size:12px; color:#e5b45b; }
  main { max-width:720px; margin:0 auto; padding:20px 16px 60px; }
  label { display:block; margin-top:18px; font-weight:600; font-size:14px; }
  input, textarea, select { width:100%; margin-top:6px; padding:10px 12px; font:inherit;
    border:1px solid #cbd5e1; border-radius:8px; background:#fff; color:var(--ink); }
  textarea { min-height:110px; resize:vertical; }
  button { font:inherit; font-weight:600; padding:10px 16px; border-radius:8px; cursor:pointer;
    border:1px solid #cbd5e1; background:#fff; color:var(--ink); }
  button.primary { background:var(--gold); border-color:var(--gold); color:#fff; }
  .row { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; align-items:center; }
  .note { background:var(--paper); border-radius:8px; padding:12px; font-size:14px; margin-top:16px; }
  ul { list-style:none; padding:0; margin:16px 0 0; }
  li { border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:8px; cursor:pointer; }
  li:hover { border-color:var(--gold); }
  li b { display:block; }
  li span { font-size:14px; color:#64748b; }
  .muted { color:#64748b; font-size:13px; }
  .tabs { display:flex; gap:8px; margin-top:16px; }
  .tabs button[aria-pressed="true"] { background:var(--gold); border-color:var(--gold); color:#fff; }
</style>
</head>
<body>
<header>
  <h1>My Devotion Journal</h1>
  <p>Kept on this computer only &middot; works with no internet</p>
</header>
<main>
  <div class="tabs">
    <button id="tab-write" aria-pressed="true">Write</button>
    <button id="tab-list" aria-pressed="false">All entries</button>
  </div>

  <section id="write">
    <label>Date
      <input type="date" id="date">
    </label>
    <label>Where you read
      <input id="passage" placeholder="John 15:1-8">
    </label>
    <label>What it says
      <textarea id="observation"></textarea>
    </label>
    <label>What I&rsquo;m taking away
      <textarea id="application"></textarea>
    </label>
    <label>Prayer
      <textarea id="prayer"></textarea>
    </label>
    <div class="row">
      <button class="primary" id="save">Save this entry</button>
      <span class="muted" id="status"></span>
    </div>
  </section>

  <section id="list" hidden></section>

  <div class="note">
    <strong>Moving entries in and out.</strong>
    <div class="row">
      <button id="export">Save all entries to a file</button>
      <button id="import-btn">Load entries from a file</button>
      <input type="file" id="import" accept="application/json,.json" hidden>
    </div>
    <p class="muted" style="margin-bottom:0">
      This uses the same file format as the journal on the website, so you can
      move entries between the two. Nothing here is ever sent anywhere.
    </p>
  </div>
</main>

<script>
(function () {
  var KEY = "pastor-journal-standalone";
  var $ = function (id) { return document.getElementById(id); };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(all) { localStorage.setItem(KEY, JSON.stringify(all)); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  var all = load();
  $("date").value = todayISO();

  function show(date) {
    var e = all[date] || {};
    $("passage").value = e.passage || "";
    $("observation").value = e.observation || "";
    $("application").value = e.application || "";
    $("prayer").value = e.prayer || "";
    $("status").textContent = all[date] ? "Saved entry for this day" : "";
  }
  show($("date").value);
  $("date").addEventListener("change", function () { show(this.value); });

  $("save").addEventListener("click", function () {
    var date = $("date").value;
    if (!date) return;
    all[date] = {
      date: date,
      passage: $("passage").value,
      observation: $("observation").value,
      application: $("application").value,
      prayer: $("prayer").value,
      freeform: (all[date] && all[date].freeform) || "",
      mode: "soap",
      updatedAt: new Date().toISOString()
    };
    save(all);
    $("status").textContent = "Saved.";
    renderList();
  });

  function renderList() {
    var dates = Object.keys(all).sort().reverse();
    if (!dates.length) {
      $("list").innerHTML = "<p class='muted'>Nothing written yet.</p>";
      return;
    }
    var html = "<ul>";
    dates.forEach(function (d) {
      var e = all[d];
      var preview = (e.application || e.observation || e.freeform || "").slice(0, 90);
      html += "<li data-date='" + d + "'><b>" + d + (e.passage ? " &middot; " + escapeHtml(e.passage) : "") +
              "</b><span>" + escapeHtml(preview) + "</span></li>";
    });
    $("list").innerHTML = html + "</ul>";
    Array.prototype.forEach.call($("list").querySelectorAll("li"), function (li) {
      li.addEventListener("click", function () {
        $("date").value = li.getAttribute("data-date");
        show(li.getAttribute("data-date"));
        tab("write");
      });
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function tab(which) {
    $("write").hidden = which !== "write";
    $("list").hidden = which !== "list";
    $("tab-write").setAttribute("aria-pressed", String(which === "write"));
    $("tab-list").setAttribute("aria-pressed", String(which === "list"));
    if (which === "list") renderList();
  }
  $("tab-write").addEventListener("click", function () { tab("write"); });
  $("tab-list").addEventListener("click", function () { tab("list"); });

  $("export").addEventListener("click", function () {
    var backup = {
      format: "pastor-journal",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: Object.keys(all).sort().reverse().map(function (d) { return all[d]; })
    };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "devotion-journal-" + todayISO() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("import-btn").addEventListener("click", function () { $("import").click(); });
  $("import").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (data.format !== "pastor-journal" || !data.entries) throw new Error();
        var added = 0;
        data.entries.forEach(function (e) {
          if (!e || !e.date) return;
          var mine = all[e.date];
          if (!mine || (e.updatedAt || "") > (mine.updatedAt || "")) { all[e.date] = e; added++; }
        });
        save(all);
        renderList();
        show($("date").value);
        alert("Brought in " + added + " entries. Nothing was replaced with anything older.");
      } catch (err) {
        alert("That file doesn't look like a journal backup.");
      }
    };
    reader.readAsText(file);
    this.value = "";
  });

  renderList();
})();
</script>
</body>
</html>`;

export function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-devotion-journal.html"',
    },
  });
}
