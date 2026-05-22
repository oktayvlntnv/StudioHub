"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { IptvSource } from "@/types/studiohub";

interface M3USourceEditorProps {
  source: IptvSource;
}

export function M3USourceEditor({ source }: M3USourceEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: source.name,
    sourceUrl: source.sourceUrl ?? "",
    epgUrl: source.epgUrl ?? "",
    country: source.country,
    notes: source.notes,
    isEnabled: source.isEnabled,
    isLegalConfirmed: source.isLegalConfirmed,
    providerWebsite: source.providerWebsite ?? "",
    legalContactInfo: source.legalContactInfo ?? "",
  });
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/sources/m3u/${source.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save source.");
      setStatus({
        kind: "success",
        message: result.message ?? "M3U source saved.",
      });
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not save source.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5"
      onSubmit={save}
    >
      <div>
        <h2 className="text-xl font-bold text-white">Edit source</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Update source metadata and legal status. Stream URLs are never printed in
          logs or exposed beyond this owner-only form.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Name</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("name", event.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Country</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("country", event.target.value)}
            value={form.country}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">M3U URL</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            placeholder="https://example.com/authorized-playlist.m3u"
            type="url"
            value={form.sourceUrl}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">EPG URL</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            onChange={(event) => updateField("epgUrl", event.target.value)}
            placeholder="https://example.com/authorized-epg.xml"
            type="url"
            value={form.epgUrl}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">
            Provider website
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            onChange={(event) => updateField("providerWebsite", event.target.value)}
            placeholder="https://provider.example.com"
            type="url"
            value={form.providerWebsite}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-slate-200">
            <input
              checked={form.isEnabled}
              className="size-4 accent-teal-300"
              onChange={(event) => updateField("isEnabled", event.target.checked)}
              type="checkbox"
            />
            Enabled
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-slate-200">
            <input
              checked={form.isLegalConfirmed}
              className="size-4 accent-teal-300"
              onChange={(event) =>
                updateField("isLegalConfirmed", event.target.checked)
              }
              type="checkbox"
            />
            Legal confirmed
          </label>
        </div>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-200">Notes</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("notes", event.target.value)}
            value={form.notes}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-200">
            Legal contact/license info
          </span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-teal-300/50"
            onChange={(event) =>
              updateField("legalContactInfo", event.target.value)
            }
            value={form.legalContactInfo}
          />
        </label>
      </div>

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

      <button
        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-teal-100"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
