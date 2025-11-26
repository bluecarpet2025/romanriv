// src/app/admin/anime/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  sort_order: number;
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
    sort_order: row.sort_order ?? 0,
  };
}

export default function AdminAnimePage() {
  const [rows, setRows] = useState<AnimeRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // Load anime list
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("anime")
        .select(
          "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order"
        )
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("[admin/anime] load error", error);
        setRows([]);
        setSelectedIndex(0);
      } else {
        const mapped = (data ?? []).map((r) =>
          normaliseRow(r as DbAnimeRow)
        );
        setRows(mapped);
        setSelectedIndex(0);
      }

      setLoading(false);
    };

    load();
  }, []);

  const current = rows[selectedIndex];

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
      sort_order: current.sort_order,
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

  const handleAddNew = async () => {
    setAdding(true);

    const nextOrder =
      (rows[rows.length - 1]?.sort_order ?? 0) + 1;

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
        sort_order: nextOrder,
      })
      .select(
        "id, title, status, total_seasons, seasons_watched, is_favorite, tags, notes, likes, views, sort_order"
      )
      .single();

    if (error || !data) {
      console.error("[admin/anime] add error", error);
      alert("Failed to add anime.");
    } else {
      const newRow = normaliseRow(data as DbAnimeRow);
      setRows((prev) => [...prev, newRow]);
      setSelectedIndex(rows.length); // select the new one
    }

    setAdding(false);
  };

  const handlePrev = () => {
    if (!rows.length) return;
    setSelectedIndex((i) => (i === 0 ? rows.length - 1 : i - 1));
  };

  const handleNext = () => {
    if (!rows.length) return;
    setSelectedIndex((i) => (i === rows.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Anime admin
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Manage your anime list here. This is only for you – the public
          page under <code className="px-1">/anime</code> will render a
          nicer view of this data.
        </p>
      </header>

      <section className="card mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Anime list
            </h2>
            {rows.length > 0 && (
              <>
                <span className="text-xs text-slate-400">
                  Select title:
                </span>
                <select
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  value={current?.id ?? ""}
                  onChange={(e) => {
                    const idx = rows.findIndex(
                      (r) => r.id === e.target.value
                    );
                    if (idx >= 0) setSelectedIndex(idx);
                  }}
                >
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.favorite ? "★ " : ""}
                      {row.title}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    title="Previous"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    title="Next"
                  >
                    →
                  </button>
                </div>
              </>
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
        ) : !rows.length ? (
          <p className="text-sm text-slate-400">
            No anime yet. Click &quot;Add anime&quot; to start.
          </p>
        ) : (
          current && (
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs sm:text-sm">
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

                <div className="min-w-[160px] flex-1">
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

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Position: {current.sort_order} · Likes:{" "}
                  {current.likes ?? 0} · Views: {current.views ?? 0}
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
          )
        )}
      </section>
    </div>
  );
}
