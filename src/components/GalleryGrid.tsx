import Image from "next/image";
import Link from "next/link";
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
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="card overflow-hidden p-0 sm:p-0"
        >
          {/* Image */}
          <div className="relative w-full overflow-hidden bg-slate-900">
            <div className="relative mx-auto max-w-3xl">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 800px, 100vw"
                  className="object-contain"
                  priority={false}
                />
              </div>
            </div>
          </div>

          {/* Text + meta */}
          <div className="flex flex-col gap-1 px-4 py-3 sm:px-6 sm:py-4">
            {/* Title */}
            <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
              {item.title}
            </h3>

            {/* Subtitle / description */}
            {item.subtitle && (
              <p className="text-xs text-slate-400 sm:text-sm">
                {item.subtitle}
              </p>
            )}

            {/* Bottom row: tags on left, likes/views on right */}
            <div className="mt-3 flex items-center justify-between gap-3">
              {/* Tags: simple, dot-separated */}
              <div className="text-[11px] uppercase tracking-wide text-slate-400 sm:text-xs">
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
              <div className="flex items-center gap-4 text-slate-300">
                {/* Like button (interactive). Font size here makes the heart bigger */}
                <div className="text-sm sm:text-base leading-none">
                  <LikeButton
                    photoId={String(item.id)}
                    initialLikes={item.likes ?? 0}
                  />
                </div>

                {/* Views (static counter) */}
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm leading-none opacity-90">
                  <span className="text-base sm:text-lg">👁</span>
                  <span className="font-medium">{item.views ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invisible view tracker to bump the view counter */}
          <PhotoViewTracker ids={[String(item.id)]} />
        </article>
      ))}
    </div>
  );
}
