// src/app/anime/page.tsx
import type { PublicAnimeRow } from "@/components/AnimeMediaGrid";
import AnimeMediaBrowser from "@/components/AnimeMediaBrowser";
import styles from "@/components/PublicMedia.module.css";
import { supabase } from "@/lib/supabase";

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

type AnimeRow = PublicAnimeRow;

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

export default async function AnimePage() {
  const all = await getAnime();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>The watchlist</p>
        <h1>Anime</h1>
        <p>
          An ongoing log of the anime I&apos;m watching, have finished, or plan
          to watch. It started as an Excel sheet and now lives here so I can
          keep it updated from anywhere.
        </p>
        <p className={styles.secondary}>
          Favorites, season progress, and a few quick notes. Open a cover for a closer look.
        </p>
      </header>

      <AnimeMediaBrowser rows={all} />
    </div>
  );
}
