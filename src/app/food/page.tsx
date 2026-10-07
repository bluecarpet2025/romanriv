// src/app/food/page.tsx
import PhotoMediaGrid, { type PhotoMediaItem } from "@/components/PhotoMediaGrid";
import styles from "@/components/PublicMedia.module.css";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";
import { PhotoViewTracker } from "@/components/PhotoViewTracker";

export const metadata = {
  title: "Food | romanriv.com",
};

type FoodItem = PhotoMediaItem;

async function getFoodPhotos(): Promise<FoodItem[]> {
  const fallback: FoodItem[] = [
    {
      id: 1,
      title: "Miso Salmon & Broccoli",
      subtitle: "Saturday post-gym dinner, simple and clean.",
      imageUrl: "/placeholder-food-1.jpg",
      tags: ["salmon", "broccoli", "dinner"],
      likes: 0,
      views: 0,
    },
    {
      id: 2,
      title: "Steak, Potatoes & Greens",
      subtitle: "Learning the line between seared and burned.",
      imageUrl: "/placeholder-food-2.jpg",
      tags: ["steak", "comfort", "weeknight"],
      likes: 0,
      views: 0,
    },
    {
      id: 3,
      title: "Shrimp Rice Bowl",
      subtitle: "Shrimp, rice, and greens – camera favorite.",
      imageUrl: "/placeholder-food-3.jpg",
      tags: ["shrimp", "bowl", "meal prep"],
      likes: 0,
      views: 0,
    },
  ];

  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, title, description, image_path, tags, category, created_at, image_timestamp, likes, views"
    )
    .eq("category", "food")
    .order("image_timestamp", { ascending: false })
    //.limit(500);

  if (error || !data || data.length === 0) return fallback;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
    likes: row.likes ?? 0,
    views: row.views ?? 0,
    timestamp: row.image_timestamp ?? row.created_at,
  }));
}

export default async function FoodPage() {
  const items = await getFoodPhotos();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>From the kitchen</p>
        <h1>Food</h1>
        <p>
          For the last few years, every time I cook something and the plate
          looks good, I take a picture. This is a log of those meals:
          post-gym dinners, weekend experiments, and whatever looked good enough
          to grab the camera.
        </p>
        <p className={styles.secondary}>
          Over time, each dish will be tied to a recipe with notes and better
          search. For now, it&apos;s a visual log, with media stored on Cloudflare R2.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="food-heading">
        <div className={styles.sectionHeader}>
          <h2 id="food-heading">Recent dishes <span className={styles.count}>{items.length}</span></h2>
          <p>Open a photo for a closer look.</p>
        </div>
        <PhotoMediaGrid items={items} emptyMessage="No food photos yet. Check back for the next meal." />
        <PhotoViewTracker ids={items.map((item) => item.id)} />
      </section>
    </div>
  );
}
