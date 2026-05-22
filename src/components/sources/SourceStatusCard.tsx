"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, PauseCircle } from "lucide-react";
import type { IptvSource } from "@/types/studiohub";
import { M3USourceActions } from "@/components/sources/M3USourceActions";

interface SourceStatusCardProps {
  source: IptvSource;
}

export function SourceStatusCard({ source }: SourceStatusCardProps) {
  const [status, setStatus] = useState<string | null>(null);
  const isM3U = source.sourceType === "m3u_url" || source.sourceType === "m3u_file";
  const StatusIcon =
    source.lastStatus === "success"
      ? CheckCircle2
      : source.lastStatus === "failed"
        ? CircleAlert
        : PauseCircle;

  async function runAction(action: string) {
    if (action === "Test" && source.sourceType === "xtream") {
      const response = await fetch("/api/sources/xtream/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceId: source.id }),
      });
      const result = await response.json();
      setStatus(result.message ?? result.error ?? "Test completed.");
      return;
    }

    if (action === "Import" && source.sourceType === "xtream") {
      const response = await fetch("/api/sources/xtream/import/live", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceId: source.id }),
      });
      const result = await response.json();
      setStatus(result.message ?? result.error ?? "Import completed.");
      return;
    }

    setStatus(`${action} is ready for the connected backend phase.`);
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {source.sourceType.replace("_", " ")}
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{source.name}</h3>
          <p className="mt-2 text-sm text-slate-300">{source.providerName}</p>
        </div>
        <StatusIcon
          className={
            source.lastStatus === "success"
              ? "size-6 text-emerald-200"
              : source.lastStatus === "failed"
                ? "size-6 text-rose-200"
                : "size-6 text-slate-400"
          }
          aria-hidden="true"
        />
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Enabled</dt>
          <dd className="font-semibold text-white">{source.isEnabled ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Legal confirmed</dt>
          <dd className="font-semibold text-white">
            {source.isLegalConfirmed ? "Yes" : "No"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Last import</dt>
          <dd>{source.lastImportedAt ?? "Never"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Items</dt>
          <dd>{source.importedItems}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-slate-400">{source.notes}</p>
      {status ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
          {status}
        </p>
      ) : null}
      {isM3U ? (
        <div className="mt-5">
          <M3USourceActions compact source={source} redirectAfterDelete="/sources" />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["Edit", "Test", "Import", source.isEnabled ? "Disable" : "Enable"].map(
            (action) => (
              <button
                className="min-h-11 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
                key={action}
                onClick={() => runAction(action)}
                type="button"
              >
                {action}
              </button>
            ),
          )}
        </div>
      )}
    </article>
  );
}
