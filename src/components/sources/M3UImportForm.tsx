"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export function M3UImportForm() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [sourceName, setSourceName] = useState("Legal M3U source");
  const [m3uUrl, setM3uUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");
  const [fileContent, setFileContent] = useState<string | undefined>();
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileContent(await file.text());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/sources/m3u/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceName,
        m3uUrl: m3uUrl || undefined,
        epgUrl: epgUrl || undefined,
        fileContent,
        isLegalConfirmed: confirmed,
        isFree: true,
        accessType: "unknown",
        playbackType: "m3u_stream",
      }),
    });

    const result = await response.json();
    setIsSubmitting(false);
    setStatus(result.message ?? result.error ?? "Import request completed.");
    if (response.ok) router.refresh();
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-bold text-white">Legal M3U import</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Import a legal playlist from an official or authorized source. Imported
          channels start as pending review.
        </p>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Source name</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setSourceName(event.target.value)}
          required
          value={sourceName}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">M3U URL</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setM3uUrl(event.target.value)}
          placeholder="https://example.com/authorized-playlist.m3u"
          type="url"
          value={m3uUrl}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Or upload M3U file</span>
        <input
          accept=".m3u,.m3u8,text/plain"
          className="mt-2 block w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-300 file:px-3 file:py-2 file:font-bold file:text-slate-950"
          onChange={handleFile}
          type="file"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Optional XMLTV EPG URL</span>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setEpgUrl(event.target.value)}
          placeholder="https://example.com/authorized-epg.xml"
          type="url"
          value={epgUrl}
        />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
        <input
          checked={confirmed}
          className="mt-1 size-4 accent-teal-300"
          onChange={(event) => setConfirmed(event.target.checked)}
          type="checkbox"
        />
        I confirm this playlist is legal and I am authorized to use it.
      </label>
      <button
        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-teal-100"
        disabled={!confirmed || isSubmitting || (!m3uUrl && !fileContent)}
        type="submit"
      >
        <Upload className="size-4" aria-hidden="true" />
        {isSubmitting ? "Importing..." : "Import as pending review"}
      </button>
      {status ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
          {status}
        </p>
      ) : null}
    </form>
  );
}
