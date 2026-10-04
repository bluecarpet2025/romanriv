import { LikeButton } from "./LikeButton";
import PublicMediaImage from "./PublicMediaImage";
import styles from "./PublicMedia.module.css";

export type PhotoMediaItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  tags: string[];
  likes: number;
  views: number;
};

export function MediaTags({ tags }: { tags: string[] }) {
  const visibleTags = tags.map((tag) => tag.trim()).filter(Boolean);
  return visibleTags.length ? (
    <ul className={styles.tags} aria-label="Tags">
      {visibleTags.map((tag, index) => <li key={`${tag}-${index}`}>{tag}</li>)}
    </ul>
  ) : <p className={styles.noTags}>No tags yet</p>;
}

export default function PhotoMediaGrid({ items, emptyMessage }: {
  items: PhotoMediaItem[];
  emptyMessage: string;
}) {
  if (!items.length) return <p className={styles.empty}>{emptyMessage}</p>;

  return (
    <div className={styles.photoGrid}>
      {items.map((item) => (
        <article key={item.id} className={styles.card}>
          <PublicMediaImage src={item.imageUrl} alt={item.title} />
          <div className={styles.content}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.subtitle ? <p className={styles.description}>{item.subtitle}</p> : null}
            <MediaTags tags={item.tags} />
            <div className={styles.stats}>
              <LikeButton photoId={String(item.id)} initialLikes={item.likes} />
              <span className={styles.views} aria-label={`${item.views} views`}>
                <span aria-hidden="true">👁</span> {item.views}<span>views</span>
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
