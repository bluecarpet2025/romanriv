// src/app/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Login | romanriv.com",
};

export default function LoginPage() {
  return (
    <div className="page-shell">
      <Suspense
        fallback={
          <section className="card max-w-lg">
            <h1 className="text-xl font-bold tracking-tight text-slate-50">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-slate-400">Loading…</p>
          </section>
        }
      >
        <LoginClient />
      </Suspense>
    </div>
  );
}
