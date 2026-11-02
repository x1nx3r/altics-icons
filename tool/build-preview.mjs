import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const ui = await import("../dist/esm/index.js");
const mono = await import("../dist/esm/tech/mono/index.js");
const color = await import("../dist/esm/tech/color/index.js");

const manifest = JSON.parse(readFileSync(new URL("./tech-icons.json", import.meta.url), "utf8"));
const categoryByName = new Map(manifest.map((entry) => [`${entry.name}Icon`, entry.category]));

const SET_LABELS = { ui: "UI", mono: "Tech mono", color: "Tech color" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[character];
  });
}

// The generated components already namespace ids by component name. Prefix
// them by set as well, because both tech sets can show the same icon on the
// "All" tab.
function namespaceIds(html, prefix) {
  const ids = new Set();
  let out = html.replace(/\bid="([^"]+)"/g, (match, id) => {
    ids.add(id);
    return `id="${prefix}-${id}"`;
  });
  for (const id of ids) {
    out = out
      .split(`url(#${id})`)
      .join(`url(#${prefix}-${id})`)
      .split(`href="#${id}"`)
      .join(`href="#${prefix}-${id}"`);
  }
  return out;
}

function makeItem(name, set, Icon) {
  const html = namespaceIds(renderToStaticMarkup(createElement(Icon, { size: 32 })), set);
  const category = set === "ui" ? null : categoryByName.get(name) ?? null;
  const importPath =
    set === "ui"
      ? `@x1nx3r/altics-react-icons/icons/${name}`
      : set === "mono"
        ? `@x1nx3r/altics-react-icons/tech/${name}`
        : `@x1nx3r/altics-react-icons/tech/color/${name}`;

  return { name, set, category, importPath, html };
}

const items = [
  ...Object.keys(ui)
    .sort()
    .map((name) => makeItem(name, "ui", ui[name])),
  ...Object.keys(mono)
    .sort()
    .map((name) => makeItem(name, "mono", mono[name])),
  ...Object.keys(color)
    .sort()
    .map((name) => makeItem(name, "color", color[name])),
];

const counts = {
  all: items.length,
  ui: items.filter((item) => item.set === "ui").length,
  mono: items.filter((item) => item.set === "mono").length,
  color: items.filter((item) => item.set === "color").length,
};

const cards = items
  .map((item) => {
    const category = item.category ?? "";
    const badge = item.category ?? "UI";
    const search = `${item.name} ${item.category ?? ""} ${SET_LABELS[item.set]}`.toLowerCase();

    return `<button class="card" type="button" data-name="${escapeHtml(item.name)}" data-set="${item.set}" data-category="${escapeHtml(category)}" data-search="${escapeHtml(search)}" data-import="${escapeHtml(item.importPath)}" title="Copy ${escapeHtml(item.name)} — import from ${escapeHtml(item.importPath)}">
  <span class="badge">${escapeHtml(badge)}</span>
  <span class="art">${item.html}</span>
  <span class="name">${escapeHtml(item.name)}</span>
</button>`;
  })
  .join("\n");

const categories = [
  ["language", "Languages"],
  ["framework", "Frameworks"],
  ["database", "Databases"],
  ["cloud", "Cloud / DevOps"],
  ["tool", "Tools"],
];

const css = `
:root {
  --bg: #f5f6f8;
  --panel: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --accent: #4f46e5;
  --accent-soft: #eef2ff;
  --accent-strong: #3730a3;
  --badge: #f1f5f9;
  --icon-color: #0f172a;
  --checker-a: #eef1f5;
  --checker-b: #ffffff;
  --shadow: rgb(15 23 42 / 0.08);
}
html[data-theme="dark"] {
  --bg: #0b0f17;
  --panel: #121826;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --border: #1f2937;
  --accent: #818cf8;
  --accent-soft: #1e1b4b;
  --accent-strong: #c7d2fe;
  --badge: #1f2937;
  --icon-color: #f3f4f6;
  --checker-a: #1a2233;
  --checker-b: #0f1521;
  --shadow: rgb(0 0 0 / 0.35);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
[hidden] { display: none !important; }
header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(14px);
}
.wrap { max-width: 1440px; margin: 0 auto; padding: 16px 24px 12px; }
.top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
h1 { margin: 0; font-size: 20px; letter-spacing: -0.02em; }
h1 .tag { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-strong); background: var(--accent-soft); padding: 3px 7px; border-radius: 999px; vertical-align: 3px; margin-left: 6px; }
.sub { margin: 3px 0 0; color: var(--muted); font-size: 12px; }
.theme-controls { display: flex; align-items: center; gap: 10px; padding-top: 2px; }
.check { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12px; cursor: pointer; user-select: none; }
.check input { accent-color: var(--accent); }
.ghost, select, #search, .size {
  font: inherit;
  color: var(--text);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 9px;
}
.ghost { padding: 7px 11px; font-size: 12px; cursor: pointer; }
.ghost:hover { border-color: var(--accent); }
.controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
#search { flex: 1 1 240px; min-width: 200px; max-width: 420px; padding: 8px 12px; font-size: 13px; outline: none; }
#search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.tabs { display: flex; gap: 3px; padding: 3px; border: 1px solid var(--border); border-radius: 10px; background: var(--panel); overflow-x: auto; }
.tab { border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 12px; padding: 6px 10px; border-radius: 7px; cursor: pointer; white-space: nowrap; }
.tab span { opacity: 0.65; margin-left: 3px; font-variant-numeric: tabular-nums; }
.tab.active { background: var(--accent-soft); color: var(--accent-strong); font-weight: 600; }
select { padding: 7px 9px; font-size: 12px; cursor: pointer; }
select:disabled { opacity: 0.45; cursor: not-allowed; }
.size { display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px; font-size: 12px; color: var(--muted); }
.size input { width: 96px; accent-color: var(--accent); }
.size output { min-width: 38px; color: var(--text); font-variant-numeric: tabular-nums; text-align: right; }
.meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; color: var(--muted); font-size: 11px; }
.hint { opacity: 0.8; }
main { --icon-size: 32px; max-width: 1440px; margin: 0 auto; padding: 18px 24px 80px; display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 10px; }
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 10px 11px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease;
  content-visibility: auto;
  contain-intrinsic-size: 132px 140px;
}
.card:hover { border-color: var(--accent); box-shadow: 0 6px 20px var(--shadow); transform: translateY(-1px); }
.card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.art { display: grid; place-items: center; width: 100%; min-height: calc(var(--icon-size) + 26px); border-radius: 8px; color: var(--icon-color); }
.art svg { display: block; width: var(--icon-size); height: var(--icon-size); }
body.checker .art {
  background-image: repeating-conic-gradient(var(--checker-a) 0% 25%, var(--checker-b) 0% 50%);
  background-size: 16px 16px;
}
.name { width: 100%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-clamp: 2; overflow: hidden; overflow-wrap: anywhere; line-height: 1.35; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; }
.badge { position: absolute; top: 6px; right: 6px; max-width: calc(100% - 12px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); background: var(--badge); border-radius: 999px; padding: 2px 6px; font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.empty { max-width: 1440px; margin: 40px auto; padding: 0 24px; color: var(--muted); text-align: center; font-size: 13px; }
.toast { position: fixed; left: 50%; bottom: 24px; z-index: 50; transform: translate(-50%, 12px); opacity: 0; pointer-events: none; background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px; font-size: 12px; transition: opacity 0.15s ease, transform 0.15s ease; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 640px) {
  .wrap { padding: 12px 14px 10px; }
  main { padding: 14px 14px 60px; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
  .meta .hint { display: none; }
  #search { max-width: none; }
}
`;

const client = `
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var search = document.getElementById("search");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var category = document.getElementById("category");
  var size = document.getElementById("size");
  var sizeLabel = document.getElementById("size-label");
  var count = document.getElementById("count");
  var grid = document.getElementById("grid");
  var themeButton = document.getElementById("theme");
  var checker = document.getElementById("checker");
  var empty = document.getElementById("empty");
  var toast = document.getElementById("toast");
  var activeSet = "all";
  var toastTimer = null;

  function readStoredTheme() {
    try { return localStorage.getItem("altics-preview-theme"); } catch (error) { return null; }
  }

  function setTheme(next, persist) {
    document.documentElement.dataset.theme = next;
    themeButton.textContent = next === "dark" ? "Light mode" : "Dark mode";
    if (persist) {
      try { localStorage.setItem("altics-preview-theme", next); } catch (error) {}
    }
  }

  var storedTheme = readStoredTheme();
  if (storedTheme) setTheme(storedTheme, false);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark", false);
  else setTheme("light", false);

  // Optional links: ?set=mono|color|ui, ?theme=dark, ?checker=1, ?q=react
  var params = new URLSearchParams(window.location.search);
  var requestedSet = params.get("set");

  if (requestedSet === "ui" || requestedSet === "mono" || requestedSet === "color") {
    activeSet = requestedSet;
    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.set === requestedSet);
    });
    category.disabled = requestedSet === "ui";
  }

  var requestedTheme = params.get("theme");
  if (requestedTheme === "dark" || requestedTheme === "light") setTheme(requestedTheme, false);

  if (params.get("checker") === "1") {
    checker.checked = true;
    document.body.classList.add("checker");
  }

  if (params.get("q")) search.value = params.get("q");
  if (params.get("category") && !category.disabled) category.value = params.get("category");

  function applyFilters() {
    var query = search.value.trim().toLowerCase();
    var selectedCategory = category.value;
    var visible = 0;

    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      var matchesSet = activeSet === "all" || card.dataset.set === activeSet;
      var matchesCategory = !selectedCategory || card.dataset.category === selectedCategory;
      var matchesQuery = !query || card.dataset.search.indexOf(query) !== -1;
      var show = matchesSet && matchesCategory && matchesQuery;
      card.hidden = !show;
      if (show) visible += 1;
    }

    count.textContent = visible.toLocaleString() + (visible === 1 ? " icon" : " icons");
    empty.hidden = visible !== 0;
  }

  function setSize(value) {
    grid.style.setProperty("--icon-size", value + "px");
    sizeLabel.textContent = value + "px";
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); showToast("Copied " + text); } catch (error) {}
    document.body.removeChild(area);
  }

  function copyName(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { showToast("Copied " + text); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activeSet = tab.dataset.set;
      tabs.forEach(function (other) { other.classList.toggle("active", other === tab); });
      category.disabled = activeSet === "ui";
      if (category.disabled) category.value = "";
      applyFilters();
    });
  });

  search.addEventListener("input", applyFilters);
  category.addEventListener("change", applyFilters);
  size.addEventListener("input", function () { setSize(size.value); });

  themeButton.addEventListener("click", function () {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });

  checker.addEventListener("change", function () {
    document.body.classList.toggle("checker", checker.checked);
  });

  cards.forEach(function (card) {
    card.addEventListener("click", function () { copyName(card.dataset.name); });
  });

  setSize(size.value);
  applyFilters();
})();
`;

const tab = (set, label, count) =>
  `<button class="tab${set === "all" ? " active" : ""}" type="button" data-set="${set}">${label}<span>${count.toLocaleString()}</span></button>`;

const categoryOptions = categories
  .map(([value, label]) => `<option value="${value}">${label}</option>`)
  .join("");

const page = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Altics Icons — Preview</title>
<style>${css}</style>
</head>
<body>
<header>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>Altics Icons <span class="tag">preview</span></h1>
        <p class="sub">${counts.all.toLocaleString()} icons in 3 sets. Click an icon to copy its component name.</p>
      </div>
      <div class="theme-controls">
        <label class="check"><input type="checkbox" id="checker"> Checkerboard</label>
        <button class="ghost" type="button" id="theme">Dark mode</button>
      </div>
    </div>
    <div class="controls">
      <input id="search" type="search" placeholder="Search ${counts.all.toLocaleString()} icons..." autocomplete="off" spellcheck="false">
      <div class="tabs" role="tablist">
        ${tab("all", "All", counts.all)}
        ${tab("ui", "UI", counts.ui)}
        ${tab("mono", "Tech mono", counts.mono)}
        ${tab("color", "Tech color", counts.color)}
      </div>
      <select id="category" aria-label="Filter by tech category">
        <option value="">All categories</option>
        ${categoryOptions}
      </select>
      <label class="size">Size
        <input id="size" type="range" min="16" max="96" step="8" value="32">
        <output id="size-label">32px</output>
      </label>
    </div>
    <div class="meta">
      <span id="count">${counts.all.toLocaleString()} icons</span>
      <span class="hint">Mono icons use currentColor. Color icons keep brand colors.</span>
    </div>
  </div>
</header>
<main id="grid">
${cards}
</main>
<div id="empty" class="empty" hidden>No icons match your filters.</div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script>${client}</script>
</body>
</html>
`;

mkdirSync(new URL("../preview/", import.meta.url), { recursive: true });
const output = new URL("../preview/index.html", import.meta.url);
writeFileSync(output, page);
console.log(
  `Preview: ${items.length} icons (${counts.ui} UI, ${counts.mono} mono, ${counts.color} color) -> preview/index.html (${(Buffer.byteLength(page) / 1024 / 1024).toFixed(1)} MB)`,
);
