import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterableMediaGrid } from "@/components/media/FilterableMediaGrid";
import { getMediaItems } from "@/lib/data/catalog";

export const metadata = {
  title: "Movies",
};

export default async function MoviesPage() {
  const mediaItems = await getMediaItems();

  return (
    <PrivateShell>
      <div className="space-y-6">
        <PageHeader
          description="Approved movie entries with access, playback, and source labels visible at a glance."
          eyebrow="Private catalog"
          title="Movies"
        />
        <FilterableMediaGrid items={mediaItems} mediaType="movie" />
      </div>
    </PrivateShell>
  );
}
