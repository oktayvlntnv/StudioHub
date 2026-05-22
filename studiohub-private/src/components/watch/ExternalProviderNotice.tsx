import { ExternalLink } from "lucide-react";

interface ExternalProviderNoticeProps {
  watchUrl?: string;
}

export function ExternalProviderNotice({ watchUrl }: ExternalProviderNoticeProps) {
  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6">
      <ExternalLink className="size-8 text-cyan-100" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-bold text-white">Open official provider</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/85">
        StudioHub does not play this item inside the app because the official
        provider page is the authorized watch surface.
      </p>
      {watchUrl ? (
        <a
          className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-200 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-50"
          href={watchUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open official provider
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
