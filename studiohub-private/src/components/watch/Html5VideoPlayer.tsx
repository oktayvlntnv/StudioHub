export function Html5VideoPlayer({ src }: { src: string }) {
  return (
    <video
      className="size-full bg-black"
      controls
      controlsList="nodownload"
      preload="metadata"
      src={src}
    />
  );
}
