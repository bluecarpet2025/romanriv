"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseAuth";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/admin";

  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <section className="card max-w-lg">
      <h1 className="text-xl font-bold tracking-tight text-slate-50">Sign in</h1>
      <p className="mt-2 text-sm text-slate-400">
        Admin access only. If you don’t have an account, you won’t be able to sign in.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input
            className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            type="email"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Password</label>
          <input
            className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            type="password"
            required
          />
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
