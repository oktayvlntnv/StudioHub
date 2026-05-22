import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  body: string;
}

export function ErrorState({ title, body }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-300/25 bg-rose-300/10 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 size-5 text-rose-200" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-rose-50">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-rose-100/85">{body}</p>
        </div>
      </div>
    </div>
  );
}
