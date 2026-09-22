/**
 * A lesson video, embedded from YouTube's no-cookie host.
 *
 * There is deliberately no poster or play-button fallback: a video lesson
 * without a `videoId` should fail the build, not render an empty black box in
 * front of a client.
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
        data-testid={`video-${videoId}`}
      />
    </div>
  );
}
