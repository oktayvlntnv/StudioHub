import { LockKeyhole } from "lucide-react";

export function OwnerCredentialsNotice() {
  return (
    <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-6">
      <LockKeyhole className="size-8 text-fuchsia-100" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-bold text-white">
        Owner credentials required
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-fuchsia-50/85">
        Credentialed playback stays server-controlled. StudioHub does not expose
        provider usernames, passwords, or raw credentialed URLs to the browser.
      </p>
    </div>
  );
}
