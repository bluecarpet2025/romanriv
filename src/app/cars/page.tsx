// src/app/cars/page.tsx
import { GalleryGrid, GalleryItem } from "@/components/GalleryGrid";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";

export const metadata = {
  title: "Cars | romanriv.com",
};

async function getCarPhotos(): Promise<GalleryItem[]> {
  const fallback: GalleryItem[] = [
    {
      id: 1,
      title: "2024 GR Corolla Circuit Edition",
      subtitle: "Blue Ice – current daily and track toy.",
      imageUrl: "/placeholder-car-1.jpg",
      tags: ["gr corolla", "circuit edition", "2024"],
    },
    {
      id: 2,
      title: "2019 Civic Type R",
      subtitle: "Black, turbo, and a very good time.",
      imageUrl: "/placeholder-car-2.jpg",
      tags: ["civic type r", "2019"],
    },
    {
      id: 3,
      title: "1993 Civic Hatchback",
      subtitle: "Fully modified, white, and very loud.",
      imageUrl: "/placeholder-car-3.jpg",
      tags: ["civic", "hatchback", "1993"],
    },
  ];

  const { data, error } = await supabase
    .from("photos")
    .select("id, title, description, image_path, tags, category, created_at")
    .eq("category", "car")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) return fallback;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
  }));
}

export default async function CarsPage() {
  const items = await getCarPhotos();

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Cars
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          I like cars that make driving feel like a hobby, not a chore. This
          page starts with my current Blue Ice 2024 GR Corolla Circuit Edition,
          and eventually becomes a timeline of the cars I&apos;ve owned and
          modified.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Same rules as the food page: each picture gets tags and likes. If you
          want to talk about any of them, the discussion lives in the global
          threads, not under each photo.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Garage</h2>
          <p className="section-subtitle">
            A visual log of the cars I&apos;ve owned or cared about.
          </p>
        </div>
        <GalleryGrid items={items} />
      </section>
    </div>
  );
}
