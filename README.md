# Samgar Nurlan — Portfolio

Personal portfolio for Samgar Nurlan, Software Engineering student at the
University of Waterloo. Live at <https://snurlan05.github.io>.

The site is a single-page "brain" experience: an interactive 3D point-network
brain (sampled from BodyParts3D anatomy, see `ATTRIBUTION.md`) whose seven
regions navigate to experience and project chapters, with a simple
scrollable view as the fallback.

## Run it

```bash
npm install
npm run dev      # local dev server, http://localhost:4321
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

Requires Node 20+.

## Deploy

Pushing to `main` deploys automatically via
`.github/workflows/deploy.yml`: it runs `npm run build` and publishes
`dist/` to GitHub Pages. No built files are committed to the repo.

> **History note (November 2026):** the repo previously contained only the
> *built* output of the site (`index.html` + `_astro/` bundles, no source).
> This branch reconstructs maintainable Astro source from that output; the
> built files were removed from version control when the source landed.
> Merging this branch changes how the site deploys — the workflow above
> must be in place (it is, in this branch) or the live site will go blank.

## Structure

```
astro.config.mjs          Site URL (https://snurlan05.github.io)
public/                   Copied verbatim into the build output
  .nojekyll               GitHub Pages: don't run Jekyll
  favicon.svg
  samgar-nurlan-resume.pdf
  ATTRIBUTION.md / THIRD_PARTY_NOTICES.txt   Asset + library attribution
  fonts/                  Self-hosted Sora + Source Sans 3 (+ licences)
  images/                 Brain poster renders (desktop + mobile)
  models/                 brain-shell.glb, brain-interior.glb, manifest
src/
  pages/
    index.astro           Homepage (the brain experience)
    certifications.astro  /certifications
  layouts/BaseLayout.astro  <head>, header, footer, journey script switch
  components/
    SiteHeader.astro      Header + "Explore the brain" map panel
    SiteFooter.astro      Footer with BodyParts3D attribution
    CertCard.astro        Certification card (used on both pages)
  data/certifications.ts  Certification titles/dates (single source of truth)
  styles/global.css       Site stylesheet (original built CSS + additions)
  scripts/
    main.ts               Homepage behaviour (view switching, journey, nav)
    world-state.ts        Shared scroll/journey state (chapters, cameras)
    vendor/journey.js     Vendored 3D scene bundle — see its header comment
```

## How to edit content

| Change | Where |
|---|---|
| Experience / project text on the homepage | `src/pages/index.astro` (the sections are literal markup copied from the live page, so edits are visible in place) |
| Certifications (titles, dates, topics) | `src/data/certifications.ts` — feeds both the homepage preview and `/certifications` |
| Navigation | `src/components/SiteHeader.astro` |
| Styles | `src/styles/global.css` — the first ~26 KB is the original built stylesheet, kept verbatim; additions are appended under a marked comment |
| Brain camera positions / chapter list | `src/scripts/world-state.ts` (`chapters`, `regionTargets`) — keep in sync with `public/models/brain-manifest.json` |

### Adding a project

The seven brain regions (J Healthcare, Robotics, ACM @ CCNY, Form-ulation,
PayGuard, UNCrania, Breezability) are the journey's chapters. A new project
is a **chapter**, not a plain section: plain sections scroll with an opaque
background and are invisible to the journey, so they cut across the brain
and leave the chapter label, dots, and brain map pointing at the wrong
chapter (that is exactly what happened to UNCrania and Breezability in
November 2026). To add one, do all of these, in the same order:

1. `src/scripts/world-state.ts` — append a `regionTargets` anchor and a
   `chapters` entry (camera position, label, region index) in the same
   position as the section will sit in the page.
2. `public/models/brain-manifest.json` — add the anchor and the
   `NeuralCluster_*` name, keeping them in sync with (1).
3. `src/pages/index.astro` — add a `story-section` with `data-chapter`
   and a `.chapter-content` wrapper, in the same DOM order as (1), plus a
   dot in the chapter rail. The journey pairs sections with chapters
   **by index**, so DOM order and `chapters` order must match exactly.
4. `src/components/SiteHeader.astro` — add a brain-map region
   (`data-map-region` = the region index) so it appears in "Explore the
   brain" and in the visited-regions progress.
5. `src/scripts/vendor/journey.js` — the scene assumes a chapter/region
   count in a few places; extend the bounds to the new counts (see the
   provenance header in that file for the current list: `cx`, `dx`,
   camera-path special cases, travel-passage/transit bounds, assembly
   clusters, membranes, region-connection pairs). If you skip this, the
   new chapters get NaN cameras or missing interior geometry. One hard
   limit: `prepareActivity` packs arrival times into two vec3 attributes,
   so it takes exactly six anchors — a seventh region reuses region 5's
   arrival channel (see the header).

Certifications is also a chapter (`#certifications`, region -1), not a
plain section, for the same reason.

### Certifications

`src/data/certifications.ts` holds only what is published: title, exam
code, issuer, issue date, and topics. **Never add credential IDs or
Certiport verification codes** — the certificate PDFs carry them, and the
site deliberately does not publish them. No Microsoft badge artwork is
used; no official badge graphic is available locally, so the cards are
clean text with a generic shield mark.

## What is vendored, and why

`src/scripts/vendor/journey.js` is the compiled 3D scene bundle from the
original build (GSAP + Three.js inlined + the site's scene code). The
original scene sources were never committed to the repo, so this bundle
is preserved byte-for-byte — the only changes are a provenance header,
re-pointing its `world-state` import at the readable
`src/scripts/world-state.ts`, and (Nov 2026) extending its
chapter-count-dependent bounds from 9 chapters / 5 regions to 12 chapters
/ 7 regions. If the original scene sources are ever recovered, replace
this file with a real rebuild from them.

## Attribution

Brain geometry: BodyParts3D, © The Database Center for Life Science,
licensed under CC BY 4.0 — see `public/ATTRIBUTION.md`. Fonts: Sora and
Source Sans 3, self-hosted, licences in `public/fonts/`. Third-party
library notices (GSAP, Three.js, meshoptimizer) in
`public/THIRD_PARTY_NOTICES.txt`.
