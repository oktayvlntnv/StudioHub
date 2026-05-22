import type { ReactNode } from "react";

interface HeroSectionProps {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}

export function HeroSection({ eyebrow, title, body, children }: HeroSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05]">
      <div className="min-h-[420px] bg-[linear-gradient(135deg,rgba(20,184,166,0.16),rgba(244,114,182,0.12),rgba(56,189,248,0.10))] p-6 sm:p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{body}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
