import { ListChecks } from "lucide-react";
import type { IptvSource } from "@/types/studiohub";
import { M3USourceActions } from "@/components/sources/M3USourceActions";
import { EmptyState } from "@/components/ui/EmptyState";

interface M3USourceListProps {
  sources: IptvSource[];
}

export function M3USourceList({ sources }: M3USourceListProps) {
  if (!sources.length) {
    return (
      <EmptyState
        title="No M3U sources yet"
        body="Import a legal M3U URL or upload an authorized playlist file to create a source."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sources.map((source) => (
        <article
          className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
          key={source.id}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {source.sourceType.replace("_", " ")}
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">{source.name}</h2>
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

          <p className="mt-4 text-sm leading-6 text-slate-400">{source.notes}</p>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
            <ListChecks className="size-5 shrink-0 text-amber-100" />
            Bulk actions only affect channels where source type is M3U and the
            source id matches this list.
          </div>

          <div className="mt-5">
            <M3USourceActions source={source} redirectAfterDelete="/sources/m3u" />
          </div>
        </article>
      ))}
    </div>
  );
}
