import Link from "next/link";
import { ExternalLink, Play } from "lucide-react";
import type { MediaProviderLink } from "@/types/studiohub";
import { accessTypeLabels } from "@/lib/labels";

interface ProviderButtonProps {
  link: MediaProviderLink;
  mediaItemId: string;
}

export function ProviderButton({ link, mediaItemId }: ProviderButtonProps) {
  const opensProvider = link.playbackType === "external_link";
  const href =
    opensProvider && link.watchUrl
      ? link.watchUrl
      : `/watch/${mediaItemId}?linkId=${encodeURIComponent(link.id)}`;
  const Icon = opensProvider ? ExternalLink : Play;
  const badges = [
    link.isFree ? "Free" : "Paid/unknown",
    accessTypeLabels[link.accessType],
    opensProvider ? "Opens provider" : "Plays in app",
  ];

  const content = (
    <>
      <span className="flex items-center gap-2 text-sm font-bold text-white">
        <Icon className="size-4 text-teal-100" aria-hidden="true" />
        Watch on {link.providerName}
      </span>
      <span className="mt-3 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-semibold text-slate-200"
            key={badge}
          >
            {badge}
          </span>
        ))}
      </span>
    </>
  );

  const className =
    "block rounded-2xl border border-white/10 bg-white/[0.06] p-4 outline-none transition hover:border-teal-300/35 hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300";

  if (opensProvider && link.watchUrl) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
