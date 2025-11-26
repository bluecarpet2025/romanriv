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
  tags: string[] | null;
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
  sort_order: number;
};

async function getAnime(): Promise<AnimeRow[]> {
  const { data, error } = await supabase
    .from("anime")
    .select(
      "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order"
    )
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("[anime] load error", error);
    return [];
  }

  return (data as DbAnimeRow[]).map((row) => ({
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
    sort_order: row.sort_order ?? 0,
  }));
}

function formatStatus(row: AnimeRow) {
  const { status, seasons_watched, total_seasons } = row;

  const seasonsPart =
    total_seasons > 0
      ? `${seasons_watched} of ${total_seasons} season${
          total_seasons === 1 ? "" : "s"
        }`
      : null;

  if (seasonsPart) return `${status} • ${seasonsPart}`;
  return status;
}

function TagLine({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) {
    return (
      <span className="text-[11px] uppercase tracking-wide text-slate-500">
        No tags yet
      </span>
    );
  }

  return (
    <span className="text-[11px] uppercase tracking-wide text-slate-400">
      {tags.join(" · ")}
    </span>
  );
}

function Section({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: AnimeRow[];
}) {
  if (!rows.length) return null;

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>

      {/* Card grid – Crunchyroll-ish */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <article
            key={row.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-sm transition hover:border-sky-500/80 hover:bg-slate-900/80"
          >
            {/* Placeholder “image” area – title centered.
                Later we can swap this to a real cover image. */}
            <div className="relative flex aspect-[16/9] items-center justify-center bg-slate-900/80">
              <span className="mx-3 text-center text-xs font-semibold text-slate-100 sm:text-sm line-clamp-2">
                {row.title}
              </span>

              {row.favorite && (
                <span className="absolute left-2 top-2 inline-flex h-6 items-center rounded-full bg-amber-400/90 px-2 text-[11px] font-semibold text-slate-900">
                  ★ Favorite
                </span>
              )}
            </div>

            {/* Meta strip */}
            <div className="flex flex-1 flex-col justify-between px-3 py-2">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-300 sm:text-xs">
                  {formatStatus(row)}
                </p>

                {row.notes && (
                  <p className="line-clamp-2 text-[11px] text-slate-400 sm:text-xs">
                    {row.notes}
                  </p>
                )}

                <TagLine tags={row.tags} />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
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

            {/* Increment per-anime views */}
            <AnimeViewTracker id={row.id} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function AnimePage() {
  // Load in DB order (sort_order asc)
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

      <Section
        title="Currently watching"
        subtitle="Shows I’m actively working through."
        rows={watching}
      />

      <Section
        title="Planned"
        subtitle="On the radar, just not started yet."
        rows={planned}
      />

      <Section
        title="Completed"
        subtitle="Favorites float to the top of the list visually."
        rows={watched}
      />

      <Section
        title="Other"
        subtitle="On-hold, dropped, or anything that doesn’t fit neatly above."
        rows={others}
      />

      {all.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          No anime in the list yet. Add some under the admin page first.
        </p>
      )}
    </div>
  );
}
