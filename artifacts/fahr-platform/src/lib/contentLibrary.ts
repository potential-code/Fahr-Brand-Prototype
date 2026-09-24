// The structure of a federal content library item: modules, and the units in
// them.
//
// Where an item is one of the platform's own learner courses, its structure is
// read from that course — the same groups and lessons the learner plays — so
// what FAHR sees in the library is exactly what a learner takes. Authored and
// imported items carry their structure on the item itself.

import { COURSE_BY_ID, type LessonType } from "@/lib/learningData";
import type { ContentItem, ContentModule, ContentUnitKind } from "@/lib/federal/model";

const LESSON_KIND: Record<LessonType, ContentUnitKind> = {
  reading: "Reading",
  video: "Video",
  activity: "Activity",
};

/** "8 min" → 8. Anything unreadable counts as zero rather than guessing. */
function minutesFrom(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** Modules and units for an item, from its learner course where it has one. */
export function contentStructure(item: ContentItem): ContentModule[] {
  const course = item.courseId ? COURSE_BY_ID[item.courseId] : undefined;
  if (!course) return item.modules ?? [];

  const modules: ContentModule[] = course.groups.map((group) => ({
    id: `${course.id}-${group.id}`,
    title: group.title,
    units: group.lessons.map((lesson) => ({
      id: `${course.id}-${lesson.id}`,
      title: lesson.title,
      kind: LESSON_KIND[lesson.type],
      mins: minutesFrom(lesson.duration),
    })),
  }));

  // The course's own checks are units too — the agent can place them.
  return [
    {
      id: `${course.id}-before`,
      title: "Before you start",
      units: [{ id: `${course.id}-pretest`, title: course.pretest.title, kind: "Quiz", mins: 5 }],
    },
    ...modules,
    {
      id: `${course.id}-after`,
      title: "Final assessment",
      units: [{ id: `${course.id}-final`, title: course.finalAssessment.title, kind: "Quiz", mins: 10 }],
    },
  ];
}

export type StructureTotals = { modules: number; units: number; mins: number };

export function structureTotals(modules: ContentModule[]): StructureTotals {
  return {
    modules: modules.length,
    units: modules.reduce((n, m) => n + m.units.length, 0),
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

export const UNIT_KINDS: ContentUnitKind[] = ["Video", "Reading", "Document", "Quiz", "Activity", "Package"];

/** What each kind of unit is, in the builder's words. */
export const UNIT_KIND_HINT: Record<ContentUnitKind, string> = {
  Video: "Upload a video file",
  Reading: "Written lesson text",
  Document: "Upload a PDF or Word document",
  Quiz: "A short knowledge check",
  Activity: "A hands-on task with an AI assistant",
  Package: "Upload a ready-made SCORM course package",
};

/** Kinds that carry an uploaded file. */
export const UPLOAD_KINDS: ContentUnitKind[] = ["Video", "Document", "Package"];
