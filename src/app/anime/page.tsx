// src/app/anime/page.tsx
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { AnimeLikeButton } from "@/components/AnimeLikeButton";
import { AnimeViewTracker } from "@/components/AnimeViewTracker";

export const metadata = {
  title: "Anime | romanriv.com",
};

// DB row shape (public.anime)
type DbAnimeRow = {
  id: string;
  title: string;
  status: string | null;
  total_seasons: number | null;
  seasons_watched: number | null;
  is_favorite: boolean | null;
  tags: string[] | null;
  notes: string | null;
  likes: number | null;
  views: number | null;
  sort_order: number | null;
  cover_url: string | null;
};

// Normalised shape we use in the UI
type AnimeRow = {
  id: string;
  title: string;
  favorite: boolean;
  status: string;
  total_seasons: number;
  seasons_watched: number;
  notes: string | null;
  tags: string[];
  likes: number;
  views: number;
  sortOrder: number;
  coverUrl: string | null; // <- camelCase in UI
};

async function getAnime(): Promise<AnimeRow[]> {
  const { data, error } = await supabase
    .from("anime")
    .select(
      "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order, cover_url"
    );

  if (error || !data) {
    console.error("[anime] load error", error);
    return [];
  }

  const mapped: AnimeRow[] = (data as DbAnimeRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    favorite: !!row.is_favorite,
    status: row.status ?? "planned",
    total_seasons: row.total_seasons ?? 1,
    seasons_watched: row.seasons_watched ?? 0,
    notes: row.notes,
    tags: (row.tags ?? []).map((t) => t.trim()).filter(Boolean),
    likes: row.likes ?? 0,
    views: row.views ?? 0,
    sortOrder: row.sort_order ?? 9999,
    coverUrl: row.cover_url ?? null,
  }));

  // Primary order: explicit sort_order, then title
  return mapped.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
  );
}

function formatStatus(row: AnimeRow) {
  const { status, seasons_watched, total_seasons } = row;
  const seasonsPart =
    total_seasons > 0
      ? `${seasons_watched} of ${total_seasons} season${
          total_seasons === 1 ? "" : "s"
        }`
      : null;

  if (seasonsPart) {
    return `${status} • ${seasonsPart}`;
  }
  return status;
}

function TagLine({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-slate-500">
        No tags yet
      </span>
    );
  }

  return (
    <span className="text-[10px] uppercase tracking-wide text-slate-500 line-clamp-1">
      {tags.join(" · ")}
    </span>
  );
}

function AnimeGrid({ rows }: { rows: AnimeRow[] }) {
  if (!rows.length) return null;

  return (
    <div
      className="mt-3"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "1rem", // spacing between tiles (both directions) – unchanged
      }}
    >
      {rows.map((row) => (
        <div key={row.id} className="relative">
          <article className="group flex h-56 flex-col justify-between rounded-xl bg-slate-950/90 p-3 text-xs shadow-sm ring-1 ring-slate-800/80 transition hover:bg-slate-900/90 hover:ring-sky-500/70">
            {/* Cover image area */}
            <div className="mb-2 h-20 w-full overflow-hidden rounded-md bg-slate-900">
              {row.coverUrl ? (
                <Image
                  src={row.coverUrl}
                  alt={row.title}
                  width={300}
                  height={180}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                  No image yet
                </div>
              )}
            </div>

            {/* Top content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                {row.favorite && (
                  <span
                    className="text-[13px] text-amber-400"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                )}
                <h3 className="text-sm font-semibold text-slate-50 leading-tight line-clamp-2">
                  {row.title}
                </h3>
              </div>

              <p className="text-[11px] text-slate-400">
                {formatStatus(row)}
              </p>

              {row.tags.length > 0 && (
                <div>
                  <TagLine tags={row.tags} />
                </div>
              )}

              {row.notes && (
                <p className="line-clamp-2 text-[11px] text-slate-400">
                  {row.notes}
                </p>
              )}
            </div>

            {/* Bottom-right: likes + views together */}
            <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-500">
              <AnimeLikeButton
                animeId={row.id}
                initialLikes={row.likes ?? 0}
              />
              <div className="inline-flex items-center gap-1">
                <span aria-hidden="true">👁</span>
                <span className="tabular-nums">{row.views ?? 0}</span>
              </div>
            </div>
          </article>

          {/* Invisible tracker for view counts */}
          <AnimeViewTracker id={row.id} />
        </div>
      ))}
    </div>
  );
}

export default async function AnimePage() {
  const all = await getAnime();

  const watching = all.filter((a) => a.status === "watching");
  const watched = all.filter((a) => a.status === "watched");
  const planned = all.filter((a) => a.status === "planned");
  const others = all.filter(
    (a) => !["watching", "watched", "planned"].includes(a.status)
  );

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Anime
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Ongoing log of the anime I&apos;ve watched, finished, or plan
          to watch. It started life as an Excel sheet and now lives here
          so I can keep it updated from anywhere.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Each title keeps track of whether it&apos;s a favorite, how
          many seasons I&apos;ve watched, and a few quick tags. Likes and
          views are mostly for fun and future ideas.
        </p>
      </header>

      {/* Watching */}
      {watching.length > 0 && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Currently watching</h2>
            <p className="section-subtitle">
              Shows I&apos;m actively working through.
            </p>
          </div>
          <AnimeGrid rows={watching} />
        </section>
      )}

      {/* Planned */}
      {planned.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Planned</h2>
            <p className="section-subtitle">
              On the radar, just not started yet.
            </p>
          </div>
          <AnimeGrid rows={planned} />
        </section>
      )}

      {/* Watched */}
      {watched.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Completed</h2>
            <p className="section-subtitle">Finished shows.</p>
          </div>
          <AnimeGrid rows={watched} />
        </section>
      )}

      {/* Others */}
      {others.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Other</h2>
            <p className="section-subtitle">
              On-hold, dropped, or anything that doesn&apos;t fit neatly
              above.
            </p>
          </div>
          <AnimeGrid rows={others} />
        </section>
      )}

      {all.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          No anime in the list yet. Add some under the admin page first.
        </p>
      )}
    </div>
  );
}
