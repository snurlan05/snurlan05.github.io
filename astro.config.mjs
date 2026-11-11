import { defineConfig } from "astro/config";

// User site: served from the domain root, so no `base` is set.
// The built output in dist/ is what GitHub Pages publishes (see README.md
// and .github/workflows/deploy.yml).
export default defineConfig({
  site: "https://snurlan05.github.io",
});
