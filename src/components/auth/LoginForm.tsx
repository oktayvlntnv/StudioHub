"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      router.push("/");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    const next =
      new URLSearchParams(window.location.search).get("next")?.toString() ?? "/";
    router.push(next);
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Owner email</span>
        <input
          autoComplete="email"
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Password</span>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {status ? (
        <p className="rounded-xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {status}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-teal-100"
        disabled={isSubmitting}
        type="submit"
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
