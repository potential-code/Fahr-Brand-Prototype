// Scripted content for the Learning Agent side panel.
//
// The coach travels with the learner: it opens inside the course player and
// inside pathway activities, and always answers about whatever is on screen.
// Its suggestions come from the same recommendation pools the pathway uses, so
// the reading it offers is the reading the learner was already assigned.
//
// Front-end mock content only — no backend.

import { AGENTS, LEARNER_PROFILE } from "@/lib/constants";
import type { Competency } from "@/lib/learningData";
import { resourcesForCompetency } from "@/lib/recommendations";

export type CoachContext = {
  /** What the learner is looking at, in their own words. */
  subject: string;
  /** The capability the subject develops, when it is known. */
  competency?: Competency;
  /** One extra line of situational detail — a lesson type, an activity format. */
  detail?: string;
};

export type CoachPrompt = { id: string; label: string; answer: string };

export function coachGreeting(ctx: CoachContext): string {
  const where = ctx.competency
    ? `“${ctx.subject}”, which builds your ${ctx.competency.label}`
    : `“${ctx.subject}”`;
  return `I'm your ${AGENTS.learning}. I can see you are on ${where}. Ask me anything about it, or pick one of the questions below.`;
}

function simplerAnswer(ctx: CoachContext): string {
  if (!ctx.competency) {
    return `In plain terms: ${ctx.subject} exists to move you from knowing about AI to using it safely on real federal work. Everything in it is something you will be asked to do rather than recall.`;
  }
  return `Stripped back, ${ctx.competency.label} is one skill: ${ctx.competency.description.charAt(0).toLowerCase()}${ctx.competency.description.slice(1)} Everything in “${ctx.subject}” is practice at that one thing — the rest is context.`;
}

function roleAnswer(ctx: CoachContext): string {
  const area = ctx.competency ? ctx.competency.short : "this";
  return `You are a ${LEARNER_PROFILE.role} in ${LEARNER_PROFILE.department} at ${LEARNER_PROFILE.entity}. The realistic use of ${area} in that job is the recurring work: campaign briefs, public notices, reporting upward. Take the next one of those that lands on your desk and run it through what you have just read, then compare the review time against your usual.`;
}

function readingAnswer(ctx: CoachContext): string {
  const resource = ctx.competency ? resourcesForCompetency(ctx.competency.id)[0] : undefined;
  if (!resource) {
    return "Finish what is open first — the pathway will surface the next resource as soon as this item is marked complete.";
  }
  return `Read “${resource.title}” next — ${resource.kind.toLowerCase()}, ${resource.readTime}. ${resource.summary} It is already in your pathway, so completing it counts.`;
}

function projectAnswer(ctx: CoachContext): string {
  const area = ctx.competency ? ctx.competency.short : "this capability";
  return `Directly. Your Workplace Project has to show a measurable gain on real departmental work, and ${area} is what produces that gain. Keep a note of anything here that maps to a task your team repeats — that note is the first draft of your project brief.`;
}

function stuckAnswer(ctx: CoachContext): string {
  return `Nothing here is graded on speed. Re-read the key points, then try the smallest version of the task: one paragraph, one prompt, one check. If it still will not land, mark it and move on — I will bring it back later in your pathway rather than let it block you.${ctx.detail ? ` (${ctx.detail})` : ""}`;
}

function evidenceAnswer(ctx: CoachContext): string {
  const area = ctx.competency ? ctx.competency.label : "this capability";
  return `Everything you complete here feeds two places: your Capability Profile, where ${area} is tracked over time, and your line manager's view, where it appears as evidence rather than attendance. That is why the activities ask for output rather than a tick.`;
}

export function coachPrompts(ctx: CoachContext): CoachPrompt[] {
  return [
    { id: "simpler", label: "Explain this more simply", answer: simplerAnswer(ctx) },
    { id: "role", label: "How does this apply to my role?", answer: roleAnswer(ctx) },
    { id: "reading", label: "What should I read next?", answer: readingAnswer(ctx) },
    { id: "project", label: "How does this help my Workplace Project?", answer: projectAnswer(ctx) },
    { id: "stuck", label: "I'm stuck on this", answer: stuckAnswer(ctx) },
  ];
}

/** Keyword routing for anything the learner types themselves. */
export function coachReply(text: string, ctx: CoachContext): string {
  const t = text.toLowerCase();
  if (t.includes("simpl") || t.includes("explain") || t.includes("mean") || t.includes("understand")) {
    return simplerAnswer(ctx);
  }
  if (t.includes("role") || t.includes("job") || t.includes("my work") || t.includes("example")) {
    return roleAnswer(ctx);
  }
  if (t.includes("read") || t.includes("resource") || t.includes("article") || t.includes("next")) {
    return readingAnswer(ctx);
  }
  if (t.includes("project") || t.includes("evaluat")) return projectAnswer(ctx);
  if (t.includes("stuck") || t.includes("hard") || t.includes("help") || t.includes("confus")) {
    return stuckAnswer(ctx);
  }
  if (t.includes("profile") || t.includes("manager") || t.includes("count") || t.includes("evidence")) {
    return evidenceAnswer(ctx);
  }
  return `Good question. Held against “${ctx.subject}”, the thing that matters is judgement rather than recall: can you tell when the AI output is ready to use, and can you show why. ${
    ctx.competency ? `That is what ${ctx.competency.label} is measuring.` : ""
  } Ask me to simplify any part of it, or to connect it to your own work.`;
}
