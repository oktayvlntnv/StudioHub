"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ReviewQueueItem } from "@/types/studiohub";

interface ReviewQueueTableProps {
  items: ReviewQueueItem[];
}

export function ReviewQueueTable({ items }: ReviewQueueTableProps) {
  const router = useRouter();
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  async function review(
    item: ReviewQueueItem,
    reviewStatus: "approved" | "rejected",
  ) {
    setRunningId(`${item.id}-${reviewStatus}`);
    setStatus(null);
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemType: item.type === "Live channel" ? "live" : "media",
          id: item.id,
          status: reviewStatus,
          notes:
            reviewStatus === "approved"
              ? "Owner approved legal status."
              : "Owner rejected this item.",
        }),
      });
      const result = await response.json();
      setStatus({
        kind: response.ok ? "success" : "error",
        message: result.message ?? result.error ?? "Review updated.",
      });
      if (response.ok) router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Review update failed.",
      });
    } finally {
      setRunningId(null);
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
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Badges</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="min-w-64 px-4 py-4">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-slate-400">{item.notes}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                      {item.type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                      {item.source}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-64 flex-wrap gap-2">
                        <StatusBadge kind="access" value={item.accessType} />
                        <StatusBadge kind="source" value={item.sourceType} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="min-h-10 rounded-xl bg-teal-300 px-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={Boolean(runningId)}
                          onClick={() => review(item, "approved")}
                          type="button"
                        >
                          {runningId === `${item.id}-approved`
                            ? "Approving..."
                            : "Approve"}
                        </button>
                        <button
                          className="min-h-10 rounded-xl border border-white/10 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={Boolean(runningId)}
                          onClick={() => review(item, "rejected")}
                          type="button"
                        >
                          {runningId === `${item.id}-rejected`
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                    No pending review items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
