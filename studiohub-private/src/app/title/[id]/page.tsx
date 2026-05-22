import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Globe2, Languages, Star } from "lucide-react";
import { PrivateShell } from "@/components/layout/PrivateShell";
import { ProviderButton } from "@/components/media/ProviderButton";
import { ProviderLinkForm } from "@/components/sources/ProviderLinkForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getMediaItems, getProviders } from "@/lib/data/catalog";
import { formatRuntime, getPrimaryLink, getYear } from "@/lib/utils";

interface TitlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TitlePageProps) {
  const { id } = await params;
  const mediaItems = await getMediaItems();
  const item = mediaItems.find((entry) => entry.id === id);
  return {
    title: item?.title ?? "Title",
  };
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { id } = await params;
  const [mediaItems, providers] = await Promise.all([getMediaItems(), getProviders()]);
  const item = mediaItems.find((entry) => entry.id === id);

  if (!item) notFound();

  const primary = getPrimaryLink(item);

  return (
    <PrivateShell>
      <article className="space-y-8">
        <section
          className={`overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${item.backdropTone}`}
        >
          <div className="bg-black/35 p-5 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <div
                className={`aspect-[2/3] rounded-2xl border border-white/15 bg-gradient-to-br ${item.posterTone} shadow-2xl shadow-black/40`}
              />
              <div className="flex flex-col justify-end">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">
                  {item.mediaType === "movie" ? "Movie" : "TV Show"} •{" "}
                  {getYear(item.releaseDate)}
                </p>
                <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
                  {item.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200">
                  {item.overview}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge kind="access" value={primary.accessType} />
                  <StatusBadge kind="playback" value={primary.playbackType} />
                  <StatusBadge kind="source" value={primary.sourceType} />
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  {primary.playbackType === "external_link" && primary.watchUrl ? (
                    <a
                      className="inline-flex min-h-12 items-center rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
                      href={primary.watchUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Watch on provider
                    </a>
                  ) : (
                    <Link
                      className="inline-flex min-h-12 items-center rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
                      href={`/watch/${item.id}?linkId=${encodeURIComponent(primary.id)}`}
                    >
                      Watch
                    </Link>
                  )}
                  {primary.watchUrl ? (
                    <a
                      className="inline-flex min-h-12 items-center rounded-xl border border-white/15 bg-white/[0.08] px-5 text-sm font-bold text-white outline-none transition hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-teal-300"
                      href={primary.watchUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Provider page
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          {[
            {
              icon: Calendar,
              label: "Year",
              value: getYear(item.releaseDate),
            },
            {
              icon: Clock,
              label: item.mediaType === "movie" ? "Runtime" : "Seasons",
              value:
                item.mediaType === "movie"
                  ? formatRuntime(item.runtime)
                  : `${item.numberOfSeasons ?? 0} seasons`,
            },
            {
              icon: Globe2,
              label: "Country",
              value: item.originCountry.join(", "),
            },
            {
              icon: Languages,
              label: "Language",
              value: item.originalLanguage,
            },
            {
              icon: Star,
              label: "Rating",
              value: item.voteAverage ? item.voteAverage.toFixed(1) : "New",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
                key={stat.label}
              >
                <Icon className="size-5 text-teal-100" aria-hidden="true" />
                <dt className="mt-4 text-sm text-slate-400">{stat.label}</dt>
                <dd className="mt-1 font-semibold text-white">{stat.value}</dd>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Official providers</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                External provider links open the official site. Embeds only play
                in app when the provider explicitly allows it.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {item.providerLinks.map((providerLink) => (
              <div className="space-y-3" key={providerLink.id}>
                <ProviderButton link={providerLink} mediaItemId={item.id} />
                <div className="flex flex-wrap gap-2">
                  <StatusBadge kind="access" value={providerLink.accessType} />
                  <StatusBadge kind="playback" value={providerLink.playbackType} />
                  <StatusBadge kind="source" value={providerLink.sourceType} />
                </div>
                {providerLink.notes ? (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {providerLink.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <ProviderLinkForm mediaItemId={item.id} providers={providers} />

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <h2 className="text-2xl font-bold text-white">Trailer</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Trailer metadata will come from TMDB later. This mock MVP keeps the
            section ready without calling TMDB yet.
          </p>
        </section>
      </article>
    </PrivateShell>
  );
}
