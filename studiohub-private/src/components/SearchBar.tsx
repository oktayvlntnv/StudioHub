"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
}

export function SearchBar({
  placeholder = "Search StudioHub",
  initialValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 focus-within:border-teal-300/50"
      onSubmit={handleSubmit}
    >
      <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
      <input
        aria-label="Search StudioHub"
        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        value={query}
      />
      <button className="min-h-10 rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100">
        Search
      </button>
    </form>
  );
}
