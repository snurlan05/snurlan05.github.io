// Homepage behaviour: brain map, simple/cinematic view switching,
// scroll-driven chapter journey, and hash navigation.
//
// Readable reconstruction of the compiled
// `_astro/index.astro_astro_type_script_index_0_lang.*.js` bundle from the
// original built site. Logic is preserved as-is; only names, comments and
// formatting changed. One deliberate simplification: the original's
// Vite-generated preload helper around the dynamic `journey` import is
// replaced by a plain dynamic `import()` — Vite generates equivalent
// preload handling for it at build time.

import {
  chapters,
  markVisited,
  visitedIds,
  topForChapter,
  isCinematic,
  type SectionMeasure,
} from "./world-state";

// ---------------------------------------------------------------------------
// Brain map panel (header "Explore the brain" menu)
// ---------------------------------------------------------------------------

function initBrainMap(): void {
  const container = document.querySelector("[data-brain-map]");
  const toggle = document.querySelector<HTMLButtonElement>("#brain-map-toggle");
  const panel = document.querySelector<HTMLElement>("#brain-map-panel");
  if (!container || !toggle || !panel) return;

  const closeButton = panel.querySelector(".brain-map-close");
  const links = Array.from(panel.querySelectorAll("[data-map-id]"));
  const regions = links.filter((link) => link.hasAttribute("data-map-region"));
  const routePath = panel.querySelector("[data-map-route]");
  const progress = panel.querySelector("[data-map-progress]");
  const detailTitle = panel.querySelector("[data-map-detail-title]");
  const detailSummary = panel.querySelector("[data-map-detail-summary]");
  const detailKind = panel.querySelector("[data-map-detail-kind]");
  const visited = new Set(visitedIds());
  const root = document.documentElement;
  let currentChapter = root.dataset.chapter || "overview";
  let open = false;

  function showDetail(link: Element): void {
    if (!link.hasAttribute("data-map-region")) return;
    const el = link as HTMLElement;
    if (detailTitle) detailTitle.textContent = el.dataset.mapTitle || "";
    if (detailSummary) detailSummary.textContent = el.dataset.mapSummary || "";
    if (detailKind) detailKind.textContent = el.dataset.mapKind || "";
  }

  function refresh(): void {
    for (const link of links) {
      const id = (link as HTMLElement).dataset.mapId || "";
      const isVisited = visited.has(id);
      const isHere = id === currentChapter;
      (link as HTMLElement).dataset.visited = String(isVisited);
      if (isHere) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
      const state = link.querySelector("[data-map-state]");
      if (state) {
        const text = [isVisited ? "Visited" : "", isHere ? "Here now" : ""]
          .filter(Boolean)
          .join(" · ");
        state.textContent = link.hasAttribute("data-map-region")
          ? text || (link as HTMLElement).dataset.mapKind || ""
          : text
            ? `, ${text}`
            : "";
      }
    }
    const visitedRegions = Array.from(visited)
      .map((id) => regions.find((r) => (r as HTMLElement).dataset.mapId === id))
      .filter((r): r is Element => !!r);
    if (progress) {
      progress.textContent = `${visitedRegions.length} of ${regions.length} regions visited`;
    }
    if (routePath) {
      const points = visitedRegions.map((r) => {
        const el = r as HTMLElement;
        return [Number(el.dataset.mapX), Number(el.dataset.mapY)];
      });
      routePath.setAttribute(
        "d",
        points
          .map(([x, y], i) => {
            if (!i) return `M${x} ${y}`;
            const [px, py] = points[i - 1];
            return `Q${(px + x) / 2} ${(py + y) / 2 - 35} ${x} ${y}`;
          })
          .join(" "),
      );
    }
  }

  function close(focusToggle = false): void {
    if (!open) return;
    open = false;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (focusToggle) toggle.focus({ preventScroll: true });
  }

  function openPanel(): void {
    open = true;
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    const current =
      regions.find((r) => (r as HTMLElement).dataset.mapId === currentChapter) ||
      regions[0];
    if (current) {
      showDetail(current);
      (current as HTMLElement).focus({ preventScroll: true });
    }
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => (open ? close(true) : openPanel()));
  closeButton?.addEventListener("click", () => close(true));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  });
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  });
  panel.addEventListener("click", (event) => {
    // A plain left-click on a region link follows the link and closes the
    // panel; modified clicks and keyboard activation leave it to the browser.
    if (
      event.target instanceof Element &&
      event.target.closest("a[data-map-id]") &&
      !event.defaultPrevented &&
      event instanceof MouseEvent &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      close();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (
      open &&
      event.target instanceof Node &&
      !container.contains(event.target)
    ) {
      close();
    }
  });
  document.addEventListener("focusin", (event) => {
    if (
      open &&
      event.target instanceof Node &&
      !container.contains(event.target)
    ) {
      close();
    }
  });
  for (const region of regions) {
    region.addEventListener("pointerenter", () => showDetail(region));
    region.addEventListener("focus", () => showDetail(region));
  }
  document.addEventListener("brain:visit", (event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && typeof detail.id === "string") {
      visited.add(detail.id);
      currentChapter = detail.id;
      refresh();
    }
  });
  new MutationObserver(() => {
    const chapter = root.dataset.chapter;
    if (chapter && chapter !== currentChapter) {
      currentChapter = chapter;
      refresh();
    }
  }).observe(root, { attributes: true, attributeFilter: ["data-chapter"] });

  refresh();
}

initBrainMap();

// ---------------------------------------------------------------------------
// View switching + chapter journey
// ---------------------------------------------------------------------------

const root = document.documentElement;
const sections = Array.from(
  document.querySelectorAll<HTMLElement>(".story-section[data-chapter]"),
);
const viewToggle = document.querySelector<HTMLButtonElement>("#view-toggle");
const brainCanvas = document.querySelector<HTMLCanvasElement>("#brain-canvas");
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(pointer: fine)");

/** Stored visitor preference: true = simple view. */
let preferSimple = false;
try {
  preferSimple = localStorage.getItem("samgar-simple-view") === "true";
} catch {
  // Storage unavailable (private mode, etc.): fall through with the default.
}

let cinematic = false;
let generation = 0;
/** The visitor has interacted (wheel / touch / key) since load. */
let userInteracted = false;
let simpleFallback = false;
let resizeFrame = 0;
let journey: {
  refresh: () => void;
  diagnostics: () => unknown;
  dispose: () => void;
} | null = null;
let journeyAbort: AbortController | undefined;
let measures: SectionMeasure[] = [];
/** Deep link requested on load (`#entry` and empty both mean overview). */
const initialHash = decodeURIComponent(location.hash.slice(1));
const initialChapter =
  initialHash === "entry" || !initialHash ? "overview" : initialHash;
/** True until the first view setup finishes. */
let initialising = true;
let viewReady = false;

function noteInteraction(event: Event): void {
  if (
    event instanceof KeyboardEvent &&
    ![
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " ",
      "Tab",
    ].includes(event.key)
  ) {
    return;
  }
  userInteracted = true;
}
for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
  window.addEventListener(type, noteInteraction, { capture: true, passive: true });
}

/** Called once the first view setup settles: stops listening for the initial interaction. */
function finishInit(gen: number): void {
  if (initialising && gen === generation) {
    initialising = false;
    for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      window.removeEventListener(type, noteInteraction, true);
    }
    if (!userInteracted) {
      goToChapter(initialChapter, false, initialChapter !== "overview");
    }
  }
}

let webglProbe: boolean | undefined;
function probeWebgl(): boolean {
  if (webglProbe !== undefined) return webglProbe;
  try {
    const canvas = document.createElement("canvas").getContext("webgl2");
    webglProbe = !!canvas;
    canvas
      ?.getExtension("WEBGL_lose_context")
      ?.loseContext();
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}

/** Measure every chapter section and store offsets for scroll maths. */
function measureSections(): void {
  const headerBottom = Math.max(
    96,
    (document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 96) + 16,
  );
  const travels = sections.map((section) => {
    const short = section.id === "entry" || section.id === "contact";
    return cinematic && section.id !== "overview"
      ? Math.min(short ? 100 : 75, innerHeight * (short ? 0.1 : 0.07))
      : 0;
  });
  const floors = sections.map((section, i) =>
    cinematic && root.dataset.scene === "ready"
      ? `${Math.ceil(
          travels[i] +
            Math.max(
              0,
              (section.querySelector(".chapter-content")?.offsetHeight ?? 0) -
                (innerHeight - headerBottom - 60),
            ) +
            64,
        )}px`
      : "0px",
  );
  sections.forEach((section, i) => {
    if (section.style.getPropertyValue("--reading-floor") !== floors[i]) {
      section.style.setProperty("--reading-floor", floors[i]);
    }
  });
  measures = sections.map((section, i) => ({
    id: section.dataset.chapter as string,
    top: section.getBoundingClientRect().top + scrollY,
    height: section.offsetHeight,
    travel: travels[i],
  }));
}

/** Which chapter the current scroll position belongs to. */
function chapterAtScroll(): { id: string | undefined; offset: number } {
  if (scrollY <= 1) return { id: "overview", offset: 0 };
  const edge = cinematic
    ? 1
    : Math.max(
        92,
        parseFloat(getComputedStyle(root).getPropertyValue("--header-height")) || 0,
      ) + 1;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top < edge) current = section;
  }
  return {
    id: current?.id,
    offset: current
      ? (scrollY - current.offsetTop) / Math.max(1, current.offsetHeight)
      : 0,
  };
}

function restoreScrollPosition(pos: { id: string | undefined; offset: number }): void {
  const measure = measures.find((m) => m.id === pos.id);
  if (measure) {
    window.scrollTo({
      top: Math.max(0, measure.top + pos.offset * measure.height),
      behavior: "instant" as ScrollBehavior,
    });
  }
}

function updateToggle(): void {
  if (!viewToggle) return;
  viewToggle.setAttribute("aria-pressed", String(!cinematic));
  viewToggle.title = cinematic
    ? "Switch to a still, scrollable portfolio"
    : "Simple view is active";
  viewToggle.disabled =
    innerWidth < 1024 ||
    innerHeight < 620 ||
    !finePointer.matches ||
    prefersReducedMotion.matches ||
    simpleFallback ||
    webglProbe === false;
}

/** Fall back to the simple view permanently for this page load. */
function activateSimpleView(): void {
  simpleFallback = true;
  const status = document.querySelector("#scene-status");
  if (status) {
    status.hidden = false;
    status.textContent =
      "Simple view is active. All experience and projects are available below.";
  }
  void updateView();
}

/** (Re)build the current view; loads the 3D journey lazily when needed. */
async function updateView(force = false): Promise<void> {
  if (!viewReady) return;
  const wantCinematic =
    isCinematic({
      width: innerWidth,
      height: innerHeight,
      finePointer: finePointer.matches,
      reducedMotion: prefersReducedMotion.matches,
      simple: preferSimple || simpleFallback,
      webgl: true,
    }) && probeWebgl();
  if (wantCinematic === cinematic && !force) {
    updateToggle();
    measureSections();
    journey?.refresh();
    return;
  }
  const at = chapterAtScroll();
  cinematic = wantCinematic;
  const gen = ++generation;
  journeyAbort?.abort();
  journeyAbort = undefined;
  journey?.dispose();
  journey = null;
  root.dataset.view = cinematic ? "cinematic" : "simple";
  root.dataset.scene = "poster";
  updateToggle();
  measureSections();
  restoreScrollPosition(at);
  if (!cinematic || !brainCanvas) {
    finishInit(gen);
    return;
  }
  const abort = new AbortController();
  journeyAbort = abort;
  try {
    const { createJourney } = await import("./vendor/journey.js");
    if (abort.signal.aborted) return;
    const created = await createJourney(
      brainCanvas,
      () => measures,
      abort.signal,
      activateSimpleView,
    );
    if (gen !== generation || abort.signal.aborted) {
      created.dispose();
      return;
    }
    const again = chapterAtScroll();
    journey = created;
    root.dataset.scene = "ready";
    measureSections();
    if (!initialising || userInteracted) restoreScrollPosition(again);
    finishInit(gen);
    journey.refresh();
  } catch (error) {
    if (!abort.signal.aborted) {
      console.warn(
        "Cinematic view unavailable. The complete portfolio remains readable.",
        error,
      );
      activateSimpleView();
    }
  }
}

function goToChapter(
  chapterId: string,
  pushHash: boolean,
  focusHeading = true,
): void {
  if (chapterId === "project-healthcare") {
    chapterId = "experience-healthcare";
    if (!pushHash) history.replaceState(history.state, "", `#${chapterId}`);
  }
  const section = sections.find((s) => s.id === chapterId);
  if (!section) return;
  measureSections();
  const top = topForChapter(measures, chapterId, cinematic);
  if (pushHash && location.hash !== `#${chapterId}`) {
    history.pushState(null, "", `#${chapterId}`);
  }
  window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
  journey?.refresh();
  if (!cinematic) markVisitedChapter(chapterId);
  if (focusHeading) {
    section.querySelector("h1,h2")?.focus({ preventScroll: true });
  }
}

function markVisitedChapter(chapterId: string): void {
  const chapter = chapters.find((c) => c.id === chapterId);
  if (chapter) {
    markVisited(chapter.id);
    document.dispatchEvent(
      new CustomEvent("brain:visit", {
        detail: { id: chapter.id, region: chapter.region },
      }),
    );
  }
}

// Mark chapters visited as their headings scroll into view (simple view only).
const headingObserver = new IntersectionObserver(
  (entries) => {
    if (cinematic || initialising) return;
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.closest(".story-section")?.id;
        if (id) markVisitedChapter(id);
      }
    }
  },
  { rootMargin: "-120px 0px -40% 0px", threshold: 0.25 },
);
for (const section of sections) {
  const heading = section.querySelector("h1,h2");
  if (heading) headingObserver.observe(heading);
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (
    link &&
    sections.some((s) => `#${s.id}` === link.hash) &&
    !(event instanceof MouseEvent &&
      (event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0))
  ) {
    event.preventDefault();
    goToChapter(decodeURIComponent(link.hash.slice(1)), true);
  }
});

viewToggle?.addEventListener("click", () => {
  preferSimple = cinematic;
  try {
    localStorage.setItem("samgar-simple-view", String(preferSimple));
  } catch {
    // Storage unavailable: the preference just doesn't persist.
  }
  void updateView();
});

window.addEventListener("popstate", () =>
  goToChapter(decodeURIComponent(location.hash.slice(1)) || "overview", false),
);
window.addEventListener("hashchange", () =>
  goToChapter(decodeURIComponent(location.hash.slice(1)) || "overview", false),
);
prefersReducedMotion.addEventListener("change", () => void updateView());
finePointer.addEventListener("change", () => void updateView());
window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => void updateView());
});

const resizeObserver = new ResizeObserver(() => measureSections());
for (const section of sections) {
  resizeObserver.observe(section);
  const content = section.querySelector(".chapter-content");
  if (content) resizeObserver.observe(content);
}
const header = document.querySelector(".site-header");
if (header) resizeObserver.observe(header);

window.addEventListener("pagehide", () => {
  journeyAbort?.abort();
  journey?.dispose();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) void updateView(true);
});

// Debug hook: append ?inspect to the URL to expose live journey state.
if (new URLSearchParams(location.search).has("inspect")) {
  Object.defineProperty(window, "__brainInspect", {
    value: () => ({
      view: root.dataset.view,
      chapter: root.dataset.chapter,
      measures,
      scene: journey?.diagnostics(),
    }),
    configurable: true,
  });
}

// Initialisation: simple view first, then upgrade to cinematic when allowed.
root.dataset.view = "simple";
if (initialHash === "entry") {
  history.replaceState(history.state, "", "#overview");
}
if (initialChapter === "overview") {
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}
measureSections();
void (async () => {
  await document.fonts.ready;
  viewReady = true;
  await updateView(true);
})();
