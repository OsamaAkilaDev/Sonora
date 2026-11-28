// index.template + captured shots → index.html (the HyperFrames root composition).
// Run: node video/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), "utf8");

/* The beat grid: Night Owl, 129 BPM, t=0 on the drop. Each beat from its index, rounded to a frame. */
const FPS = 30;
const BEAT = 60 / 129;
const b = (n) => Math.round(n * BEAT * FPS) / FPS;
const bar = (n) => b(n * 4);
const sec = (x) => String(Math.round(x * 1000) / 1000);

/** Shots scale to fit whole inside this box, centred on both axes. */
const BOX = { w: 1720, h: 940, frameW: 1920, frameH: 1080 };
const size = (name) => {
  const m = read(`assets/app/shots/${name}.html`).match(/width:(\d+)px;height:(\d+)px/);
  return { w: +m[1], h: +m[2] };
};
/** `ref` shares another shot's scale and top edge, so the two line up when one replaces the other. */
function fit(name, ref = name) {
  const { w, h } = size(name);
  const r = size(ref);
  const k = Math.min(BOX.w / r.w, BOX.h / r.h);
  const x = (BOX.frameW - w * k) / 2;
  const y = (BOX.frameH - r.h * k) / 2;
  const style = `position:absolute;left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w}px;height:${h}px;transform:scale(${k.toFixed(4)});transform-origin:0 0`;
  return `style="${style}" data-k="${k.toFixed(4)}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"`;
}

/* The shared screen: the repo's own call relay, shown as plain code. */
function codeView() {
  const src = readFileSync(join(here, "../apps/api/src/modules/calls/call-room.ts"), "utf8").split("\n");
  const start = src.findIndex((l) => l.includes("override async webSocketMessage"));
  const lines = src.slice(start, start + 20).map((l) => l.replace(/^ {2}/, ""));
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const kw = /\b(override|async|await|const|let|if|else|return|try|catch|typeof|type|this)\b/g;
  const tint = (l) =>
    esc(l)
      .replace(/("[^"]*")/g, '<i class="s">$1</i>')
      .replace(kw, '<i class="k">$1</i>')
      .replace(/\b(\d[\d_]*)\b/g, '<i class="n">$1</i>');
  return `<div class="code-view"><div class="code-file">call-room.ts</div><div class="code-clip"><pre class="code-lines">${lines
    .map((l, i) => `<span class="ln">${start + 1 + i}</span>${tint(l)}`)
    .join("\n")}</pre></div></div>`;
}

let html = read("index.template");

// {{t:EXPR}}: seconds on the beat grid, e.g. {{t:bar(7)}} or {{t:b(32)+0.5-bar(7)}}.
html = html.replace(/\{\{t:([^}]+)\}\}/g, (_, e) => sec(Function("b", "bar", `return ${e}`)(b, bar)));
html = html.replace(/\{\{fit:([\w-]+)(?:\|([\w-]+))?\}\}/g, (_, n, ref) => fit(n, ref));

// Shots. Videos take their slot's timing; a person's footage continues across cuts.
const first = {};
html = html.replace(/<!--shot:([\w-]+)-->/g, (m, name, offset, whole) => {
  const before = whole.slice(0, offset);
  const at = before.lastIndexOf('class="slot ');
  const slot = before.slice(at).match(/data-(?:start|show)="([\d.]+)(?:" data-duration="| )([\d.]+)"/);
  const [start, dur] = [+slot[1], +slot[2]];
  return read(`assets/app/shots/${name}.html`)
    .replace(/ id="/g, ` id="${name}-`)
    .replace(/style="([^"]*)"/g, (s, css) => {
      const kept = css.replace(/(^|;)\s*(opacity:\s*1|transform:\s*none)\s*(?=;|$)/g, "").replace(/^;+|;+$/g, "").trim();
      return kept ? `style="${kept}"` : "";
    })
    .replace(/<video data-feed="screen-[\w]+"[^>]*><\/video>/g, codeView)
    .replace(/<video data-feed="cam-(\w+)"([^>]*)><\/video>/g, (v, who, rest) => {
      first[who] ??= start;
      const media = 0.3 + (start - first[who]);
      return `<video id="v-${name}-${who}" class="clip ${rest.match(/class="([^"]*)"/)?.[1] ?? ""}" data-start="${sec(start)}" data-duration="${sec(dur)}" data-media-start="${sec(media)}" data-track-index="2" src="assets/stock/feeds/${who}.mp4" muted playsinline></video>`;
    });
});

// The stack, as simple-icons marks (CC0), in the order the request travels.
const icons = ["react", "typescript", "vite", "tailwindcss", "bun", "cloudflare", "hono", "zod", "drizzle", "sqlite", "webrtc"];
html = html.replace(
  "<!--icons-->",
  icons
    .map((n) => `<span id="icon-${n}">${read(`assets/icons/${n}.svg`).replace(/<title>[^<]*<\/title>/, "")}</span>`)
    .join("\n          "),
);

// One disc per seam (must match `seams` in the template's script).
const seams = [3, 4, 5, 7, 9, 11, 13, 16, 17, 19];
html = html.replace(
  "<!--discs-->",
  seams
    .map(
      (n, i) =>
        `<div id="disc-${i}" class="disc clip" data-start="${sec(bar(n) - 0.45)}" data-duration="0.9" data-track-index="8" style="z-index:50"><div class="disc-fill"></div></div>`,
    )
    .join("\n      "),
);

writeFileSync(join(here, "index.html"), html);
console.log(`index.html: ${(html.length / 1024).toFixed(0)} KB, ${sec(bar(21))} s`);
