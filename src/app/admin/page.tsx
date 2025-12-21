// src/app/admin/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Admin | romanriv.com",
};

const linkBase =
  "inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/70 hover:text-white";

const linkPrimary =
  "inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-500";

export default function AdminHomePage() {
  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">Admin</h1>
        <p className="mt-3 text-sm text-slate-300">
          Private area for managing site content.
        </p>

        {/* Quick links */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className={linkPrimary} href="/admin/photos">
            Photo uploader
          </Link>
          <Link className={linkBase} href="/admin/photos/manage">
            Manage photos
          </Link>
          <Link className={linkBase} href="/admin/anime">
            Anime admin
          </Link>
        </div>
      </header>
    </div>
  );
}
