import { LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050709] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/40">
        <div className="grid size-14 place-items-center rounded-2xl bg-teal-300 text-slate-950">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">StudioHub Private</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Owner-only access for your private media dashboard. Public registration
          is disabled.
        </p>
        <LoginForm />
        <p className="mt-6 text-xs leading-5 text-slate-500">
          Sign in with the owner account configured in Supabase.
        </p>
      </section>
    </main>
  );
}
