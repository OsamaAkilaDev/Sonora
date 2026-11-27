import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

// The source icon is already a full-bleed dark tile, so no extra padding anywhere.
const dark = { padding: 0, resizeOptions: { background: "#060606" } };

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, ...dark },
    apple: { ...preset.apple, ...dark },
  },
  images: ["public/icon.svg"],
});
