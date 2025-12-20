// src/app/admin/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Admin | romanriv.com",
};

export default function AdminHomePage() {
  return (
    <div className="page-shell">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">Admin</h1>
        <p className="mt-2 text-sm text-slate-400">
          Private area for managing site content.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/photos"
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Photo uploader
          </Link>

          <Link
            href="/admin/anime"
            className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-sky-600"
          >
            Anime admin
          </Link>
        </div>
      </header>
    </div>
  );
}
