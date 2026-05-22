import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterableLiveGrid } from "@/components/media/FilterableLiveGrid";
import { getLiveChannels } from "@/lib/data/catalog";

export const metadata = {
  title: "Live TV",
};

export default async function LiveTvPage() {
  const liveChannels = await getLiveChannels();

  return (
    <PrivateShell>
      <div className="space-y-6">
        <PageHeader
          description="Approved live channels only. Pending or legally unconfirmed imports remain out of the watchable grid."
          eyebrow="Private live catalog"
          title="Live TV"
        />
        <FilterableLiveGrid channels={liveChannels} />
      </div>
    </PrivateShell>
  );
}
