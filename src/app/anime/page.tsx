// src/app/anime/page.tsx
import { ThreadList } from "@/components/ThreadList";

export const metadata = {
  title: "Anime | romanriv.com",
};

const sampleAnimeThreads = [
  {
    id: "anime-1",
    title: "Long-running shounen I actually finished",
    category: "anime" as const,
    commentCount: 10,
    createdAt: "Aug 2025",
  },
  {
    id: "anime-2",
    title: "Comfy shows for late-night watching",
    category: "anime" as const,
    commentCount: 6,
    createdAt: "Jul 2025",
  },
];

export default function AnimePage() {
  return (
    <div className="page-shell">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Anime
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          This page is my anime brain dump: what I&apos;m watching now, what
          I&apos;ve finished, and the shows I keep telling myself I&apos;ll
          start &quot;soon&quot;.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Instead of comments on each individual series, there&apos;s a
          discussion area where anyone can start threads about recommendations,
          rankings, or whatever show we&apos;re all stuck on at the moment.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="section-title">Currently watching</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• (Example) Show A – up to episode 7.</li>
            <li>• (Example) Show B – slow-burn, watching on weekends.</li>
            <li>• (Example) Show C – rewatching for comfort.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            This section will eventually pull from a real list instead of dummy
            text.
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">Completed / favorites</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• (Example) Favorite long shounen 1.</li>
            <li>• (Example) Favorite short comfy show 1.</li>
            <li>• (Example) All-time comfort rewatch 1.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Later, this will become structured lists: Completed, Favorites, and
            special recommendation lists.
          </p>
        </div>
      </section>

      <section>
        <ThreadList title="Anime discussions" threads={sampleAnimeThreads} />
      </section>
    </div>
  );
}
