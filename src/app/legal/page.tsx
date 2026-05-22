import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Legal",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#050709] px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-8">
        <div className="grid size-14 place-items-center rounded-2xl bg-teal-300 text-slate-950">
          <ShieldCheck className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">Legal use policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
          <p>
            StudioHub Private is for private personal use by the owner only. It
            does not provide public registration, public sharing, or public source
            submission.
          </p>
          <p>
            The app must not host illegal copyrighted video files, bypass DRM,
            bypass provider login, bypass geo-blocking, scrape protected streaming
            sources, proxy copyrighted streams, or restream unauthorized content.
          </p>
          <p>
            The owner is responsible for adding only sources they are legally
            authorized to use. Provider availability can depend on country and
            provider account requirements.
          </p>
          <p>
            Direct in-app playback is only appropriate for public-domain,
            open-license, owned, officially free, or otherwise legally authorized
            streams where embedding or playback is allowed.
          </p>
        </div>
        <Link
          className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
          href="/"
        >
          Back to StudioHub
        </Link>
      </section>
    </main>
  );
}
