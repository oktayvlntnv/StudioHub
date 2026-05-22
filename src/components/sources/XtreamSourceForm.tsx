"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export function XtreamSourceForm() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
    username: "",
    password: "",
    notes: "",
    country: "",
    providerWebsite: "",
    legalContactInfo: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceType: "xtream",
          ...form,
          isLegalConfirmed: confirmed,
        }),
      });

      const result = await response.json();
      setStatus(result.message ?? result.error ?? "Save request completed.");
      if (response.ok) {
        setForm((current) => ({ ...current, password: "" }));
        setConfirmed(false);
        router.refresh();
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not save Xtream source.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-bold text-white">Xtream-compatible source</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Add verified legal providers only. Credentials are encrypted server-side
          and never returned to the browser.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Source name</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("name", event.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Server URL</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("baseUrl", event.target.value)}
            placeholder="https://provider.example.com"
            required
            type="url"
            value={form.baseUrl}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Username</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("username", event.target.value)}
            required
            value={form.username}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Password</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("password", event.target.value)}
            required
            type="password"
            value={form.password}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Country</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("country", event.target.value)}
            value={form.country}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-200">Provider website</span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => updateField("providerWebsite", event.target.value)}
            type="url"
            value={form.providerWebsite}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Legal/license notes</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => updateField("legalContactInfo", event.target.value)}
          value={form.legalContactInfo}
        />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
        <input
          checked={confirmed}
          className="mt-1 size-4 accent-teal-300"
          onChange={(event) => setConfirmed(event.target.checked)}
          type="checkbox"
        />
        I confirm this provider/source is legal and I am authorized to use it.
      </label>
      <button
        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-teal-100"
        disabled={!confirmed || isSubmitting}
        type="submit"
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
        {isSubmitting ? "Saving..." : "Save disabled source"}
      </button>
      {status ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
          {status}
        </p>
      ) : null}
    </form>
  );
}
