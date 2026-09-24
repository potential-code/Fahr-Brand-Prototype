// The federal content library's course structure: module → unit → learning
// block.
//
// The platform's own courses (AI Foundations, Prompt Engineering, AI Ethics &
// Governance) are learner courses first. Their structure is read from the
// learner course — a group becomes a module, a lesson a unit, its video and
// its text become blocks — so FAHR edits exactly what the learner plays. The
// same mapping runs in reverse: FAHR's text and video edits are applied back
// onto the learner course the course player shows.

import { COURSE_BY_ID, type Course, type Lesson } from "@/lib/learningData";
import type { ContentItem, ContentModule, ContentUnit, LearningBlock, LearningBlockKind } from "@/lib/federal/model";
import { COURSERA_CATALOGUE, type CourseraCourse } from "@/lib/federal/fahrConsole";

// ---------------------------------------------------------------------------
// Learner course → library structure
// ---------------------------------------------------------------------------

/** "8 min" → 8. Anything unreadable counts as zero rather than guessing. */
function minutesFrom(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function lessonToUnit(lesson: Lesson): ContentUnit {
  const blocks: LearningBlock[] = [];
  if (lesson.videoId) {
    blocks.push({
      id: `${lesson.id}-video`,
      kind: "Video",
      title: lesson.title,
      videoUrl: `https://www.youtube.com/watch?v=${lesson.videoId}`,
    });
  }
  const text = [...lesson.body, ...(lesson.points ?? []).map((p) => `• ${p}`)].join("\n\n");
  blocks.push({
    id: `${lesson.id}-text`,
    kind: "Text",
    title: lesson.type === "activity" ? "Activity" : "Reading",
    text,
  });
  return { id: lesson.id, title: lesson.title, mins: minutesFrom(lesson.duration), blocks };
}

/** The library structure of a learner course, before any FAHR edit. */
export function courseToModules(course: Course): ContentModule[] {
  return course.groups.map((group) => ({
    id: group.id,
    title: group.title,
    units: group.lessons.map(lessonToUnit),
  }));
}

/**
 * A Coursera course's structure. Coursera shares its module list; each module
 * is laid out as a lecture video, a reading and a quick check — the shape
 * every Coursera module takes — so the course reads in full in the editor.
 */
export function courseraToModules(course: CourseraCourse): ContentModule[] {
  return course.syllabus.map((title, i) => {
    const m = `${course.id}-m${i + 1}`;
    return {
      id: m,
      title,
      units: [
        {
          id: `${m}-u1`,
          title: `${title}: lecture`,
          mins: Math.max(10, Math.round((course.hours * 60) / course.syllabus.length / 2)),
          blocks: [
            { id: `${m}-b1`, kind: "Video", title: `${title} — lecture video`, fileName: `coursera-${m}.mp4` },
            {
              id: `${m}-b2`,
              kind: "Text",
              title: "Key ideas",
              text: `${course.partner} introduces ${title.toLowerCase()} and why it matters in practice.\n\nTake notes on one example you could use in your own work.`,
            },
          ],
        },
        {
          id: `${m}-u2`,
          title: `${title}: check your understanding`,
          mins: 10,
          blocks: [
            {
              id: `${m}-b3`,
              kind: "Question",
              title: "Quick check",
              question: {
                prompt: `Which best describes the aim of "${title}"?`,
                options: [
                  `Applying ${title.toLowerCase()} to real work`,
                  "Memorising definitions",
                  "Avoiding AI tools altogether",
                ],
                correctIndex: 0,
              },
            },
          ],
        },
      ],
    };
  });
}

/** What a brand-new course starts with, so the editor never opens empty. */
export function starterModules(): ContentModule[] {
  const m = newId("mod");
  return [
    {
      id: m,
      title: "Introduction",
      units: [
        {
          id: newId("unit"),
          title: "Welcome to the course",
          mins: 5,
          blocks: [
            {
              id: newId("block"),
              kind: "Text",
              title: "Welcome",
              text: "Tell learners what this course covers and what they will be able to do by the end.",
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Modules for any library item: its own, else its learner course's, else —
 * for a Coursera import — the course's module list laid out in full.
 */
export function structureOf(item: ContentItem): ContentModule[] {
  const hasUnits = item.modules?.some((m) => m.units.length > 0);
  if (item.modules && (hasUnits || item.source !== "Coursera")) return item.modules;
  const course = item.courseId ? COURSE_BY_ID[item.courseId] : undefined;
  if (course) return courseToModules(course);
  if (item.source === "Coursera") {
    const coursera = COURSERA_CATALOGUE.find((c) => item.id === `ct-crs-${c.id}`);
    if (coursera) return courseraToModules(coursera);
  }
  return item.modules ?? [];
}

// ---------------------------------------------------------------------------
// Library structure → learner course
// ---------------------------------------------------------------------------

/** The YouTube id in a watch, share or embed link — or null. */
export function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

/**
 * The learner course with FAHR's edits applied. Titles, text and videos flow
 * through; units FAHR adds become lessons, ones it deletes go. Questions and
 * documents stay in the library for now — the player shows text and video.
 * The pretest and final assessment are the course's own and are left alone.
 */
export function applyEditsToCourse(course: Course, modules: ContentModule[] | undefined): Course {
  if (!modules) return course;
  const originalLessons = new Map(course.groups.flatMap((g) => g.lessons).map((l) => [l.id, l]));
  const originalGroups = new Map(course.groups.map((g) => [g.id, g]));

  return {
    ...course,
    groups: modules.map((module) => ({
      id: module.id,
      title: module.title,
      caption: originalGroups.get(module.id)?.caption ?? "",
      lessons: module.units.map((unit): Lesson => {
        const original = originalLessons.get(unit.id);
        const video = unit.blocks.find((b) => b.kind === "Video");
        const videoIdFromBlock = youtubeId(video?.videoUrl);
        const body = unit.blocks
          .filter((b) => b.kind === "Text" && b.text?.trim())
          .flatMap((b) => (b.text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean));
        return {
          id: unit.id,
          title: unit.title,
          type: videoIdFromBlock ? "video" : original?.type === "activity" ? "activity" : "reading",
          duration: `${unit.mins} min`,
          videoId: videoIdFromBlock ?? undefined,
          body,
        };
      }),
    })),
  };
}

// ---------------------------------------------------------------------------
// Totals, labels, covers
// ---------------------------------------------------------------------------

export type StructureTotals = { modules: number; units: number; blocks: number; mins: number };

export function structureTotals(modules: ContentModule[]): StructureTotals {
  return {
    modules: modules.length,
    units: modules.reduce((n, m) => n + m.units.length, 0),
    blocks: modules.reduce((n, m) => n + m.units.reduce((t, u) => t + u.blocks.length, 0), 0),
    mins: modules.reduce((n, m) => n + m.units.reduce((t, u) => t + u.mins, 0), 0),
  };
}

/** "95 min" or "2 h 15 min". */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const BLOCK_KINDS: LearningBlockKind[] = ["Text", "Video", "Question", "Document"];

/** Cover images a course can use, from the platform's own brand library. */
export const COVER_OPTIONS = [
  "brand/learning/course-ai-foundations.jpg",
  "brand/learning/course-prompt-engineering.jpg",
  "brand/learning/course-ai-governance.jpg",
  "brand/learning/assessment-hero.jpg",
  "brand/learning/course-default.jpg",
  "brand/landing/section-lab.jpg",
  "brand/landing/stakeholder-learner.jpg",
  "brand/landing/stakeholder-manager.jpg",
  "brand/landing/ecosystem-2.jpg",
  "brand/landing/ecosystem-3.jpg",
];

const BASE = import.meta.env.BASE_URL;

/** A cover's displayable src — brand paths resolve against the base URL; uploads are used as-is. */
export function coverSrc(cover: string | undefined): string {
  const path = cover ?? "brand/learning/course-default.jpg";
  return /^(blob:|data:|https?:)/.test(path) ? path : `${BASE}${path}`;
}

let seq = 0;
/** A fresh id for a module, unit or block made in the editor. */
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++seq}`;
