"use client";

import { FormEvent, useState } from "react";
import type { OwnerSettings } from "@/types/studiohub";

interface SettingsFormProps {
  settings: OwnerSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [hideUnknown, setHideUnknown] = useState(settings.hideUnknownAccess);
  const [hideUnconfirmed, setHideUnconfirmed] = useState(
    settings.hideUnconfirmedSources,
  );
  const [preference, setPreference] = useState(settings.defaultPlaybackPreference);
  const [languages, setLanguages] = useState(settings.preferredLanguages.join(", "));
  const [countries, setCountries] = useState(settings.preferredCountries.join(", "));
  const [categories, setCategories] = useState(
    settings.preferredCategories.join(", "),
  );
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);
    const toList = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferredLanguages: toList(languages),
          preferredCountries: toList(countries),
          preferredCategories: toList(categories),
          defaultPlaybackPreference: preference,
          hideUnknownAccess: hideUnknown,
          hideUnconfirmedSources: hideUnconfirmed,
        }),
      });
      const result = await response.json();
      setStatus({
        kind: response.ok ? "success" : "error",
        message: result.message ?? result.error ?? "Settings saved.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <h2 className="text-xl font-bold text-white">Preferences</h2>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Languages</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => setLanguages(event.target.value)}
            value={languages}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Countries</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => setCountries(event.target.value)}
            value={countries}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Categories</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => setCategories(event.target.value)}
            value={categories}
          />
        </label>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <h2 className="text-xl font-bold text-white">Safety defaults</h2>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-200">
            Default playback preference
          </legend>
          <div className="mt-3 grid gap-3">
            {[
              ["in_app", "Prefer in-app playback"],
              ["official_provider", "Prefer official provider page"],
            ].map(([value, label]) => (
              <label
                className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-slate-200"
                key={value}
              >
                <input
                  checked={preference === value}
                  className="size-4 accent-teal-300"
                  onChange={() =>
                    setPreference(value as OwnerSettings["defaultPlaybackPreference"])
                  }
                  type="radio"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-slate-200">
          Hide unknown access content
          <input
            checked={hideUnknown}
            className="size-5 accent-teal-300"
            onChange={(event) => setHideUnknown(event.target.checked)}
            type="checkbox"
          />
        </label>
        <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-slate-200">
          Hide unconfirmed sources
          <input
            checked={hideUnconfirmed}
            className="size-5 accent-teal-300"
            onChange={(event) => setHideUnconfirmed(event.target.checked)}
            type="checkbox"
          />
        </label>
        <button
          className="min-h-12 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-100"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </button>
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
      </section>
    </form>
  );
}
