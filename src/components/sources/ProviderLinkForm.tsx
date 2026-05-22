"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, ShieldCheck } from "lucide-react";
import type {
  AccessType,
  Provider,
  ProviderAccessType,
  ProviderPlaybackType,
  SourceType,
} from "@/types/studiohub";
import { accessTypeLabels, playbackTypeLabels } from "@/lib/labels";

interface ProviderLinkFormProps {
  mediaItemId: string;
  providers: Provider[];
}

const playbackOptions: ProviderPlaybackType[] = [
  "external_link",
  "youtube_embed",
  "official_embed",
];

const accessOptions: ProviderAccessType[] = [
  "no_login_required",
  "optional_login",
  "login_required",
  "unknown",
];

export function ProviderLinkForm({ mediaItemId, providers }: ProviderLinkFormProps) {
  const router = useRouter();
  const enabledProviders = providers.filter((provider) => provider.isEnabled);
  const firstProvider = enabledProviders[0];
  const [providerId, setProviderId] = useState(firstProvider?.id ?? "");
  const selectedProvider = useMemo(
    () => enabledProviders.find((provider) => provider.id === providerId),
    [enabledProviders, providerId],
  );
  const [playbackType, setPlaybackType] = useState<ProviderPlaybackType>(
    firstProvider?.defaultPlaybackType ?? "external_link",
  );
  const [accessType, setAccessType] = useState<ProviderAccessType>(
    firstProvider?.defaultAccessType ?? "unknown",
  );
  const [watchUrl, setWatchUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [isLegalConfirmed, setIsLegalConfirmed] = useState(false);
  const [availabilityCountry, setAvailabilityCountry] = useState("Global");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateProvider(nextProviderId: string) {
    setProviderId(nextProviderId);
    const provider = enabledProviders.find((entry) => entry.id === nextProviderId);
    if (!provider) return;
    setPlaybackType(provider.defaultPlaybackType);
    setAccessType(provider.defaultAccessType);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const sourceType: SourceType =
      selectedProvider?.providerType === "youtube"
        ? "youtube"
        : selectedProvider
          ? "official_provider"
          : "manual";

    const response = await fetch("/api/provider-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mediaItemId,
        providerId,
        watchUrl,
        playbackType,
        accessType: accessType as AccessType,
        sourceType,
        youtubeVideoId: youtubeVideoId || undefined,
        embedUrl,
        isFree,
        isLegalConfirmed,
        availabilityCountry: availabilityCountry
          .split(",")
          .map((country) => country.trim())
          .filter(Boolean),
        notes,
      }),
    });

    const result = await response.json();
    setStatus(result.message ?? result.error ?? "Provider link saved.");
    if (response.ok) {
      setWatchUrl("");
      setEmbedUrl("");
      setYoutubeVideoId("");
      setNotes("");
      setIsLegalConfirmed(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5"
      onSubmit={submit}
    >
      <div>
        <h2 className="text-xl font-bold text-white">Add provider link</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Add one official watch link or approved embed for this title. The app
          will not scrape provider pages or extract stream URLs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Provider</span>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateProvider(event.target.value)}
            required
            value={providerId}
          >
            {!enabledProviders.length ? (
              <option value="">No enabled providers</option>
            ) : null}
            {enabledProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">
            Official watch URL
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            onChange={(event) => setWatchUrl(event.target.value)}
            placeholder="https://provider.example.com/watch/title"
            type="url"
            value={watchUrl}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Playback type</span>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) =>
              setPlaybackType(event.target.value as ProviderPlaybackType)
            }
            value={playbackType}
          >
            {playbackOptions.map((option) => (
              <option key={option} value={option}>
                {playbackTypeLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Access type</span>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => setAccessType(event.target.value as ProviderAccessType)}
            value={accessType}
          >
            {accessOptions.map((option) => (
              <option key={option} value={option}>
                {accessTypeLabels[option]}
              </option>
            ))}
          </select>
        </label>
        {playbackType === "youtube_embed" ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">
              YouTube video ID
            </span>
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
              onChange={(event) => setYoutubeVideoId(event.target.value)}
              placeholder="aqz-KE-bpKQ"
              value={youtubeVideoId}
            />
          </label>
        ) : null}
        {playbackType === "official_embed" ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">
              Official embed URL
            </span>
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
              onChange={(event) => setEmbedUrl(event.target.value)}
              placeholder="https://provider.example.com/embed/title"
              type="url"
              value={embedUrl}
            />
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">
            Availability countries
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => setAvailabilityCountry(event.target.value)}
            placeholder="Global, NL, US"
            value={availabilityCountry}
          />
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-slate-200">
          <input
            checked={isFree}
            className="size-4 accent-teal-300"
            onChange={(event) => setIsFree(event.target.checked)}
            type="checkbox"
          />
          Free to watch
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Notes</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add provider terms, country notes, or review notes."
          value={notes}
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
        <input
          checked={isLegalConfirmed}
          className="mt-1 size-4 accent-teal-300"
          onChange={(event) => setIsLegalConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>
          I confirm this is an official/legal provider link and I am authorized to
          use it in this private app.
        </span>
      </label>

      <button
        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-teal-100"
        disabled={!providerId || !isLegalConfirmed || isPending}
        type="submit"
      >
        <Link2 className="size-4" aria-hidden="true" />
        Add official link
      </button>

      {status ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
          {status}
        </p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
        <ShieldCheck className="mb-2 size-5 text-teal-100" aria-hidden="true" />
        External links open the provider. YouTube embeds use YouTube&apos;s official
        iframe. Official embeds require a provider-approved embed URL.
      </div>
    </form>
  );
}
