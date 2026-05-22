import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { M3UImportForm } from "@/components/sources/M3UImportForm";
import { M3USourceList } from "@/components/sources/M3USourceList";
import { ReviewQueueTable } from "@/components/sources/ReviewQueueTable";
import { getM3USources, getPendingReviewItems } from "@/lib/data/catalog";

export const metadata = {
  title: "M3U Sources",
};

export default async function M3USourcesPage() {
  const [m3uSources, pendingReviewItems] = await Promise.all([
    getM3USources(),
    getPendingReviewItems(),
  ]);

  return (
    <PrivateShell>
      <div className="space-y-8">
        <PageHeader
          description="Owner-only workflow for legal M3U URL or file imports, source edits, deletion, and bulk channel review."
          eyebrow="Source management"
          title="M3U sources"
        />
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Configured M3U lists</h2>
          <M3USourceList sources={m3uSources} />
        </section>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <M3UImportForm />
          <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-xl font-bold text-white">Review defaults</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Imported channels start as pending review.</li>
              <li>Legal confirmation is required before visibility.</li>
              <li>Approved channels can appear on the Live TV page.</li>
              <li>EPG URL storage is represented but not parsed yet.</li>
            </ul>
          </section>
        </div>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">M3U review queue</h2>
          <ReviewQueueTable
            items={pendingReviewItems.filter((item) => item.sourceType === "m3u")}
          />
        </section>
      </div>
    </PrivateShell>
  );
}
