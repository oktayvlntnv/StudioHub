import Link from "next/link";
import { Play } from "lucide-react";

export function WatchButton({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
      href={href}
    >
      <Play className="size-4" aria-hidden="true" />
      Watch
    </Link>
  );
}
