import type { MediaItem } from "@/types/studiohub";
import { MediaCard } from "@/components/media/MediaCard";

interface ContentCarouselProps {
  title: string;
  items: MediaItem[];
}

export function ContentCarousel({ title, items }: ContentCarouselProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="no-scrollbar grid grid-flow-col auto-cols-[78%] gap-4 overflow-x-auto pb-2 sm:auto-cols-[42%] lg:auto-cols-[24%] 2xl:auto-cols-[19%]">
        {items.map((item) => (
          <MediaCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
