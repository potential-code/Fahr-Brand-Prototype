// The course player renders no fallback for a video lesson without an id — it
// renders nothing at all. That is deliberate, but it means the guarantee has
// to be enforced somewhere, and the type cannot do it while `videoId` is
// optional.
import { describe, it, expect } from "vitest";
import { COURSES } from "@/lib/learningData";

describe("every video lesson can actually play", () => {
  it("has a videoId on every lesson of type video", () => {
    const videoLessons = COURSES.flatMap((course) =>
      [...course.groups.flatMap((group) => group.lessons), ...course.revisionUnits].filter(
        (l) => l.type === "video",
      ),
    );

    expect(videoLessons.length).toBeGreaterThan(0);
    for (const lesson of videoLessons) {
      expect(lesson.videoId, `"${lesson.title}" has no videoId`).toBeTruthy();
    }
  });
});
