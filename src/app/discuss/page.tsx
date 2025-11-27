// src/app/discuss/page.tsx
export const metadata = {
  title: "Discuss | romanriv.com",
  robots: { index: false, follow: false }, // don’t let search engines index it
};

export default function DiscussPage() {
  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Discuss
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          This section is closed for now.
        </p>
      </header>
    </div>
  );
}
