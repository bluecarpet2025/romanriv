"use client";

import { useMemo, useState } from "react";
import { browseMedia, PHOTO_SORT_OPTIONS, type MediaSort } from "@/lib/media-browsing";
import MediaToolbar from "./MediaToolbar";
import { LikeButton } from "./LikeButton";
import PublicMediaImage from "./PublicMediaImage";
import { useMediaViews } from "./useMediaCounters";
import styles from "./PublicMedia.module.css";

export type PhotoMediaItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  tags: string[];
  likes: number;
  views: number;
  timestamp?: string | null;
};

export function MediaTags({ tags }: { tags: string[] }) {
  const visibleTags = tags.map((tag) => tag.trim()).filter(Boolean);
  return visibleTags.length ? (
    <ul className={styles.tags} aria-label="Tags">
      {visibleTags.map((tag, index) => <li key={`${tag}-${index}`}>{tag}</li>)}
    </ul>
  ) : <p className={styles.noTags}>No tags yet</p>;
}

function PhotoMediaCard({ item, hidden }: { item: PhotoMediaItem; hidden: boolean }) {
  const { views, onOpen } = useMediaViews("photo", String(item.id), item.views);
  return (
        <article className={styles.card} hidden={hidden}>
          <PublicMediaImage src={item.imageUrl} alt={item.title} onOpen={onOpen} />
          <div className={styles.content}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.subtitle ? <p className={styles.description}>{item.subtitle}</p> : null}
            <MediaTags tags={item.tags} />
            <div className={styles.stats}>
              <LikeButton photoId={String(item.id)} initialLikes={item.likes} />
              <span className={styles.views} aria-label={`${views} views`}>
                <span aria-hidden="true">👁</span> {views}<span>views</span>
              </span>
            </div>
          </div>
        </article>
  );
}

export default function PhotoMediaGrid({ items, emptyMessage }: {
  items: PhotoMediaItem[];
  emptyMessage: string;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MediaSort>("newest");
  const { sortedItems, visibleItems } = useMemo(() => browseMedia(items, { search, sort }, (item) => ({
    title: item.title, description: item.subtitle, tags: item.tags, timestamp: item.timestamp, likes: item.likes, views: item.views,
  })), [items, search, sort]);
  const visibleIds = new Set(visibleItems.map((item) => item.id));

  return (
    <>
      <MediaToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Title, description, or tags"
        sort={sort} onSortChange={setSort} sortOptions={PHOTO_SORT_OPTIONS}
        visibleCount={visibleItems.length} totalCount={items.length} noun="photos"
        onReset={() => { setSearch(""); setSort("newest"); }} />
      {visibleItems.length === 0 ? <p className={styles.empty}>{items.length ? "No photos match your search. Try another search or reset the controls." : emptyMessage}</p> : null}
      <div className={styles.photoGrid}>
      {sortedItems.map((item) => (
        <PhotoMediaCard key={item.id} item={item} hidden={!visibleIds.has(item.id)} />
      ))}
      </div>
    </>
  );
}
