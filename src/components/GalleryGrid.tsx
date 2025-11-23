// src/components/GalleryGrid.tsx
import Image from "next/image";

export interface GalleryItem {
  id: string | number;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  tags?: string[];
}

interface GalleryGridProps {
  items: GalleryItem[];
}

export function GalleryGrid({ items }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="card flex flex-col gap-2 overflow-hidden p-0"
        >
          <div className="relative h-40 w-full">
            <Image
              src={item.imageUrl}
              alt={item.title ?? "Gallery item"}
              fill
              sizes="(max-width: 768px) 100vw,
                     (max-width: 1200px) 50vw,
                     33vw"
              className="object-cover"
            />
          </div>
          <div className="px-4 pb-4 pt-3">
            {item.title && (
              <h3 className="text-sm font-semibold text-slate-100">
                {item.title}
              </h3>
            )}
            {item.subtitle && (
              <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
