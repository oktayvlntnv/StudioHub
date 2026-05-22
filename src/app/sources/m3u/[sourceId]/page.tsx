import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { M3USourceActions } from "@/components/sources/M3USourceActions";
import { M3USourceEditor } from "@/components/sources/M3USourceEditor";
import { ReviewQueueTable } from "@/components/sources/ReviewQueueTable";
import { getM3USource, getPendingReviewItems } from "@/lib/data/catalog";

interface M3USourceDetailPageProps {
  params: Promise<{ sourceId: string }>;
}

export async function generateMetadata({ params }: M3USourceDetailPageProps) {
  const { sourceId } = await params;
  const source = await getM3USource(sourceId);
  return {
    title: source ? `${source.name} | M3U Source` : "M3U Source",
  };
}

export default async function M3USourceDetailPage({
  params,
}: M3USourceDetailPageProps) {
  const { sourceId } = await params;
  const [source, pendingReviewItems] = await Promise.all([
    getM3USource(sourceId),
    getPendingReviewItems(),
  ]);

  if (!source) notFound();

  const sourcePendingItems = pendingReviewItems.filter(
    (item) => item.sourceType === "m3u" && item.sourceId === source.id,
  );

  return (
    <PrivateShell>
      <div className="space-y-8">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-slate-200 outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
          href="/sources/m3u"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to M3U sources
        </Link>

        <PageHeader
          description="Edit this legal M3U source and manage only its M3U channels."
          eyebrow="M3U source"
          title={source.name}
        />

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <M3USourceEditor source={source} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-xl font-bold text-white">Bulk review actions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              These actions are scoped by source id and `source_type = m3u`, so
              Xtream sources, manual channels, and other providers are not touched.
            </p>
            <div className="mt-5">
              <M3USourceActions
                source={source}
                redirectAfterDelete="/sources/m3u"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Pending channels</h2>
          <ReviewQueueTable items={sourcePendingItems} />
        </section>
      </div>
    </PrivateShell>
  );
}
