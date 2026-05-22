import { PrivateShell } from "@/components/layout/PrivateShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { XtreamSourceForm } from "@/components/sources/XtreamSourceForm";
import { XtreamSourceActions } from "@/components/sources/XtreamSourceActions";
import { ReviewQueueTable } from "@/components/sources/ReviewQueueTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPendingReviewItems, getXtreamSources } from "@/lib/data/catalog";

export const metadata = {
  title: "Xtream Sources",
};

export default async function XtreamSourcesPage() {
  const [pendingReviewItems, xtreamSources] = await Promise.all([
    getPendingReviewItems(),
    getXtreamSources(),
  ]);

  return (
    <PrivateShell>
      <div className="space-y-8">
        <PageHeader
          description="Owner-only workflow for verified legal Xtream-compatible providers. Credentials stay encrypted server-side and never appear in API responses."
          eyebrow="Source management"
          title="Xtream sources"
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <XtreamSourceForm />
          <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-xl font-bold text-white">Connector boundaries</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Credentials stay encrypted on the server.</li>
              <li>Raw provider API responses are not exposed to the browser.</li>
              <li>Sources save disabled until legal confirmation and testing.</li>
              <li>No proxying, DRM bypass, token bypass, or hidden restreaming.</li>
            </ul>
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Configured Xtream sources</h2>
          {xtreamSources.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {xtreamSources.map((source) => (
                <article
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
                  key={source.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Xtream
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-white">
                        {source.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {source.country || "Unknown country"}
                      </p>
                    </div>
                    <span
                      className={
                        source.isEnabled
                          ? "rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100"
                          : "rounded-full border border-slate-300/20 bg-slate-300/10 px-3 py-1 text-xs font-bold text-slate-300"
                      }
                    >
                      {source.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Last tested</dt>
                      <dd>{source.lastTestedAt ?? "Never"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Last status</dt>
                      <dd>{source.lastStatus}</dd>
                    </div>
                  </dl>
                  {source.notes ? (
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      {source.notes}
                    </p>
                  ) : null}
                  <div className="mt-5">
                    <XtreamSourceActions source={source} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              body="Add a verified legal provider above. New sources remain disabled until you test and review imported items."
              title="No Xtream sources yet"
            />
          )}
        </section>

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
