"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Plus,
  Save,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import type {
  Provider,
  ProviderAccessType,
  ProviderPlaybackType,
  ProviderType,
} from "@/types/studiohub";
import { accessTypeLabels, playbackTypeLabels } from "@/lib/labels";

const providerTypeLabels: Record<ProviderType, string> = {
  free_avod: "Free AVOD",
  free_live_tv: "Free live TV",
  youtube: "YouTube",
  public_broadcaster: "Public broadcaster",
  official_provider: "Official provider",
};

const emptyForm = {
  name: "",
  slug: "",
  websiteUrl: "",
  logoUrl: "",
  providerType: "official_provider" as ProviderType,
  defaultPlaybackType: "external_link" as ProviderPlaybackType,
  defaultAccessType: "unknown" as ProviderAccessType,
  countryAvailability: "Global",
  isEnabled: true,
  notes: "",
};

type ProviderFormState = typeof emptyForm;

interface ProviderManagementPanelProps {
  providers: Provider[];
}

export function ProviderManagementPanel({
  providers,
}: ProviderManagementPanelProps) {
  const router = useRouter();
  const [addForm, setAddForm] = useState<ProviderFormState>(emptyForm);
  const [edits, setEdits] = useState<Record<string, ProviderFormState>>(() =>
    Object.fromEntries(providers.map((provider) => [provider.id, toForm(provider)])),
  );
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function saveProvider(form: ProviderFormState, id?: string) {
    setStatus(null);
    const actionId = id ? `save-${id}` : "add";
    setRunningAction(actionId);
    try {
      const response = await fetch("/api/providers", {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toPayload(form, id)),
      });
      const result = await response.json();
      setStatus({
        kind: response.ok ? "success" : "error",
        message:
          result.message ??
          result.error ??
          (id ? "Provider updated." : "Provider added."),
      });
      if (response.ok) {
        if (!id) setAddForm(emptyForm);
        startTransition(() => router.refresh());
      }
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Provider save failed.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  async function toggleProvider(provider: Provider) {
    setStatus(null);
    setRunningAction(`toggle-${provider.id}`);
    try {
      const response = await fetch("/api/providers", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: provider.id, isEnabled: !provider.isEnabled }),
      });
      const result = await response.json();
      setStatus({
        kind: response.ok ? "success" : "error",
        message: result.message ?? result.error ?? "Provider status updated.",
      });
      if (response.ok) startTransition(() => router.refresh());
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Provider update failed.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  async function deleteProvider(provider: Provider) {
    const confirmed = window.confirm(
      `Delete ${provider.name}? Existing provider links may lose their provider metadata. This does not delete media items.`,
    );
    if (!confirmed) return;

    setStatus(null);
    setRunningAction(`delete-${provider.id}`);
    try {
      const response = await fetch(
        `/api/providers?id=${encodeURIComponent(provider.id)}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      setStatus({
        kind: response.ok ? "success" : "error",
        message: result.message ?? result.error ?? "Provider deleted.",
      });
      if (response.ok) startTransition(() => router.refresh());
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Provider delete failed.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5"
        onSubmit={(event) => {
          event.preventDefault();
          saveProvider(addForm);
        }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">Add official provider</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add provider metadata and default behavior. Provider catalogs are not
            scraped; titles still need explicit official links.
          </p>
        </div>
        <ProviderFields form={addForm} onChange={setAddForm} />
        <button
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-100"
          disabled={isPending || Boolean(runningAction) || !addForm.name}
          type="submit"
        >
          <Plus className="size-4" aria-hidden="true" />
          {runningAction === "add" ? "Adding..." : "Add provider"}
        </button>
      </form>

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

      <section className="grid gap-4 xl:grid-cols-2">
        {providers.map((provider) => {
          const form = edits[provider.id] ?? toForm(provider);
          return (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
              key={provider.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{provider.name}</h2>
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-slate-300">
                      {provider.slug}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {providerTypeLabels[provider.providerType]} |{" "}
                    {provider.countryAvailability.join(", ") || "No countries set"}
                  </p>
                </div>
                <span
                  className={
                    provider.isEnabled
                      ? "rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100"
                      : "rounded-full border border-slate-300/20 bg-slate-300/10 px-3 py-1 text-xs font-bold text-slate-300"
                  }
                >
                  {provider.isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {playbackTypeLabels[provider.defaultPlaybackType]}
                </span>
                <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-100">
                  {accessTypeLabels[provider.defaultAccessType]}
                </span>
              </div>

              {provider.notes ? (
                <p className="mt-4 text-sm leading-6 text-slate-300">{provider.notes}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {provider.websiteUrl ? (
                  <a
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
                    href={provider.websiteUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Website
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
                  disabled={Boolean(runningAction)}
                  onClick={() => toggleProvider(provider)}
                  type="button"
                >
                  {provider.isEnabled ? (
                    <ToggleRight className="size-4 text-emerald-200" aria-hidden="true" />
                  ) : (
                    <ToggleLeft className="size-4 text-slate-300" aria-hidden="true" />
                  )}
                  {runningAction === `toggle-${provider.id}`
                    ? "Saving..."
                    : provider.isEnabled
                      ? "Disable"
                      : "Enable"}
                </button>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 text-sm font-bold text-rose-100 outline-none transition hover:bg-rose-300/15 focus-visible:ring-2 focus-visible:ring-rose-200"
                  disabled={Boolean(runningAction)}
                  onClick={() => deleteProvider(provider)}
                  type="button"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {runningAction === `delete-${provider.id}` ? "Deleting..." : "Delete"}
                </button>
              </div>

              <details className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer text-sm font-bold text-white">
                  Edit provider
                </summary>
                <form
                  className="mt-5 space-y-5"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    saveProvider(form, provider.id);
                  }}
                >
                  <ProviderFields
                    form={form}
                    onChange={(next) =>
                      setEdits((current) => ({ ...current, [provider.id]: next }))
                    }
                  />
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-100"
                    disabled={isPending || Boolean(runningAction)}
                    type="submit"
                  >
                    <Save className="size-4" aria-hidden="true" />
                    {runningAction === `save-${provider.id}`
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </form>
              </details>
            </article>
          );
        })}
      </section>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
        <ShieldCheck className="size-6 text-amber-100" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold text-white">Safety rule</h2>
        <p className="mt-2 text-sm leading-6 text-amber-50/85">
          Providers define where legal playback should happen. StudioHub does not
          scrape provider catalogs, extract stream URLs, bypass DRM, proxy streams,
          or hide provider restrictions.
        </p>
      </div>
    </div>
  );
}

function ProviderFields({
  form,
  onChange,
}: {
  form: ProviderFormState;
  onChange: (form: ProviderFormState) => void;
}) {
  function update<K extends keyof ProviderFormState>(
    field: K,
    value: ProviderFormState[K],
  ) {
    onChange({ ...form, [field]: value });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Name</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("name", event.target.value)}
          required
          value={form.name}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Slug</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("slug", event.target.value)}
          placeholder="auto-generated-from-name"
          value={form.slug}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Website URL</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("websiteUrl", event.target.value)}
          placeholder="https://provider.example.com"
          type="url"
          value={form.websiteUrl}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Logo URL</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("logoUrl", event.target.value)}
          placeholder="https://provider.example.com/logo.png"
          type="url"
          value={form.logoUrl}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Provider type</span>
        <select
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("providerType", event.target.value as ProviderType)}
          value={form.providerType}
        >
          {Object.entries(providerTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">
          Default playback
        </span>
        <select
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) =>
            update("defaultPlaybackType", event.target.value as ProviderPlaybackType)
          }
          value={form.defaultPlaybackType}
        >
          {(["external_link", "youtube_embed", "official_embed"] as const).map(
            (value) => (
              <option key={value} value={value}>
                {playbackTypeLabels[value]}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Default access</span>
        <select
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) =>
            update("defaultAccessType", event.target.value as ProviderAccessType)
          }
          value={form.defaultAccessType}
        >
          {(["no_login_required", "optional_login", "login_required", "unknown"] as const).map(
            (value) => (
              <option key={value} value={value}>
                {accessTypeLabels[value]}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">
          Country availability
        </span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("countryAvailability", event.target.value)}
          placeholder="Global, NL, US"
          value={form.countryAvailability}
        />
      </label>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-slate-200">
        <input
          checked={form.isEnabled}
          className="size-4 accent-teal-300"
          onChange={(event) => update("isEnabled", event.target.checked)}
          type="checkbox"
        />
        Enabled
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-semibold text-slate-200">Notes</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => update("notes", event.target.value)}
          value={form.notes}
        />
      </label>
    </div>
  );
}

function toForm(provider: Provider): ProviderFormState {
  return {
    name: provider.name,
    slug: provider.slug,
    websiteUrl: provider.websiteUrl,
    logoUrl: provider.logoUrl ?? "",
    providerType: provider.providerType,
    defaultPlaybackType: provider.defaultPlaybackType,
    defaultAccessType: provider.defaultAccessType,
    countryAvailability: provider.countryAvailability.join(", "),
    isEnabled: provider.isEnabled,
    notes: provider.notes ?? "",
  };
}

function toPayload(form: ProviderFormState, id?: string) {
  return {
    id,
    ...form,
    countryAvailability: form.countryAvailability
      .split(",")
      .map((country) => country.trim())
      .filter(Boolean),
  };
}
