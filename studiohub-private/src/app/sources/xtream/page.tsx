import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { XtreamSourceForm } from "@/components/sources/XtreamSourceForm";
import { ReviewQueueTable } from "@/components/sources/ReviewQueueTable";
import { getPendingReviewItems } from "@/lib/data/catalog";

export const metadata = {
  title: "Xtream Sources",
};

export default async function XtreamSourcesPage() {
  const pendingReviewItems = await getPendingReviewItems();

  return (
    <PrivateShell>
      <div className="space-y-8">
        <PageHeader
          description="Owner-only mock workflow for verified legal Xtream-compatible providers. No credentials are saved or exposed in this frontend MVP."
          eyebrow="Source management"
          title="Xtream sources"
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <XtreamSourceForm />
          <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-xl font-bold text-white">Connector boundaries</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Credentials stay server-side in the future connector.</li>
              <li>Raw provider API responses are not exposed to the browser.</li>
              <li>Sources save disabled until legal confirmation and testing.</li>
              <li>No proxying, DRM bypass, token bypass, or hidden restreaming.</li>
            </ul>
          </section>
        </div>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Xtream review queue</h2>
          <ReviewQueueTable
            items={pendingReviewItems.filter((item) => item.sourceType === "xtream")}
          />
        </section>
      </div>
    </PrivateShell>
  );
}
