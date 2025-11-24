// src/app/admin/photos/manage/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CategoryValue = "food" | "car" | "anime" | "business";

const CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "car", label: "Cars" },
  { value: "anime", label: "Anime" },
  { value: "business", label: "Business / Projects" },
];

type PhotoRow = {
  id: number;
  category: CategoryValue | string;
  title: string | null;
  description: string | null;
  image_path: string;
  tags: string[] | null;
  likes_count: number | null;
  views_count: number | null;
  created_at: string | null;
};

type EditablePhoto = PhotoRow & {
  tagsText: string; // comma-separated tags in the UI
  isSaving?: boolean;
  error?: string | null;
  success?: string | null;
};

export default function ManagePhotosPage() {
  const [category, setCategory] = useState<CategoryValue>("food");
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch photos when category changes
  useEffect(() => {
    void fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function fetchPhotos() {
    setLoading(true);
    setGlobalError(null);

    const { data, error } = await supabase
      .from("photos")
      .select(
        "id, category, title, description, image_path, tags, likes_count, views_count, created_at"
      )
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading photos", error);
      setGlobalError(error.message);
      setPhotos([]);
      setLoading(false);
      return;
    }

    const mapped: EditablePhoto[] =
      data?.map((row: any) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        description: row.description,
        image_path: row.image_path,
        tags: row.tags ?? [],
        likes_count: row.likes_count ?? 0,
        views_count: row.views_count ?? 0,
        created_at: row.created_at,
        tagsText: (row.tags ?? []).join(", "),
        isSaving: false,
        error: null,
        success: null,
      })) ?? [];

    setPhotos(mapped);
    setLoading(false);
  }

  function updateField(
    id: number,
    field: keyof EditablePhoto,
    value: string | number
  ) {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]: value,
              // clear per-row messages
              error: null,
              success: null,
            }
          : p
      )
    );
  }

  async function handleSave(photo: EditablePhoto) {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photo.id ? { ...p, isSaving: true, error: null, success: null } : p
      )
    );

    const tagsArray =
      photo.tagsText
        ?.split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0) ?? [];

    const { error } = await supabase
      .from("photos")
      .update({
        title: photo.title,
        description: photo.description,
        tags: tagsArray,
        likes_count: photo.likes_count ?? 0,
        views_count: photo.views_count ?? 0,
      })
      .eq("id", photo.id);

    if (error) {
      console.error("Error updating photo", error);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                isSaving: false,
                error: error.message,
                success: null,
              }
            : p
        )
      );
      return;
    }

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photo.id
          ? {
              ...p,
              isSaving: false,
              error: null,
              success: "Saved",
              tags: tagsArray,
            }
          : p
      )
    );
  }

  return (
    <div className="page-shell-wide">
      <header className="card mb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Manage photos
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Edit titles, descriptions, tags, likes, and views for your photos.
          This is an admin-only page and isn&apos;t linked in the navigation.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Use the category selector to switch between food, cars, anime, and
          business/project photos.
        </p>
      </header>

      <section className="card space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-200">
              Category
              <select
                className="mt-1 ml-2 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as CategoryValue);
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={fetchPhotos}
              className="rounded-md bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-600"
            >
              Refresh
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Changes save per row. Tags are comma-separated.
          </p>
        </div>

        {globalError && (
          <p className="rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200">
            Error loading photos: {globalError}
          </p>
        )}

        {loading && (
          <p className="text-sm text-slate-300">Loading photos…</p>
        )}

        {!loading && photos.length === 0 && !globalError && (
          <p className="text-sm text-slate-300">
            No photos found for this category yet.
          </p>
        )}

        {/* Photo list */}
        <div className="space-y-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 sm:flex-row"
            >
              {/* Thumbnail */}
              <div className="w-full shrink-0 sm:w-40">
                <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80 pb-[75%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      photo.image_path.startsWith("http")
                        ? photo.image_path
                        : `https://${
                            process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
                              /^https?:\/\//,
                              ""
                            )
                          }/storage/v1/object/public/media/${photo.image_path}`
                    }
                    alt={photo.title ?? ""}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <p className="mt-1 truncate text-[10px] text-slate-500">
                  {photo.image_path}
                </p>
              </div>

              {/* Editable fields */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Title
                    </label>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                      value={photo.title ?? ""}
                      onChange={(e) =>
                        updateField(photo.id, "title", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Likes
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                        value={photo.likes_count ?? 0}
                        onChange={(e) =>
                          updateField(
                            photo.id,
                            "likes_count",
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Views
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                        value={photo.views_count ?? 0}
                        onChange={(e) =>
                          updateField(
                            photo.id,
                            "views_count",
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Description
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                    rows={2}
                    value={photo.description ?? ""}
                    onChange={(e) =>
                      updateField(photo.id, "description", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Tags (comma-separated)
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                    value={photo.tagsText}
                    onChange={(e) =>
                      updateField(photo.id, "tagsText", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500">
                    ID {photo.id}
                    {photo.created_at
                      ? ` • ${new Date(
                          photo.created_at
                        ).toLocaleDateString()}`
                      : ""}
                  </p>

                  <div className="flex items-center gap-3">
                    {photo.error && (
                      <span className="text-[11px] text-red-300">
                        {photo.error}
                      </span>
                    )}
                    {photo.success && !photo.error && (
                      <span className="text-[11px] text-emerald-300">
                        {photo.success}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave(photo)}
                      disabled={photo.isSaving}
                      className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {photo.isSaving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

