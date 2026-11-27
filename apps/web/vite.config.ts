import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // Runs apps/api as the real Worker (workerd + D1 + DOs) inside Vite dev; build emits both.
    cloudflare({ configPath: "../api/wrangler.jsonc" }),
    // Browser build only: the service worker has no business in the Worker bundle.
    ...VitePWA({
      registerType: "prompt", // never swap code under a live call; the user reloads
      pwaAssets: { config: true },
      manifest: {
        name: "Sonora",
        short_name: "Sonora",
        description: "Chats, voice and video with the people you care about.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#060606",
        theme_color: "#060606",
        categories: ["social", "communication"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,jpg}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/ws/, /^\/cdn-cgi\//],
        cleanupOutdatedCaches: true,
      },
    }).map((p) => ({ ...p, applyToEnvironment: (env: { name: string }) => env.name === "client" })),
  ],
});
