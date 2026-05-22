import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterableMediaGrid } from "@/components/media/FilterableMediaGrid";
import { getMediaItems } from "@/lib/data/catalog";

export const metadata = {
  title: "TV Shows",
};

export default async function TvShowsPage() {
  const mediaItems = await getMediaItems();

  return (
    <PrivateShell>
      <div className="space-y-6">
        <PageHeader
          description="Private TV collection with legal source metadata and approval-safe filtering."
          eyebrow="Private catalog"
          title="TV Shows"
        />
        <FilterableMediaGrid items={mediaItems} mediaType="tv" />
      </div>
    </PrivateShell>
  );
}
