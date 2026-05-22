export function YouTubeEmbedPlayer({
  title,
  videoId,
}: {
  title: string;
  videoId: string;
}) {
  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="size-full"
      referrerPolicy="strict-origin-when-cross-origin"
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title={title}
    />
  );
}
