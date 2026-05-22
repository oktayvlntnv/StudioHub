"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import type { IptvSource, M3UChannelStats } from "@/types/studiohub";

type BulkAction = "approve_all" | "reject_all" | "delete_pending" | "delete_all";
type ConfirmAction = BulkAction | "delete_source";

interface M3USourceActionsProps {
  source: IptvSource;
  compact?: boolean;
  redirectAfterDelete?: string;
}

const actionLabels: Record<ConfirmAction, string> = {
  approve_all: "Accept all pending",
  reject_all: "Reject all pending",
  delete_pending: "Delete pending",
  delete_all: "Delete all channels",
  delete_source: "Delete source",
};

const actionDescriptions: Record<ConfirmAction, string> = {
  approve_all:
    "Only pending M3U channels from this source will be approved and marked legally confirmed.",
  reject_all:
    "Only pending M3U channels from this source will be rejected and marked unconfirmed.",
  delete_pending:
    "Only pending M3U channels from this source will be deleted. Approved/rejected channels stay untouched.",
  delete_all:
    "All M3U channels from this source will be deleted. Xtream, manual, and other-source channels stay untouched.",
  delete_source:
    "The M3U source, its M3U channels, and its import logs will be deleted. Xtream and manual sources stay untouched.",
};

export function M3USourceActions({
  source,
  compact = false,
  redirectAfterDelete,
}: M3USourceActionsProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [strongValue, setStrongValue] = useState("");
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const stats = source.channelStats;
  const isRunning = Boolean(runningAction);

  const modalIsStrong = confirmAction
    ? confirmAction === "delete_source" || confirmAction === "delete_all"
    : false;
  const canConfirm = !modalIsStrong || strongValue.trim().toUpperCase() === "DELETE";

  async function requestJson(url: string, init: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? "Action failed.");
    }
    return result as { message?: string; stats?: M3UChannelStats };
  }

  async function toggleEnabled() {
    setStatus(null);
    setRunningAction(source.isEnabled ? "Disabling..." : "Enabling...");
    try {
      const result = await requestJson(`/api/sources/m3u/${source.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: !source.isEnabled }),
      });
      setStatus({
        kind: "success",
        message:
          result.message ??
          (source.isEnabled ? "M3U source disabled." : "M3U source enabled."),
      });
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction || !canConfirm) return;
    setStatus(null);
    setRunningAction(actionLabels[confirmAction]);

    try {
      const result =
        confirmAction === "delete_source"
          ? await requestJson(`/api/sources/m3u/${source.id}`, { method: "DELETE" })
          : await requestJson(`/api/sources/m3u/${source.id}/channels`, {
              method: "POST",
              body: JSON.stringify({ action: confirmAction }),
            });

      setStatus({
        kind: "success",
        message: result.message ?? `${actionLabels[confirmAction]} completed.`,
      });
      setConfirmAction(null);
      setStrongValue("");

      if (confirmAction === "delete_source" && redirectAfterDelete) {
        router.push(redirectAfterDelete);
        return;
      }
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  const buttons = useMemo(
    () => [
      {
        label: "Accept all pending",
        action: "approve_all" as const,
        tone:
          "border-teal-300/30 bg-teal-300/10 text-teal-100 hover:bg-teal-300/15",
        hidden: compact,
      },
      {
        label: "Reject all pending",
        action: "reject_all" as const,
        tone:
          "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15",
        hidden: compact,
      },
      {
        label: "Delete pending",
        action: "delete_pending" as const,
        tone:
          "border-rose-300/25 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15",
        hidden: compact,
      },
      {
        label: "Delete all channels",
        action: "delete_all" as const,
        tone:
          "border-rose-300/35 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15",
        hidden: compact,
      },
    ],
    [compact],
  );

  return (
    <div className="space-y-4">
      {stats ? <M3UStatsGrid stats={stats} /> : null}

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

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
          href={`/sources/m3u/${source.id}`}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Edit source
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-300"
          disabled={isRunning}
          onClick={toggleEnabled}
          type="button"
        >
          {runningAction?.includes(source.isEnabled ? "Disabling" : "Enabling") ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {source.isEnabled ? "Disable" : "Enable"}
        </button>
        {buttons
          .filter((button) => !button.hidden)
          .map((button) => (
            <button
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-300 ${button.tone}`}
              disabled={isRunning}
              key={button.action}
              onClick={() => setConfirmAction(button.action)}
              type="button"
            >
              {button.label}
            </button>
          ))}
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/35 bg-rose-300/10 px-3 text-sm font-bold text-rose-100 outline-none transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-200"
          disabled={isRunning}
          onClick={() => setConfirmAction("delete_source")}
          type="button"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete source
        </button>
      </div>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1017] p-5 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 size-6 shrink-0 text-amber-100" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {actionLabels[confirmAction]}?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {actionDescriptions[confirmAction]}
                </p>
              </div>
            </div>

            {modalIsStrong ? (
              <label className="mt-5 block">
                <span className="text-sm font-semibold text-slate-200">
                  Type DELETE to confirm
                </span>
                <input
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-rose-300/60"
                  onChange={(event) => setStrongValue(event.target.value)}
                  value={strongValue}
                />
              </label>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-white outline-none transition hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-teal-300"
                disabled={isRunning}
                onClick={() => {
                  setConfirmAction(null);
                  setStrongValue("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-300 px-4 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-100"
                disabled={isRunning || !canConfirm}
                onClick={runConfirmedAction}
                type="button"
              >
                {isRunning ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : confirmAction === "approve_all" ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4" aria-hidden="true" />
                )}
                {isRunning ? "Working..." : actionLabels[confirmAction]}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function M3UStatsGrid({ stats }: { stats: M3UChannelStats }) {
  const items = [
    ["Total", stats.total],
    ["Pending", stats.pending],
    ["Approved", stats.approved],
    ["Rejected", stats.rejected],
  ];

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-3"
          key={label}
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </dt>
          <dd className="mt-1 text-lg font-bold text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
