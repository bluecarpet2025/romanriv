// src/app/cars/page.tsx
import PhotoMediaGrid, { type PhotoMediaItem } from "@/components/PhotoMediaGrid";
import styles from "@/components/PublicMedia.module.css";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";

export const metadata = {
  title: "Cars | romanriv.com",
};

type CarItem = PhotoMediaItem;

async function getCarPhotos(): Promise<CarItem[]> {
  const fallback: CarItem[] = [
    {
      id: 1,
      title: "2024 GR Corolla Circuit Edition",
      subtitle: "Blue Ice – current daily and track toy.",
      imageUrl: "/placeholder-car-1.jpg",
      tags: ["gr corolla", "circuit edition", "2024"],
      likes: 0,
      views: 0,
    },
    {
      id: 2,
      title: "2019 Civic Type R",
      subtitle: "Black, turbo, and a very good time.",
      imageUrl: "/placeholder-car-2.jpg",
      tags: ["civic type r", "2019"],
      likes: 0,
      views: 0,
    },
    {
      id: 3,
      title: "1993 Civic Hatchback",
      subtitle: "Fully modified, white, and very loud.",
      imageUrl: "/placeholder-car-3.jpg",
      tags: ["civic", "hatchback", "1993"],
      likes: 0,
      views: 0,
    },
  ];

  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, title, description, image_path, tags, category, created_at, image_timestamp, likes, views"
    )
    .eq("category", "car")
    .order("image_timestamp", { ascending: false })
    //.limit(50);

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

export default async function CarsPage() {
  const items = await getCarPhotos();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>On the road</p>
        <h1>Cars</h1>
        <p>
          I like cars that make driving feel like a hobby, not a chore. This
          page starts with my current Blue Flame 2024 GR Corolla Circuit Edition,
          and eventually becomes a timeline of the cars I&apos;ve owned and/or modified.
        </p>
        <p className={styles.secondary}>
          A visual log of the cars I&apos;ve owned or cared about. Each picture
          has tags and likes; conversations live in the global threads.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="cars-heading">
        <div className={styles.sectionHeader}>
          <h2 id="cars-heading">Garage <span className={styles.count}>{items.length}</span></h2>
          <p>Open a photo for a closer look.</p>
        </div>
        <PhotoMediaGrid items={items} emptyMessage="No car photos yet. Check back for the next drive." />
      </section>
    </div>
  );
}
