# Samgar Nurlan — Portfolio

Personal portfolio for Samgar Nurlan, Software Engineering student at the
University of Waterloo. Live at <https://snurlan05.github.io>.

The site is a single-page "brain" experience: an interactive 3D point-network
brain (sampled from BodyParts3D anatomy, see `ATTRIBUTION.md`) whose five
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

The five brain regions (J Healthcare, Robotics, ACM @ CCNY, Form-ulation,
PayGuard) are the journey's chapters — adding a sixth region means new
camera positions in `world-state.ts`, a new anchor in
`brain-manifest.json`, and changes inside the 3D scene bundle, so don't do
it lightly. For an ordinary new project, add a `plain-section` after the
PayGuard section in `src/pages/index.astro`, following the UNCrania /
Breezability sections already there: same inner markup
(`content-copy`, `project-description`, `contribution-list`,
`technology-list`, `section-link`), but **not** the `story-section` /
`data-chapter` classes — in cinematic view the journey hides every
chapter's content until its plane is shown, and a new section has no
plane, so it would be invisible. Plain sections scroll normally with a
solid background in both views.

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
is preserved byte-for-byte — the only changes are a provenance header and
re-pointing its `world-state` import at the readable
`src/scripts/world-state.ts`. If the original scene sources are ever
recovered, replace this file with a real rebuild from them.

## Attribution

Brain geometry: BodyParts3D, © The Database Center for Life Science,
licensed under CC BY 4.0 — see `public/ATTRIBUTION.md`. Fonts: Sora and
Source Sans 3, self-hosted, licences in `public/fonts/`. Third-party
library notices (GSAP, Three.js, meshoptimizer) in
`public/THIRD_PARTY_NOTICES.txt`.
