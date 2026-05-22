"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2, MonitorPlay, PlugZap, Tv } from "lucide-react";
import type { IptvSource } from "@/types/studiohub";

interface XtreamSourceActionsProps {
  compact?: boolean;
  source: IptvSource;
}

const actions = [
  {
    endpoint: "/api/sources/xtream/test",
    icon: PlugZap,
    label: "Test",
    loadingLabel: "Testing...",
    successFallback: "Connection test completed.",
  },
  {
    endpoint: "/api/sources/xtream/import/live",
    icon: Tv,
    label: "Import live",
    loadingLabel: "Importing live...",
    successFallback: "Live import completed.",
  },
  {
    endpoint: "/api/sources/xtream/import/movies",
    icon: Clapperboard,
    label: "Import movies",
    loadingLabel: "Importing movies...",
    successFallback: "Movie import completed.",
  },
  {
    endpoint: "/api/sources/xtream/import/series",
    icon: MonitorPlay,
    label: "Import series",
    loadingLabel: "Importing series...",
    successFallback: "Series import completed.",
  },
];

export function XtreamSourceActions({
  compact = false,
  source,
}: XtreamSourceActionsProps) {
  const router = useRouter();
  const [runningEndpoint, setRunningEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  async function runAction(action: (typeof actions)[number]) {
    setRunningEndpoint(action.endpoint);
    setStatus(null);

    try {
      const response = await fetch(action.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceId: source.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? `${action.label} failed.`);
      }

      const imported =
        typeof result.itemsImported === "number"
          ? ` Imported ${result.itemsImported} of ${result.itemsFound ?? result.itemsImported} items.`
          : "";

      setStatus({
        kind: "success",
        message: `${result.message ?? action.successFallback}${imported}`,
      });
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : `${action.label} failed.`,
      });
    } finally {
      setRunningEndpoint(null);
    }
  }

  return (
    <div className="space-y-3">
      {status ? (
        <p
          className={
            status.kind === "success"
              ? "rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"
              : "rounded-xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
          }
        >
          {status.message}
        </p>
      ) : null}

      <div
        className={
          compact
            ? "grid grid-cols-2 gap-2"
            : "grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
        }
      >
        {actions.map((action) => {
          const Icon = action.icon;
          const isRunning = runningEndpoint === action.endpoint;
          return (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white outline-none transition enabled:hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-300"
              disabled={Boolean(runningEndpoint)}
              key={action.endpoint}
              onClick={() => runAction(action)}
              type="button"
            >
              {isRunning ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Icon className="size-4" aria-hidden="true" />
              )}
              {isRunning ? action.loadingLabel : action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
