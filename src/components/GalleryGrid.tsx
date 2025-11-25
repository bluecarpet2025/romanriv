// src/components/GalleryGrid.tsx
import Image from "next/image";

export type GalleryItem = {
  id: number | string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  tags?: string[];
  likes?: number | null;
  views?: number | null;
};

type GalleryGridProps = {
  items: GalleryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  if (!items || items.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-400">
        No items yet. Once you upload photos, they’ll show up here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <article
          key={item.id}
          className="card overflow-hidden"
        >
          {/* Image wrapper – keeps the card shape, but lets the whole photo be visible */}
          <div className="rounded-md bg-slate-950/80 overflow-hidden flex items-center justify-center">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={1600}
              height={1200}
              className="w-full h-auto object-contain"
              priority={false}
            />
          </div>

          {/* Text + meta */}
          <div className="mt-3 flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-slate-50">
              {item.title}
            </h3>

            {item.subtitle && item.subtitle.trim().length > 0 && (
              <p className="text-xs text-slate-300">
                {item.subtitle}
              </p>
            )}

            {item.tags && item.tags.length > 0 && (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                {item.tags
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <div className="mt-1 flex items-center justify-end gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>♥</span>
                <span>{item.likes ?? 0}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>👁</span>
                <span>{item.views ?? 0}</span>
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
