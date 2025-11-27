// src/app/cars/page.tsx
import Image from "next/image";
import { LikeButton } from "@/components/LikeButton";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";
import { PhotoViewTracker } from "@/components/PhotoViewTracker";

export const metadata = {
  title: "Cars | romanriv.com",
};

type CarItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  tags: string[];
  likes: number;
  views: number;
};

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
      "id, title, description, image_path, tags, category, created_at, likes, views"
    )
    .eq("category", "car")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) return fallback;

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
    likes: row.likes ?? 0,
    views: row.views ?? 0,
  }));
}

function CarsGrid({ items }: { items: CarItem[] }) {
  if (!items.length) {
    return (
      <p className="mt-4 text-sm text-slate-400">
        No car photos yet. Once you add some, they&apos;ll show up here.
      </p>
    );
  }

  return (
    <div
      className="mt-3"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1rem",
      }}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="group flex flex-col overflow-hidden rounded-xl bg-slate-950/90 text-xs shadow-sm ring-1 ring-slate-800/80 transition hover:bg-slate-900/90 hover:ring-sky-500/70"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 px-3 py-3">
            <h3 className="text-sm font-semibold text-slate-50 line-clamp-2">
              {item.title}
            </h3>

            {item.subtitle && (
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {item.subtitle}
              </p>
            )}

            <div className="mt-1 flex items-end justify-between gap-3">
              {/* Tags */}
              <div className="text-[10px] uppercase tracking-wide text-slate-500 line-clamp-1">
                {item.tags && item.tags.length > 0 ? (
                  item.tags
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .join(" · ")
                ) : (
                  <span className="opacity-50">No tags yet</span>
                )}
              </div>

              {/* Likes + views */}
              <div className="flex items-center gap-3 text-slate-300">
                <div className="text-sm leading-none">
                  <LikeButton
                    photoId={String(item.id)}
                    initialLikes={item.likes ?? 0}
                  />
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] leading-none opacity-90">
                  <span className="text-base">👁</span>
                  <span className="font-medium tabular-nums">
                    {item.views ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
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

      <section className="mt-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Garage</h2>
          <p className="section-subtitle">
            A visual log of the cars I&apos;ve owned or cared about.
          </p>
        </div>

        <CarsGrid items={items} />

        {/* bump views for all car photos on this page */}
        <PhotoViewTracker ids={items.map((item) => item.id)} />
      </section>
    </div>
  );
}
