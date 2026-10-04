"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import ImageViewer from "@/components/ImageViewer";
import { createSupabaseBrowser } from "@/lib/supabaseAuth";
import { uploadAdminImage } from "@/lib/upload-client";
import { IMAGE_ACCEPT } from "@/lib/uploads";
import { ANIME_COLUMNS, ANIME_STATUSES, animeSavePayload, browseAnime, normaliseAnime,
  type AnimeDraft, type AnimeRow, type AnimeSort, type DbAnimeRow } from "@/lib/anime-management";
import styles from "./page.module.css";

type Operation = "save" | "upload" | "delete";
type RowMessage = { error?: string; success?: string };
type DraftField = "title" | "favorite" | "status" | "seasons_watched" | "total_seasons" | "tagsText" | "notes" | "sortOrder" | "coverUrl";
const makeDraft = (row: AnimeRow): AnimeDraft => ({ ...row, tagsText: row.tags.join(", "), dirty: false });
const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

function Cover({ src, title, onView }: { src: string; title: string; onView: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.poster}>
      {!src || failed ? (
        <div className={styles.placeholder} role="img" aria-label={src ? "Cover unavailable" : "No cover"}>
          <span aria-hidden="true">▧</span><strong>{src ? "Cover unavailable" : "No cover yet"}</strong>
        </div>
      ) : (
        <button type="button" className={styles.coverButton} aria-haspopup="dialog"
          aria-label={"View cover: " + title} onClick={onView}>
          <Image src={src} alt={title} width={144} height={216} unoptimized onError={() => setFailed(true)} />
          <span className={styles.viewHint} aria-hidden="true">View cover</span>
        </button>
      )}
    </div>
  );
}

export default function AdminAnimePage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [rows, setRows] = useState<AnimeRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AnimeDraft>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<AnimeSort>("sort-order");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [operations, setOperations] = useState<Record<string, Operation | undefined>>({});
  const [messages, setMessages] = useState<Record<string, RowMessage>>({});
  const [globalError, setGlobalError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewing, setViewing] = useState<{ src: string; alt: string } | null>(null);
  const pending = useRef(new Set<string>());
  const addingRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const busy = adding || Object.values(operations).some(Boolean);
  const visibleRows = useMemo(() => browseAnime(rows, search, status, favoritesOnly, sort), [rows, search, status, favoritesOnly, sort]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Please sign in again.");
        const { data, error } = await supabase.from("anime").select(ANIME_COLUMNS);
        if (error) throw new Error(error.message);
        if (!cancelled) setRows((data as DbAnimeRow[] ?? []).map(normaliseAnime));
      } catch (error) {
        if (!cancelled) setGlobalError(message(error, "Could not load anime."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [supabase, revision]);

  useEffect(() => {
    if (selectedId) {
      titleRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [selectedId]);

  function openEditor(row: AnimeRow) {
    setDrafts((previous) => previous[row.id] ? previous : { ...previous, [row.id]: makeDraft(row) });
    setSelectedId(row.id);
  }
  function updateDraft<K extends DraftField>(id: string, field: K, value: AnimeDraft[K]) {
    setDrafts((previous) => ({ ...previous, [id]: { ...previous[id], [field]: value, dirty: true } }));
    setMessages((previous) => ({ ...previous, [id]: {} }));
  }
  function start(id: string, operation: Operation) {
    if (pending.current.has(id) || addingRef.current) return false;
    pending.current.add(id);
    setOperations((previous) => ({ ...previous, [id]: operation }));
    setMessages((previous) => ({ ...previous, [id]: {} }));
    setNotice("");
    return true;
  }
  function finish(id: string) {
    pending.current.delete(id);
    setOperations((previous) => ({ ...previous, [id]: undefined }));
  }
  function rowMessage(id: string, value: RowMessage) {
    setMessages((previous) => ({ ...previous, [id]: value }));
  }
  function refresh() {
    if (pending.current.size || addingRef.current) return;
    if (Object.values(drafts).some((draft) => draft.dirty) && !window.confirm("Refresh and discard unsaved anime edits?")) return;
    setLoading(true); setGlobalError(""); setNotice(""); setRows([]); setDrafts({}); setMessages({}); setSelectedId(null);
    setRevision((value) => value + 1);
  }
  async function save(draft: AnimeDraft) {
    if (!start(draft.id, "save")) return;
    try {
      const { data, error } = await supabase.from("anime").update(animeSavePayload(draft))
        .eq("id", draft.id).select(ANIME_COLUMNS).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Anime was not saved. Refresh and check your access.");
      const saved = normaliseAnime(data as DbAnimeRow);
      setRows((previous) => previous.map((row) => row.id === saved.id ? saved : row));
      setDrafts((previous) => ({ ...previous, [saved.id]: makeDraft(saved) }));
      rowMessage(saved.id, { success: "Saved" });
      setNotice('Saved "' + saved.title + '".');
    } catch (error) {
      rowMessage(draft.id, { error: message(error, "Could not save anime.") });
    } finally { finish(draft.id); }
  }
  async function addAnime() {
    if (pending.current.size || addingRef.current || loading) return;
    addingRef.current = true; setAdding(true); setGlobalError(""); setNotice("");
    try {
      const maxSort = rows.length ? Math.max(...rows.map((row) => row.sortOrder)) : 0;
      const { data, error } = await supabase.from("anime").insert({
        title: "New anime", status: "planned", total_seasons: 1, seasons_watched: 0,
        is_favorite: false, tags: [], notes: "", sort_order: maxSort + 1, cover_url: null,
      }).select(ANIME_COLUMNS).single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Anime was not added. Please retry.");
      const added = normaliseAnime(data as DbAnimeRow);
      setRows((previous) => [...previous, added]);
      setDrafts((previous) => ({ ...previous, [added.id]: makeDraft(added) }));
      setSearch(""); setStatus("all"); setFavoritesOnly(false); setSort("sort-order"); setSelectedId(added.id);
      setNotice("Added anime. Enter its details and save; you can upload a cover now.");
    } catch (error) { setGlobalError(message(error, "Could not add anime.")); }
    finally { addingRef.current = false; setAdding(false); }
  }
  async function uploadCover(id: string, file: File) {
    if (!start(id, "upload")) return;
    try {
      // Existing helper verifies R2 and updates the DB before returning the URL.
      const { publicUrl } = await uploadAdminImage(file, "anime-covers", id);
      setRows((previous) => previous.map((row) => row.id === id ? { ...row, coverUrl: publicUrl } : row));
      setDrafts((previous) => ({ ...previous, [id]: { ...previous[id], coverUrl: publicUrl } }));
      rowMessage(id, { success: "Cover uploaded and saved. Other edits still need Save." });
    } catch (error) { rowMessage(id, { error: message(error, "Cover upload failed. Please retry.") }); }
    finally { finish(id); }
  }
  async function deleteAnime(row: AnimeRow) {
    if (pending.current.has(row.id) || addingRef.current) return;
    if (!window.confirm('Delete "' + row.title + '"?\n\nThis permanently deletes the anime record. Cover images will be retained.')) return;
    if (!start(row.id, "delete")) return;
    try {
      const response = await fetch("/api/anime/" + encodeURIComponent(row.id), {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete anime.");
      setRows((previous) => previous.filter((item) => item.id !== row.id));
      setDrafts((previous) => { const next = { ...previous }; delete next[row.id]; return next; });
      setSelectedId((previous) => previous === row.id ? null : previous);
      setNotice('Deleted "' + row.title + '". Cover images were retained.');
    } catch (error) { rowMessage(row.id, { error: message(error, "Could not delete anime. Refresh to check its status.") }); }
    finally { finish(row.id); }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Anime library</p><h1>Manage anime</h1><p>Browse your collection, edit details, and replace covers.</p></div>
        <Link href="/admin">Admin dashboard</Link>
      </header>
      <div className={styles.toolbar}>
        <label className={styles.search}>Search by title<input type="search" value={search} placeholder="Find an anime…"
          disabled={busy || loading} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Sort<select value={sort} disabled={busy || loading} onChange={(event) => setSort(event.target.value as AnimeSort)}>
          <option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option>
          <option value="sort-order">Sort order</option><option value="status">Status</option>
        </select></label>
        <label>Status<select value={status} disabled={busy || loading} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All</option>{ANIME_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select></label>
        <label className={styles.check}><input type="checkbox" checked={favoritesOnly} disabled={busy || loading}
          onChange={(event) => setFavoritesOnly(event.target.checked)} />Favorites only</label>
        <button type="button" disabled={loading || busy} onClick={refresh}>Refresh</button>
        <span className={styles.count}>{loading ? "Loading…" : visibleRows.length + " of " + rows.length + " anime"}</span>
        <button type="button" className={styles.primary} disabled={loading || busy} onClick={() => void addAnime()}>{adding ? "Adding…" : "+ Add anime"}</button>
      </div>
      {globalError && <p className={styles.error} role="alert">{globalError}</p>}
      {notice && <p className={styles.success} role="status">{notice}</p>}
      {loading && <p className={styles.empty} role="status">Loading anime…</p>}
      {!loading && !globalError && !rows.length && <p className={styles.empty}>No anime yet. Add an anime to start your collection.</p>}
      {!loading && !!rows.length && !visibleRows.length && <p className={styles.empty}>No anime match these filters.</p>}
      <div className={styles.grid}>
        {visibleRows.map((saved) => {
          const editing = saved.id === selectedId;
          const draft = drafts[saved.id];
          const row = editing && draft ? draft : saved;
          const operation = operations[saved.id];
          const disabled = !!operation || adding;
          const feedback = messages[saved.id];
          return (
            <article key={saved.id} className={styles.card + (editing ? " " + styles.editing : "")}
              aria-label={row.title} aria-busy={!!operation}>
              <div className={styles.summary}>
                <Cover key={row.coverUrl} src={row.coverUrl} title={row.title || "Untitled anime"}
                  onView={() => setViewing({ src: row.coverUrl, alt: row.title || "Untitled anime" })} />
                <div className={styles.overview}>
                  <h2>{row.favorite && <span className={styles.star} aria-label="Favorite">★ </span>}{row.title || "Untitled anime"}</h2>
                  <span className={styles.badge}>{ANIME_STATUSES.find((item) => item.value === row.status)?.label ?? row.status}</span>
                  <p>{row.seasons_watched} / {row.total_seasons} seasons watched</p>
                  <p>Position {row.sortOrder}</p>
                  <dl className={styles.stats}><div><dt>Likes</dt><dd>{saved.likes}</dd></div><div><dt>Views</dt><dd>{saved.views}</dd></div></dl>
                  <button type="button" aria-expanded={editing} aria-controls={"editor-" + saved.id} disabled={busy}
                    onClick={() => editing ? setSelectedId(null) : openEditor(saved)}>{editing ? "Close editor" : "Edit anime"}</button>
                  {draft?.dirty && <small className={styles.unsaved}>Unsaved changes</small>}
                </div>
              </div>
              {editing && draft && (
                <form id={"editor-" + saved.id} className={styles.editor} onSubmit={(event) => { event.preventDefault(); void save(draft); }}>
                  <p className={styles.editLabel}>Editing {row.title || "Untitled anime"}</p>
                  <fieldset disabled={disabled} className={styles.fields}>
                    <label>Title<input ref={titleRef} required value={draft.title} onChange={(event) => updateDraft(saved.id, "title", event.target.value)} /></label>
                    <div className={styles.twoColumns}>
                      <label>Status<select value={draft.status} onChange={(event) => updateDraft(saved.id, "status", event.target.value)}>
                        {!ANIME_STATUSES.some((item) => item.value === draft.status) && <option value={draft.status}>{draft.status}</option>}
                        {ANIME_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select></label>
                      <label className={styles.check}><input type="checkbox" checked={draft.favorite} onChange={(event) => updateDraft(saved.id, "favorite", event.target.checked)} />Favorite</label>
                    </div>
                    <div className={styles.threeColumns}>
                      <label>Watched seasons<input type="number" min={0} step={1} required value={draft.seasons_watched} onChange={(event) => updateDraft(saved.id, "seasons_watched", Number(event.target.value))} /></label>
                      <label>Total seasons<input type="number" min={1} step={1} required value={draft.total_seasons} onChange={(event) => updateDraft(saved.id, "total_seasons", Number(event.target.value))} /></label>
                      <label>Sort order<input type="number" step={1} required value={draft.sortOrder} onChange={(event) => updateDraft(saved.id, "sortOrder", Number(event.target.value))} /></label>
                    </div>
                    <label>Tags <span className={styles.muted}>(comma-separated)</span><input value={draft.tagsText} onChange={(event) => updateDraft(saved.id, "tagsText", event.target.value)} /></label>
                    <label>Notes<textarea rows={3} value={draft.notes} onChange={(event) => updateDraft(saved.id, "notes", event.target.value)} /></label>
                    <label>Replace cover<input className={styles.fileInput} type="file" accept={IMAGE_ACCEPT} onChange={(event) => {
                      const file = event.target.files?.[0]; event.target.value = "";
                      if (file) void uploadCover(saved.id, file);
                    }} /></label>
                    <p className={styles.help}>{operation === "upload" ? "Uploading and verifying cover…" : "JPEG, PNG, WebP, GIF, or AVIF; up to 20 MiB. Uploads automatically save the cover."}</p>
                    <details className={styles.advanced}><summary>Advanced: cover URL</summary>
                      <label>Manual cover URL<input type="text" placeholder="https://…" value={draft.coverUrl} onChange={(event) => updateDraft(saved.id, "coverUrl", event.target.value)} /></label>
                      <p className={styles.help}>Manual URL changes are applied with Save.</p>
                    </details>
                    <div className={styles.actions}>
                      <button type="button" className={styles.delete} onClick={() => void deleteAnime(saved)}>{operation === "delete" ? "Deleting…" : "Delete anime"}</button>
                      <button type="submit" className={styles.primary}>{operation === "save" ? "Saving…" : "Save"}</button>
                    </div>
                  </fieldset>
                </form>
              )}
              {feedback?.error && <p className={styles.error} role="alert">{feedback.error}</p>}
              {feedback?.success && <p className={styles.success} role="status">{feedback.success}</p>}
            </article>
          );
        })}
      </div>
      {viewing && <ImageViewer key={viewing.src} src={viewing.src} alt={viewing.alt} onClose={() => setViewing(null)} />}
    </div>
  );
}
