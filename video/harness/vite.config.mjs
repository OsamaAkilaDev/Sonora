// Capture harness: renders Sonora's real components on fixed data, and saves shots for the film.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "../../apps/web/src");
const out = resolve(here, "../assets/app");

/** Network and hardware edges swapped for stubs: uploads never finish, video tiles take any feed. */
const stubs = {
  "/features/chats/upload": resolve(here, "stubs/upload.ts"),
  "/features/calls/media": resolve(here, "stubs/media.tsx"),
};
function stubEdges() {
  return {
    name: "stub-edges",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!importer?.replaceAll("\\", "/").startsWith(web.replaceAll("\\", "/"))) return;
      const r = await this.resolve(source, importer, { skipSelf: true });
      const id = r?.id.replaceAll("\\", "/").replace(/\.(tsx?|jsx?)$/, "");
      for (const [k, v] of Object.entries(stubs)) if (id?.endsWith(k)) return v;
    },
  };
}

/** Light and dark tokens become classes, so shots of both themes share one page in the film. */
const themeClasses = (css) =>
  css
    .replace(/:root\[data-theme="?dark"?\]\s*\{/g, ".theme-dark {")
    .replace(/:root\s*\{(\s*--canvas:)/g, ".theme-light, .theme-dark {$1")
    // Tailwind's mono stack names a font HyperFrames can't supply; JetBrains Mono is bundled.
    .replace(/SFMono-Regular/g, '"JetBrains Mono"');

/** Copies fonts the CSS points at (dev-server URLs) next to it and rewrites the URLs. */
function localFonts(css) {
  mkdirSync(join(out, "fonts"), { recursive: true });
  return css.replace(/url\(["']?([^"')]+\.woff2)[^"')]*["']?\)/g, (m, url) => {
    let path = decodeURIComponent(url.replace(/^https?:\/\/[^/]+/, ""));
    path = path.startsWith("/@fs/") ? path.slice(5) : resolve(here, `.${path}`);
    if (!existsSync(path)) return m;
    copyFileSync(path, join(out, "fonts", basename(path)));
    return `url("fonts/${basename(path)}")`;
  });
}

/** Whole stylesheets, keyed by their text: every shot posts them all, each is stored once. */
function saveShots() {
  return {
    name: "save-shots",
    configureServer(server) {
      server.middlewares.use("/__save", (req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          const { name, html, sheets } = JSON.parse(body);
          mkdirSync(join(out, "shots"), { recursive: true });
          writeFileSync(join(out, "shots", `${name}.html`), html);
          const store = join(out, "sheets.json");
          const all = existsSync(store) ? JSON.parse(readFileSync(store, "utf8")) : [];
          for (const s of sheets) if (!all.includes(s)) all.push(s);
          writeFileSync(store, JSON.stringify(all));
          const css = localFonts(themeClasses(all.join("\n")));
          writeFileSync(
            join(out, "app.css"),
            `${css}\n/* GSAP owns all motion in the film. */\n.shot *, .shot *::before, .shot *::after { animation: none !important; transition: none !important; }\n`,
          );
          res.end("ok");
        });
      });
    },
  };
}

export default defineConfig({
  root: here,
  // Stock media (/stock/…) and the saved shots (/app/…) are served from video/assets.
  publicDir: resolve(here, "../assets"),
  plugins: [stubEdges(), react(), tailwindcss(), saveShots()],
  server: { port: 5190, strictPort: true, fs: { allow: [resolve(here, "../..")] } },
});
