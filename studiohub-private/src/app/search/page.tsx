import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterableSearch } from "@/components/media/FilterableSearch";
import { getLiveChannels, getMediaItems } from "@/lib/data/catalog";

export const metadata = {
  title: "Search",
};

export default async function SearchPage() {
  const [mediaItems, liveChannels] = await Promise.all([
    getMediaItems(),
    getLiveChannels(),
  ]);

  return (
    <PrivateShell>
      <div className="space-y-6">
        <PageHeader
          description="Search across approved movies, TV shows, and live channels in the private catalog."
          eyebrow="Global search"
          title="Search"
        />
        <FilterableSearch channels={liveChannels} media={mediaItems} />
      </div>
    </PrivateShell>
  );
}
