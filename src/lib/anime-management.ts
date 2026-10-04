export const ANIME_STATUSES = [
  { value: "watching", label: "Watching" },
  { value: "watched", label: "Watched" },
  { value: "planned", label: "Planned" },
  { value: "on-hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
] as const;

export const ANIME_COLUMNS = "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order, cover_url";

export type DbAnimeRow = {
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
export type AnimeRow = {
  id: string;
  title: string;
  status: string;
  total_seasons: number;
  seasons_watched: number;
  favorite: boolean;
  tags: string[];
  notes: string;
  likes: number;
  views: number;
  sortOrder: number;
  coverUrl: string;
};
export type AnimeDraft = AnimeRow & { tagsText: string; dirty: boolean };
export type AnimeSort = "title-asc" | "title-desc" | "sort-order" | "status";

export function normaliseAnime(row: DbAnimeRow): AnimeRow {
  return {
    id: row.id, title: row.title, status: row.status ?? "planned",
    total_seasons: row.total_seasons ?? 1, seasons_watched: row.seasons_watched ?? 0,
    favorite: !!row.is_favorite, tags: (row.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    notes: row.notes ?? "", likes: row.likes ?? 0, views: row.views ?? 0,
    sortOrder: row.sort_order ?? 0, coverUrl: row.cover_url ?? "",
  };
}

export function browseAnime(rows: AnimeRow[], search: string, status: string, favoritesOnly: boolean, sort: AnimeSort) {
  const query = search.trim().toLocaleLowerCase();
  const byTitle = (a: AnimeRow, b: AnimeRow) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true }) || a.id.localeCompare(b.id);
  return rows.filter((row) => row.title.toLocaleLowerCase().includes(query) &&
    (status === "all" || row.status === status) && (!favoritesOnly || row.favorite))
    .sort((a, b) => {
      if (sort === "title-asc") return byTitle(a, b);
      if (sort === "title-desc") return byTitle(b, a);
      if (sort === "status") return a.status.localeCompare(b.status) || byTitle(a, b);
      return a.sortOrder - b.sortOrder || byTitle(a, b);
    });
}

export function animeSavePayload(draft: AnimeDraft) {
  return {
    title: draft.title, status: draft.status, total_seasons: draft.total_seasons,
    seasons_watched: draft.seasons_watched, is_favorite: draft.favorite,
    tags: draft.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
    notes: draft.notes, sort_order: draft.sortOrder, cover_url: draft.coverUrl.trim() || null,
  };
}
