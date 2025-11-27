"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "anime-covers"; // make sure this bucket exists in Supabase

// DB row shape
type DbAnimeRow = {
  id: string;
  title: string;
  status: string | null;
  total_seasons: number | null;
  seasons_watched: number | null;
  is_favorite: boolean | null;
  tags: string[] | null;
  notes: string | null;
  likes: number | null;
  views: number | null;
  sort_order: number | null;
  cover_url: string | null;
};

// UI row shape
type AnimeRow = {
  id: string;
  title: string;
  favorite: boolean;
  status: string;
  total_seasons: number;
  seasons_watched: number;
  notes: string | null;
  tags: string[];
  likes: number;
  views: number;
  sortOrder: number;
  coverUrl: string | null;
};

const STATUS_OPTIONS = [
  "watching",
  "watched",
  "planned",
  "on-hold",
  "dropped",
];

function normaliseRow(row: DbAnimeRow): AnimeRow {
  return {
    id: row.id,
    title: row.title,
    favorite: !!row.is_favorite,
    status: row.status ?? "planned",
    total_seasons: row.total_seasons ?? 1,
    seasons_watched: row.seasons_watched ?? 0,
    notes: row.notes,
    tags: (row.tags ?? []).map((t) => t.trim()).filter(Boolean),
    likes: row.likes ?? 0,
    views: row.views ?? 0,
    sortOrder: row.sort_order ?? 0,
    coverUrl: row.cover_url ?? null,
  };
}

export default function AdminAnimePage() {
  const [rows, setRows] = useState<AnimeRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const current = rows[selectedIndex] ?? null;

  // Load anime list
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("anime")
        .select(
          "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order, cover_url"
        );

      if (error) {
        console.error("[admin/anime] load error", error);
        setRows([]);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((r) =>
        normaliseRow(r as DbAnimeRow)
      );

      mapped.sort((a, b) => a.sortOrder - b.sortOrder);

      setRows(mapped);
      setSelectedIndex(0);
      setLoading(false);
    };

    load();
  }, []);

  const handleFieldChange = <K extends keyof AnimeRow>(
    field: K,
    value: AnimeRow[K]
  ) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === selectedIndex ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = async () => {
    if (!current) return;

    setSaving(true);

    const payload = {
      title: current.title,
      status: current.status,
      total_seasons: current.total_seasons,
      seasons_watched: current.seasons_watched,
      is_favorite: current.favorite,
      tags: current.tags,
      notes: current.notes,
      sort_order: current.sortOrder,
      cover_url: current.coverUrl,
    };

    const { error } = await supabase
      .from("anime")
      .update(payload)
      .eq("id", current.id);

    if (error) {
      console.error("[admin/anime] save error", error);
      alert("Failed to save changes.");
    }

    setSaving(false);
  };

  const handleAddNew = async () => (
    setAdding(true),
    (async () => {
      const maxSort =
        rows.length > 0
          ? Math.max(...rows.map((r) => r.sortOrder))
          : 0;

      const { data, error } = await supabase
        .from("anime")
        .insert({
          title: "New anime",
          status: "planned",
          total_seasons: 1,
          seasons_watched: 0,
          is_favorite: false,
          tags: [],
          notes: "",
          sort_order: maxSort + 1,
          cover_url: null,
        })
        .select(
          "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order, cover_url"
        )
        .single();

      if (error || !data) {
        console.error("[admin/anime] add error", error);
        alert("Failed to add anime.");
        setAdding(false);
        return;
      }

      const newRow = normaliseRow(data as DbAnimeRow);

      setRows((prev) => {
        const next = [...prev, newRow].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );
        const newIndex = next.findIndex((r) => r.id === newRow.id);
        setSelectedIndex(newIndex === -1 ? 0 : newIndex);
        return next;
      });

      setAdding(false);
    })()
  );

  const goPrev = () => {
    setSelectedIndex((idx) => (idx > 0 ? idx - 1 : idx));
  };

  const goNext = () => {
    setSelectedIndex((idx) =>
      idx < rows.length - 1 ? idx + 1 : idx
    );
  };

  // Upload cover image to Supabase Storage and save URL to this row
  const handleCoverUpload = async (file: File) => {
    if (!current) return;

    try {
      setUploading(true);

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${current.id}/cover.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        console.error("[admin/anime] upload error", uploadError);
        alert("Failed to upload image.");
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

      // Update in DB
      const { error: updateError } = await supabase
        .from("anime")
        .update({ cover_url: publicUrl })
        .eq("id", current.id);

      if (updateError) {
        console.error("[admin/anime] cover_url update error", updateError);
        alert("Uploaded, but failed to save URL.");
      }

      // Update local state
      setRows((prev) =>
        prev.map((row, idx) =>
          idx === selectedIndex ? { ...row, coverUrl: publicUrl } : row
        )
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Anime admin
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Manage your anime list here. This is only for you – the public page
          under <code className="px-1">/anime</code> will render a nicer view
          of this data.
        </p>
      </header>

      <section className="card mt-4 space-y-4">
        {/* Header row with fixed spacing */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Anime list
            </h2>

            {rows.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <span>Select title:</span>
                <select
                  value={current?.id ?? ""}
                  onChange={(e) => {
                    const idx = rows.findIndex(
                      (r) => r.id === e.target.value
                    );
                    if (idx !== -1) setSelectedIndex(idx);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.favorite ? "★ " : ""}
                      {row.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={goPrev}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  →
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            disabled={adding}
            className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {adding ? "Adding..." : "Add anime"}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : !current ? (
          <p className="text-sm text-slate-400">
            No anime yet. Click &quot;Add anime&quot; to start.
          </p>
        ) : (
          <div className="space-y-3 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs sm:text-sm">
            {/* Favorite + title + status + seasons */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1 text-slate-200">
                <input
                  type="checkbox"
                  checked={current.favorite}
                  onChange={(e) =>
                    handleFieldChange("favorite", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
                <span>Favorite</span>
              </label>

              <div className="flex-1 min-w-[160px]">
                <label className="block text-slate-300">Title</label>
                <input
                  type="text"
                  value={current.title}
                  onChange={(e) =>
                    handleFieldChange("title", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300">Status</label>
                <select
                  value={current.status}
                  onChange={(e) =>
                    handleFieldChange("status", e.target.value)
                  }
                  className="mt-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300">
                  Seasons (watched / total)
                </label>
                <div className="mt-1 flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={current.seasons_watched}
                    onChange={(e) =>
                      handleFieldChange(
                        "seasons_watched",
                        Number(e.target.value)
                      )
                    }
                    className="w-14 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min={1}
                    value={current.total_seasons}
                    onChange={(e) =>
                      handleFieldChange(
                        "total_seasons",
                        Number(e.target.value)
                      )
                    }
                    className="w-14 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Tags + notes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={current.tags.join(", ")}
                  onChange={(e) =>
                    handleFieldChange(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    )
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300">Notes</label>
                <textarea
                  rows={2}
                  value={current.notes ?? ""}
                  onChange={(e) =>
                    handleFieldChange("notes", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
              </div>
            </div>

            {/* Cover image URL + upload/preview */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300">
                  Cover image URL
                </label>
                <input
                  type="text"
                  value={current.coverUrl ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "coverUrl",
                      e.target.value.trim() || null
                    )
                  }
                  placeholder="https://… or /anime-covers/black-bullet.jpg"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  You can paste a URL directly or upload an image using
                  the field on the right.
                </p>
              </div>

              <div>
                <label className="block text-slate-300">
                  Upload cover image
                </label>
                <div className="mt-1 flex items-start gap-3">
                  <div className="h-20 w-32 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                    {current.coverUrl ? (
                      <img
                        src={current.coverUrl}
                        alt={current.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void handleCoverUpload(file);
                          e.target.value = "";
                        }
                      }}
                      className="block w-full text-xs text-slate-100 file:mr-2 file:rounded-md file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-50 hover:file:bg-slate-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      {uploading
                        ? "Uploading…"
                        : "JPEG/PNG is fine. Uploading will auto-save the URL."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Position + likes/views + save */}
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Position: {current.sortOrder} · Likes: {current.likes} ·
                Views: {current.views}
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
