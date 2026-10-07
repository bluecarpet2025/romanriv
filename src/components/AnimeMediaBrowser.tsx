"use client";

import { useMemo, useState } from "react";
import { ANIME_SORT_OPTIONS, browseMedia, type MediaSort } from "@/lib/media-browsing";
import { ANIME_STATUSES } from "@/lib/anime-management";
import AnimeMediaGrid, { type PublicAnimeRow } from "./AnimeMediaGrid";
import MediaToolbar from "./MediaToolbar";
import styles from "./PublicMedia.module.css";

const fields = (row: PublicAnimeRow) => ({ title: row.title, tags: row.tags, likes: row.likes, views: row.views,
  sortOrder: row.sortOrder, status: row.status, favorite: row.favorite });

export default function AnimeMediaBrowser({ rows }: { rows: PublicAnimeRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MediaSort>("sort-order");
  const [status, setStatus] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { sortedItems, visibleItems } = useMemo(() => browseMedia(rows, { search, sort, status, favoritesOnly }, fields), [rows, search, sort, status, favoritesOnly]);
  const visibleIds = new Set(visibleItems.map((row) => row.id));
  const sections = [
    { id: "watching", title: "Currently watching", description: "Shows I’m actively working through.", rows: sortedItems.filter((a) => a.status === "watching") },
    { id: "planned", title: "Planned", description: "On the radar, just not started yet.", rows: sortedItems.filter((a) => a.status === "planned") },
    { id: "completed", title: "Completed", description: "Finished shows.", rows: sortedItems.filter((a) => a.status === "watched") },
    { id: "other", title: "Other", description: "On hold, dropped, and everything in between.", rows: sortedItems.filter((a) => !["watching", "watched", "planned"].includes(a.status)) },
  ];
  return (
    <div className={styles.browser}>
      <MediaToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Title or tags"
        sort={sort} onSortChange={setSort} sortOptions={ANIME_SORT_OPTIONS}
        filter={{ label: "Status", value: status, options: [{ value: "all", label: "All" }, ...ANIME_STATUSES], onChange: setStatus }}
        favorites={{ value: favoritesOnly, onChange: setFavoritesOnly }} visibleCount={visibleItems.length} totalCount={rows.length} noun="anime"
        onReset={() => { setSearch(""); setSort("sort-order"); setStatus("all"); setFavoritesOnly(false); }} />
      {sections.map((section) => {
        const count = section.rows.filter((row) => visibleIds.has(row.id)).length;
        return (
          <section key={section.id} className={styles.section} hidden={count === 0} aria-labelledby={`${section.id}-heading`}>
            <div className={styles.sectionHeader}>
              <h2 id={`${section.id}-heading`}>{section.title} <span className={styles.count}>{count}</span></h2>
              <p>{section.description}</p>
            </div>
            <AnimeMediaGrid rows={section.rows} visibleIds={visibleIds} />
          </section>
        );
      })}
      {visibleItems.length === 0 ? <p className={styles.empty}>{rows.length ? "No anime match these filters. Try another search or reset the controls." : "The watchlist is empty for now. Check back for the first title."}</p> : null}
    </div>
  );
}
