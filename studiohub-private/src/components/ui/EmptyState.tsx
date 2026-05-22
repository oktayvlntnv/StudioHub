import type { LucideIcon } from "lucide-react";
import { CircleOff } from "lucide-react";

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, body, icon: Icon = CircleOff }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
      <Icon className="mx-auto size-10 text-slate-400" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
        {body}
      </p>
    </div>
  );
}
