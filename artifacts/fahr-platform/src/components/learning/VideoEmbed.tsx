/**
 * A lesson video, embedded from YouTube's no-cookie host.
 *
 * There is deliberately no poster or play-button fallback: this component
 * renders nothing useful for a video lesson without a `videoId`. `videoId` is
 * optional on `Lesson` (it is only meaningful for `type: "video"`), so the
 * compiler cannot catch a missing one — the guarantee that every video lesson
 * in the catalogue has a playable id is enforced instead by
 * `src/test/course-content.test.ts`.
 */
export function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-[#171310]">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        data-testid={`video-${videoId}`}
      />
    </div>
  );
}
