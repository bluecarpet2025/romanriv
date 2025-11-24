// src/components/GalleryGrid.tsx
"use client";

export type GalleryItem = {
  id: number | string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string;
  tags?: string[];
};

type GalleryGridProps = {
  items: GalleryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-300">
          No photos yet. Once you upload some, they&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="card overflow-hidden p-0"
        >
          {/* Thumbnail */}
          {item.imageUrl && (
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900/80">
              {/* Using plain img to avoid Next Image config headaches */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Text content */}
          <div className="px-4 py-3">
            <h3 className="truncate text-sm font-semibold tracking-tight text-slate-100 sm:text-base">
              {item.title}
            </h3>

            {item.subtitle && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-300 sm:text-sm">
                {item.subtitle}
              </p>
            )}

            {item.tags && item.tags.length > 0 && (
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-wide text-slate-400">
                {item.tags.join(" • ")}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
