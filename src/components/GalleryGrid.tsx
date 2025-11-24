// src/components/GalleryGrid.tsx
"use client";

import React from "react";

export type GalleryItem = {
  id: string | number;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
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
      <p className="text-sm text-slate-400">
        No photos yet. Use the admin uploader to add some.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="card flex flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          {item.imageUrl && (
            <div className="sm:w-1/3">
              <div className="relative overflow-hidden rounded-lg bg-slate-900/60">
                {/* Plain <img> so we don't depend on next/image host config */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="block h-48 w-full object-cover sm:h-full"
                />
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-50">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-1 text-xs text-slate-300">
                  {item.subtitle}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                  {item.tags.join(" • ")}
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center justify-end gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">♡</span>
                {item.likes ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">👁</span>
                {item.views ?? 0}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
