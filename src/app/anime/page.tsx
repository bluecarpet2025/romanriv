// src/app/anime/page.tsx
import { supabase } from "@/lib/supabase";
import { AnimeLikeButton } from "@/components/AnimeLikeButton";
import { AnimeViewTracker } from "@/components/AnimeViewTracker";

export const metadata = {
  title: "Anime | romanriv.com",
};

// Shape in the DB (public.anime)
type DbAnimeRow = {
  id: string;
  title: string;
  status: string | null;
  total_seasons: number | null;
  seasons_watched: number | null;
  is_favorite: boolean | null;
  tags: string[] | null; // text[]
  notes: string | null;
  likes: number | null;
  views: number | null;
  sort_order: number | null;
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
};

async function getAnime(): Promise<AnimeRow[]> {
  const { data, error } = await supabase
    .from("anime")
    .select(
      "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order"
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
  }));

  // Respect your Excel order
  mapped.sort((a, b) => a.sortOrder - b.sortOrder);

  return mapped;
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
    <span className="text-[10px] uppercase tracking-wide text-slate-400">
      {tags.join(" · ")}
    </span>
  );
}

// SMALL, TIGHT GRID
function AnimeGrid({ rows }: { rows: AnimeRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {rows.map((row) => (
        <article
          key={row.id}
          className="relative flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80 shadow-sm"
        >
          {/* Poster area – fixed small height */}
          <div className="relative h-28 sm:h-32 bg-slate-900/70">
            {/* Favorite badge */}
            {row.favorite && (
              <div className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-black">
                ★ Favorite
              </div>
            )}
            {/* Centered title */}
            <div className="flex h-full items-center justify-center px-2 text-center">
              <h3 className="text-[11px] font-semibold text-slate-50 sm:text-xs">
                {row.title}
              </h3>
            </div>
          </div>

          {/* Meta area – compact */}
          <div className="flex flex-col gap-1 border-t border-slate-800 px-2 py-2">
            <p className="text-[10px] text-slate-400 sm:text-[11px]">
              {formatStatus(row)}
            </p>

            <TagLine tags={row.tags} />

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <AnimeLikeButton
                animeId={row.id}
                initialLikes={row.likes ?? 0}
              />
              <div className="inline-flex items-center gap-1">
                <span aria-hidden="true">👁</span>
                <span className="tabular-nums">{row.views ?? 0}</span>
              </div>
            </div>
          </div>

          {/* bump per-anime views */}
          <AnimeViewTracker id={row.id} />
        </article>
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
          Ongoing log of the anime I&apos;ve watched, finished, or plan to
          watch. It started life as an Excel sheet and now lives here so I can
          keep it updated from anywhere.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Each title keeps track of whether it&apos;s a favorite, how many
          seasons I&apos;ve watched, and a few quick tags. Likes and views are
          mostly for fun and future ideas.
        </p>
      </header>

      {/* Watching */}
      {watching.length > 0 && (
        <section className="mt-4">
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
        <section className="mt-6">
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
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Completed</h2>
            <p className="section-subtitle">Finished shows.</p>
          </div>
          <AnimeGrid rows={watched} />
        </section>
      )}

      {/* Others */}
      {others.length > 0 && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Other</h2>
            <p className="section-subtitle">
              On-hold, dropped, or anything that doesn&apos;t fit neatly above.
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
