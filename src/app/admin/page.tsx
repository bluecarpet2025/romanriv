// src/app/admin/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Admin | romanriv.com",
};

const adminActionClass =
  "inline-flex items-center rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm font-medium text-sky-400 hover:bg-slate-900 hover:text-sky-300 transition mr-2";

export default function AdminHomePage() {
  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Admin
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Private area for managing site content.
        </p>

        {/* Admin actions */}
        <div className="mt-4">
          <Link href="/admin/photos" className={adminActionClass}>
            Photo uploader
          </Link>

          <Link href="/admin/photos/manage" className={adminActionClass}>
            Manage photos
          </Link>

          <Link href="/admin/anime" className={adminActionClass}>
            Anime admin
          </Link>
        </div>
      </header>
    </div>
  );
}
