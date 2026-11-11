// Shared scroll/journey state for the brain experience.
//
// Readable reconstruction of the compiled `_astro/world-state.*.js` bundle
// from the original built site. Behaviour is identical to that bundle:
// same chapter list, camera positions, anchor points, smoothstep, scroll
// maths, seeded RNG and visited-region tracking.
//
// The single-letter export aliases at the bottom exist because the vendored
// scene bundle (`src/scripts/vendor/journey.js`) imports this module by
// those names. Do not rename them without updating that import.

export interface Chapter {
  id: string;
  label: string;
  /** Camera position for this chapter in the 3D scene. */
  position: [number, number, number];
  /** Camera look-at target. Chapters with a brain region use that region's anchor. */
  target: [number, number, number];
  /** Opacity of the brain shell at this chapter (1 = fully visible). */
  shell: number;
  /** Index into `regionTargets`, or -1 for chapters with no brain region. */
  region: number;
}

/**
 * Brain-region anchor points, in glTF coordinates (Y up, anterior +Z,
 * left hemisphere +X). Kept in sync with `public/models/brain-manifest.json`.
 */
export const regionTargets: [number, number, number][] = [
  [-0.78, 0.35, 0.55], // 0 ExperienceHealthcare
  [0.8, 0.45, 0.15], // 1 ExperienceRobotics
  [-0.65, 0.7, -0.5], // 2 ExperienceTeaching
  [0.7, 0.45, -0.85], // 3 ProjectFormulation
  [-0.78, 0, -0.75], // 4 ProjectPayguard
  [0.65, -0.1, 0.65], // 5 ProjectHealthcare (unused by the chapters below)
];

export const chapters: Chapter[] = [
  {
    id: "overview",
    label: "A connected perspective",
    position: [2.9, 0.95, 3.85],
    target: [0, 0.08, 0],
    shell: 1,
    region: -1,
  },
  {
    id: "entry",
    label: "Inside the connections",
    position: [0.04, 0.6, 1.6],
    target: [-0.1, 0.2, -0.5],
    shell: 0.16,
    region: -1,
  },
  {
    id: "experience-healthcare",
    label: "Experience / Healthcare",
    position: [0.1, 0.23, 1.28],
    target: [-0.7, 0.35, 0.2],
    shell: 0,
    region: 0,
  },
  {
    id: "experience-robotics",
    label: "Experience / Robotics",
    position: [-0.14, 0.32, 0.9],
    target: [0.65, 0.45, -0.25],
    shell: 0,
    region: 1,
  },
  {
    id: "experience-teaching",
    label: "Experience / Teaching",
    position: [0.1, 0.3, 0.42],
    target: [-0.55, 0.7, -0.9],
    shell: 0,
    region: 2,
  },
  {
    id: "project-formulation",
    label: "Projects / Form-ulation",
    position: [-0.1, 0.35, 0.1],
    target: [0.7, 0.45, -1.2],
    shell: 0,
    region: 3,
  },
  {
    id: "project-payguard",
    label: "Projects / PayGuard",
    position: [0.13, 0.18, -0.25],
    target: [-0.78, 0, -1.05],
    shell: 0,
    region: 4,
  },
  {
    id: "skills",
    label: "Skills / Connected disciplines",
    position: [0, 0.3, 5.4],
    target: [0, 0.08, 0],
    shell: 0.55,
    region: -1,
  },
  {
    id: "contact",
    label: "Start a conversation",
    position: [-3.1, 1.1, 4.2],
    target: [0, 0.08, 0],
    shell: 1,
    region: -1,
  },
].map((chapter) =>
  chapter.region < 0
    ? chapter
    : { ...chapter, target: regionTargets[chapter.region] },
);

export interface SectionMeasure {
  id: string;
  /** Distance from the top of the document to the section's top, in px. */
  top: number;
  height: number;
  /** Extra scroll distance the chapter "travels" through in cinematic view. */
  travel: number;
}

/** Clamp `value` into [min, max] (defaults 0..1). */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Smootherstep easing, clamped to [0, 1]. */
export function smoothstep(value: number): number {
  const t = clamp(value);
  return clamp(t * t * t * (t * (t * 6 - 15) + 10));
}

export interface ScrollState {
  from: number;
  to: number;
  /** 0..1 progress between the `from` and `to` chapters. */
  mix: number;
  chapter: number;
  /** 0..1 progress through the whole page. */
  progress: number;
}

/**
 * Which chapter the scroll position is in, and how far between chapters.
 * `scrollY` is the current scroll offset; `measures` are per-chapter
 * measurements from `measureSections()` in main.ts.
 */
export function scrollState(
  scrollY: number,
  measures: SectionMeasure[],
): ScrollState {
  if (!measures.length) {
    return { from: 0, to: 0, mix: 1, chapter: 0, progress: 0 };
  }
  const y = Math.max(0, scrollY);
  let index = 0;
  for (let i = 1; i < measures.length; i++) {
    if (y >= measures[i].top) index = i;
  }
  const current = measures[index];
  const travelled = y - current.top;
  const mix =
    index === 0 ? 1 : smoothstep(travelled / Math.max(1, current.travel));
  const last = measures[measures.length - 1];
  return {
    from: Math.max(0, index - 1),
    to: index,
    mix,
    chapter: index,
    progress: clamp(y / Math.max(1, last.top + last.travel)),
  };
}

/**
 * Scroll offset (px from the top of the document) that shows `chapterId`.
 * In cinematic view the chapter is shown after its travel distance;
 * in simple view it is shown 92px above its top (under the fixed header).
 */
export function topForChapter(
  measures: SectionMeasure[],
  chapterId: string,
  cinematic: boolean,
  simpleOffset = 92,
): number {
  const measure = measures.find((m) => m.id === chapterId);
  return measure
    ? Math.max(0, measure.top + (cinematic ? measure.travel : -simpleOffset))
    : 0;
}

export interface ViewportInfo {
  width: number;
  height: number;
  finePointer: boolean;
  reducedMotion: boolean;
  /** The visitor asked for the simple view (stored preference or fallback). */
  simple: boolean;
  webgl: boolean;
}

/** Cinematic (3D brain) view is only offered on large, capable viewports. */
export function isCinematic(viewport: ViewportInfo): boolean {
  return (
    viewport.width >= 1024 &&
    viewport.height >= 620 &&
    viewport.finePointer &&
    !viewport.reducedMotion &&
    !viewport.simple &&
    viewport.webgl
  );
}

/** Deterministic seeded RNG (mulberry32-style) used by the scene. */
export function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 1831565813) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const visitedChapters = new Set<string>();

/**
 * Record a chapter as visited (brain-map progress). Returns false when the
 * id is not a chapter or was already visited.
 */
export function markVisited(chapterId: string): boolean {
  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter || visitedChapters.has(chapter.id)) return false;
  visitedChapters.add(chapter.id);
  return true;
}

/** Ids of the chapters visited so far, in visit order. */
export function visitedIds(): string[] {
  return [...visitedChapters];
}

/** Bitmask of the visited brain regions (region 0 = bit 0, etc.). */
export function visitedMask(): number {
  let mask = 0;
  for (const chapter of chapters) {
    if (chapter.region >= 0 && visitedChapters.has(chapter.id)) {
      mask |= 1 << chapter.region;
    }
  }
  return mask;
}

/**
 * How strongly the "connection" between two chapters is lit: overview and
 * contact count as 0, every other chapter as 1, eased by `state.mix`.
 */
export function chapterShade(state: ScrollState): number {
  const weight = (index: number) =>
    chapters[index].id === "overview" || chapters[index].id === "contact"
      ? 0
      : 1;
  return weight(state.from) + (weight(state.to) - weight(state.from)) * smoothstep(state.mix);
}

// Single-letter aliases used by the vendored scene bundle and main.ts.
// (The compiled bundles imported these names; keep them in sync.)
export {
  chapters as a,
  scrollState as c,
  smoothstep as d,
  visitedMask as i,
  seededRandom as l,
  markVisited as n,
  regionTargets as o,
  visitedIds as r,
  topForChapter as s,
  chapterShade as t,
  isCinematic as u,
};
