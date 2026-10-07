"use client";

import { AnimeLikeButton } from "./AnimeLikeButton";
import { MediaTags } from "./PhotoMediaGrid";
import PublicMediaImage from "./PublicMediaImage";
import { useMediaViews } from "./useMediaCounters";
import styles from "./PublicMedia.module.css";

export type PublicAnimeRow = {
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
  coverUrl: string | null;
};

const statusLabels: Record<string, string> = {
  watching: "Watching",
  watched: "Completed",
  planned: "Planned",
  "on-hold": "On hold",
  dropped: "Dropped",
};

function AnimeMediaCard({ row, hidden }: { row: PublicAnimeRow; hidden: boolean }) {
  const { views, onOpen } = useMediaViews("anime", String(row.id), row.views);
  return (
        <article className={styles.card} hidden={hidden}>
          <PublicMediaImage src={row.coverUrl} alt={row.title} poster onOpen={onOpen} />
          <div className={styles.content}>
            <div className={styles.titleRow}>
              <h3 className={styles.cardTitle}>{row.title}</h3>
              {row.favorite ? <span className={styles.favorite} aria-label="Favorite">★</span> : null}
            </div>
            <span className={`${styles.status} ${row.status === "watching" ? styles.watching : ""}`}>
              {statusLabels[row.status] ?? row.status}
            </span>
            <p className={styles.seasons}>
              <strong>{row.seasons_watched} / {row.total_seasons}</strong> seasons watched
            </p>
            <MediaTags tags={row.tags} />
            {row.notes ? (
              <details className={styles.notes}>
                <summary>Notes</summary>
                <p>{row.notes}</p>
              </details>
            ) : null}
            <div className={styles.stats}>
              <AnimeLikeButton animeId={row.id} initialLikes={row.likes} />
              <span className={styles.views} aria-label={`${views} views`}>
                <span aria-hidden="true">👁</span> {views}<span>views</span>
              </span>
            </div>
          </div>
        </article>
  );
}

export default function AnimeMediaGrid({ rows, visibleIds }: { rows: PublicAnimeRow[]; visibleIds?: ReadonlySet<string> }) {
  return (
    <div className={styles.animeGrid}>
      {rows.map((row) => (
        <AnimeMediaCard key={row.id} row={row} hidden={visibleIds ? !visibleIds.has(row.id) : false} />
      ))}
    </div>
  );
}
