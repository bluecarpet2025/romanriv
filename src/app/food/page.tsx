import Image from "next/image";
import { LikeButton } from "@/components/LikeButton";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";
import { PhotoViewTracker } from "@/components/PhotoViewTracker";

export const metadata = {
  title: "Food | romanriv.com",
};

export type GalleryItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  tags?: string[];
  likes?: number;
  views?: number;
};

async function getFoodPhotos(): Promise<GalleryItem[]> {
  const fallback: GalleryItem[] = [
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
      "id, title, description, image_path, tags, category, created_at, likes, views"
    )
    .eq("category", "food")
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

export default async function FoodPage() {
  const items = await getFoodPhotos();

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Food
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          For the last few years, every time I cook something and the plate
          looks good, I take a picture. This page is a collage of those meals:
          post-gym dinners, weekend experiments, and whatever looked good enough
          to grab the camera.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Over time, each dish will be tied to a real recipe entry with tags,
          notes, and better search. For now, it&apos;s a visual log powered by
          Supabase.
        </p>
      </header>

      <section className="mt-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Recent dishes</h2>
          <p className="section-subtitle">
            Tags, likes, and views per picture.
          </p>
        </div>

        {/* TILE GRID (3 across on desktop) */}
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

              {/* Text + meta */}
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
                      <span>
                        {item.tags
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
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

        {/* bump views for all photos rendered on this page */}
        <PhotoViewTracker ids={items.map((item) => item.id)} />
      </section>
    </div>
  );
}
