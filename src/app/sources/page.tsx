import Link from "next/link";
import { Database, Globe2, ListChecks } from "lucide-react";
import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SourceStatusCard } from "@/components/sources/SourceStatusCard";
import { ImportLogTable } from "@/components/sources/ImportLogTable";
import { LegalDiscoveryPanel } from "@/components/sources/LegalDiscoveryPanel";
import { ReviewQueueTable } from "@/components/sources/ReviewQueueTable";
import { TMDBImportPanel } from "@/components/sources/TMDBImportPanel";
import {
  getImportLogs,
  getPendingReviewItems,
  getSources,
} from "@/lib/data/catalog";

export const metadata = {
  title: "Sources",
};

export default async function SourcesPage() {
  const [sources, importLogs, pendingReviewItems] = await Promise.all([
    getSources(),
    getImportLogs(),
    getPendingReviewItems(),
  ]);

  return (
    <PrivateShell>
      <div className="space-y-8">
        <PageHeader
          actions={
            <>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
                href="/sources/providers"
              >
                <Globe2 className="size-4" aria-hidden="true" />
                Providers
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
                href="/sources/m3u"
              >
                <ListChecks className="size-4" aria-hidden="true" />
                M3U
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
                href="/sources/xtream"
              >
                <Database className="size-4" aria-hidden="true" />
                Xtream
              </Link>
            </>
          }
          description="Admin-only source management with legal confirmation, disabled defaults, and review queues."
          eyebrow="Owner/admin"
          title="Sources"
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {sources.map((source) => (
            <SourceStatusCard source={source} key={source.id} />
          ))}
        </section>

        <TMDBImportPanel />

        <LegalDiscoveryPanel />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Pending review</h2>
          <ReviewQueueTable items={pendingReviewItems} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Import logs</h2>
          <ImportLogTable logs={importLogs} />
        </section>
      </div>
    </PrivateShell>
  );
}
