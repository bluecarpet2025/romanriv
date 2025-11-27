// src/components/GalleryGrid.tsx
import Image from "next/image";
import { LikeButton } from "@/components/LikeButton";
import { PhotoViewTracker } from "@/components/PhotoViewTracker";

export type GalleryItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  tags?: string[];
  likes?: number;
  views?: number;
};

type GalleryGridProps = {
  items: GalleryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  if (!items || items.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-400">
        Nothing here yet. Once you add photos, they&apos;ll show up in this
        list.
      </p>
    );
  }

  return (
    <>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                priority={false}
              />
            </div>

            {/* Text + meta */}
            <div className="flex flex-1 flex-col gap-2 px-3 py-3">
              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-50 line-clamp-2">
                {item.title}
              </h3>

              {/* Subtitle / description */}
              {item.subtitle && (
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {item.subtitle}
                </p>
              )}

              {/* Bottom row: tags + likes/views */}
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

            {/* Invisible view tracker to bump the view counter for this photo */}
            <PhotoViewTracker ids={[String(item.id)]} />
          </article>
        ))}
      </div>
    </>
  );
}
