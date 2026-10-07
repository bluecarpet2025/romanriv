"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMediaPublicUrl } from "@/lib/supabase";
import { createSupabaseBrowser } from "@/lib/supabaseAuth";
import ImageViewer from "@/components/ImageViewer";
import MediaToolbar from "@/components/MediaToolbar";
import { browseMedia, PHOTO_SORT_OPTIONS, type MediaSort } from "@/lib/media-browsing";
import styles from "./page.module.css";

type CategoryValue = "food" | "car" | "anime" | "business";
const CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: "food", label: "Food" }, { value: "car", label: "Cars" },
  { value: "anime", label: "Anime" }, { value: "business", label: "Business / Projects" },
];
type PhotoRow = {
  id: string | number;
  category: string;
  title: string | null;
  description: string | null;
  image_path: string;
  tags: string[] | null;
  likes_count: number | null;
  views_count: number | null;
  created_at: string | null;
  image_timestamp: string | null;
};
type EditablePhoto = PhotoRow & {
  tagsText: string;
  busy?: "save" | "delete";
  imageFailed?: boolean;
  error?: string;
  success?: string;
};
type EditableField = "title" | "description" | "tagsText";

export default function ManagePhotosPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [category, setCategory] = useState<CategoryValue>("food");
  const [revision, setRevision] = useState(0);
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<PhotoRow[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [viewing, setViewing] = useState<{ src: string; alt: string } | null>(null);
  const pending = useRef(new Set<PhotoRow["id"]>());
  const busy = photos.some((photo) => !!photo.busy);
  const visibleRows = useMemo(() => browseMedia(savedPhotos, { search, sort }, (photo) => ({
    title: photo.title, description: photo.description, tags: photo.tags, imagePath: photo.image_path,
    timestamp: photo.image_timestamp ?? photo.created_at, likes: photo.likes_count, views: photo.views_count,
  })).visibleItems, [savedPhotos, search, sort]);
  const draftsById = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const visiblePhotos = visibleRows.map((row) => draftsById.get(row.id)!);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase.from("photos")
          .select("id, category, title, description, image_path, tags, likes_count, views_count, created_at, image_timestamp")
          .eq("category", category).order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) throw new Error(error.message);
        const rows = (data as PhotoRow[] ?? []);
        setSavedPhotos(rows);
        setPhotos(rows.map((row) => ({ ...row, tagsText: (row.tags ?? []).join(", ") })));
      } catch (error) {
        if (!cancelled) setGlobalError(error instanceof Error ? error.message : "Could not load photos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [category, revision, supabase]);

  function refresh(nextCategory = category) {
    if (pending.current.size) return;
    setLoading(true);
    setGlobalError(null);
    setNotice("");
    setPhotos([]);
    setSavedPhotos([]);
    setCategory(nextCategory);
    setRevision((value) => value + 1);
  }
  function patchPhoto(id: PhotoRow["id"], patch: Partial<EditablePhoto>) {
    setPhotos((previous) => previous.map((photo) => photo.id === id ? { ...photo, ...patch } : photo));
  }
  function updateField(id: PhotoRow["id"], field: EditableField, value: string | number) {
    patchPhoto(id, { [field]: value, error: undefined, success: undefined });
  }
  async function handleSave(photo: EditablePhoto) {
    if (pending.current.has(photo.id)) return;
    pending.current.add(photo.id);
    patchPhoto(photo.id, { busy: "save", error: undefined, success: undefined });
    try {
      const tags = photo.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
      const { data, error } = await supabase.from("photos").update({
        title: photo.title, description: photo.description, tags,
      }).eq("id", photo.id).select("id").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Photo was not saved. Refresh the list and check your access.");
      patchPhoto(photo.id, { tags, success: "Saved" });
      setSavedPhotos((previous) => previous.map((row) => row.id === photo.id ? {
        ...row, title: photo.title, description: photo.description, tags,
      } : row));
    } catch (error) {
      patchPhoto(photo.id, { error: error instanceof Error ? error.message : "Could not save this photo." });
    } finally {
      pending.current.delete(photo.id);
      patchPhoto(photo.id, { busy: undefined });
    }
  }
  async function handleDelete(photo: EditablePhoto) {
    if (pending.current.has(photo.id)) return;
    if (!window.confirm('Delete "' + (photo.title || "Untitled photo") + '" (ID ' + photo.id + ')?\n\nThis permanently deletes the image and photo record. If the image is already missing, its record will still be removed.')) return;
    pending.current.add(photo.id);
    patchPhoto(photo.id, { busy: "delete", error: undefined, success: undefined });
    try {
      const response = await fetch("/api/photos/" + encodeURIComponent(String(photo.id)), {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete this photo.");
      setPhotos((previous) => previous.filter((item) => item.id !== photo.id));
      setSavedPhotos((previous) => previous.filter((item) => item.id !== photo.id));
      setNotice("Deleted photo " + photo.id + ".");
    } catch (error) {
      patchPhoto(photo.id, { error: error instanceof Error ? error.message : "Could not delete this photo. Refresh to check its status." });
    } finally {
      pending.current.delete(photo.id);
      patchPhoto(photo.id, { busy: undefined });
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Photo library</p>
          <h1>Manage photos</h1>
          <p>Edit details, save changes, or remove a photo.</p>
        </div>
        <Link href="/admin/photos" className={styles.uploadLink}>Upload photos ↗</Link>
      </header>
      <MediaToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Title, description, tags, or image path"
        sort={sort} onSortChange={setSort} sortOptions={PHOTO_SORT_OPTIONS}
        filter={{ label: "Category", value: category, options: CATEGORIES, disabled: loading || busy, onChange: (value) => refresh(value as CategoryValue) }}
        visibleCount={visiblePhotos.length} totalCount={savedPhotos.length} noun="photos" loading={loading}
        onReset={() => { setSearch(""); setSort("newest"); }} onRefresh={() => refresh()} refreshDisabled={loading || busy} />
      {globalError && <p role="alert" className={styles.error}>Could not load photos: {globalError}</p>}
      {notice && <p role="status" className={styles.success}>{notice}</p>}
      {loading && <p role="status" className={styles.empty}>Loading photos…</p>}
      {!loading && !globalError && photos.length === 0 && <p className={styles.empty}>No photos in this category.</p>}
      {!loading && !globalError && photos.length > 0 && visiblePhotos.length === 0 && <p className={styles.empty}>No photos match your search. Try another search or reset the controls.</p>}
      <div className={styles.grid}>
        {visiblePhotos.map((photo) => (
          <article key={photo.id} className={styles.photoCard} aria-label={"Photo " + photo.id} aria-busy={!!photo.busy}>
            <div className={styles.previewRow}>
              <div className={styles.thumbnail}>
                {photo.imageFailed || !photo.image_path ? (
                  <div className={styles.placeholder} role="img" aria-label="Image unavailable">
                    <span aria-hidden="true">▧</span>
                    <strong>Image unavailable</strong>
                    <small>You can still edit or delete this record.</small>
                  </div>
                ) : (
                  <button type="button" className={styles.thumbnailButton}
                    aria-label={"View full image: " + (photo.title || "Untitled photo")} aria-haspopup="dialog"
                    onClick={() => setViewing({ src: getMediaPublicUrl(photo.image_path), alt: photo.title || "Untitled photo" })}>
                    <Image src={getMediaPublicUrl(photo.image_path)} alt={photo.title || "Untitled photo"} unoptimized
                      width={220} height={165} loading="lazy" onError={() => patchPhoto(photo.id, { imageFailed: true })} />
                    <span className={styles.viewHint} aria-hidden="true">View image</span>
                  </button>
                )}
              </div>
              <div className={styles.metadata}>
                <span className={styles.badge}>{photo.category}</span>
                <span title={String(photo.id)}>ID {String(photo.id).slice(0, 8)}</span>
                {photo.created_at && <time dateTime={photo.created_at}>{new Date(photo.created_at).toLocaleDateString()}</time>}
              </div>
            </div>
            <p className={styles.path} title={photo.image_path}>{photo.image_path || "No image path"}</p>
            <dl className={styles.stats} aria-label="Photo stats">
              <div><dt>Likes</dt><dd>{photo.likes_count ?? 0}</dd></div>
              <div><dt>Views</dt><dd>{photo.views_count ?? 0}</dd></div>
            </dl>
            <form onSubmit={(event) => { event.preventDefault(); void handleSave(photo); }}>
              <fieldset disabled={!!photo.busy} className={styles.fields}>
                <label>Title<input value={photo.title ?? ""} onChange={(event) => updateField(photo.id, "title", event.target.value)} /></label>
                <label>Description<textarea rows={2} value={photo.description ?? ""} onChange={(event) => updateField(photo.id, "description", event.target.value)} /></label>
                <label>Tags <span className={styles.optional}>(comma-separated)</span><input value={photo.tagsText} onChange={(event) => updateField(photo.id, "tagsText", event.target.value)} /></label>
                <div className={styles.actions}>
                  <button type="button" className={styles.deleteButton} onClick={() => void handleDelete(photo)}>{photo.busy === "delete" ? "Deleting…" : "Delete"}</button>
                  <button type="submit" className={styles.saveButton}>{photo.busy === "save" ? "Saving…" : "Save"}</button>
                </div>
              </fieldset>
            </form>
            {photo.error && <p role="alert" className={styles.error}>{photo.error}</p>}
            {photo.success && !photo.error && <p role="status" className={styles.success}>{photo.success}</p>}
          </article>
        ))}
      </div>
      {viewing && <ImageViewer key={viewing.src} src={viewing.src} alt={viewing.alt} onClose={() => setViewing(null)} />}
    </div>
  );
}

