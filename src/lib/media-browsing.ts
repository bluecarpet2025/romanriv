export type MediaSort = "newest" | "oldest" | "title-asc" | "title-desc" | "most-liked" | "most-viewed" | "sort-order";
export const PHOTO_SORT_OPTIONS: { value: MediaSort; label: string }[] = [
  { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" }, { value: "title-desc", label: "Title Z–A" },
  { value: "most-liked", label: "Most liked" }, { value: "most-viewed", label: "Most viewed" },
];
export const ANIME_SORT_OPTIONS: { value: MediaSort; label: string }[] = [
  { value: "sort-order", label: "Sort order" }, ...PHOTO_SORT_OPTIONS.slice(2),
];
export type MediaFields = {
  title: string | null;
  description?: string | null;
  tags?: readonly string[] | null;
  imagePath?: string;
  timestamp?: string | null;
  likes?: number | null;
  views?: number | null;
  sortOrder?: number | null;
  status?: string;
  favorite?: boolean;
};
type Controls = { search: string; sort: MediaSort; status?: string; favoritesOnly?: boolean };

/** Returns full ordering and matching items without mutating the loaded data. */
export function browseMedia<T>(items: readonly T[], controls: Controls, fields: (item: T) => MediaFields) {
  const terms = controls.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const entries = items.map((item, index) => ({ item, index, fields: fields(item) }));
  const byTitle = (a: MediaFields, b: MediaFields) => (a.title ?? "").localeCompare(b.title ?? "", undefined, { sensitivity: "base", numeric: true });
  const dateOrder = (a: MediaFields, b: MediaFields) => {
    const left = Date.parse(a.timestamp ?? "");
    const right = Date.parse(b.timestamp ?? "");
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
    if (!Number.isFinite(right)) return -1;
    return controls.sort === "oldest" ? left - right : right - left;
  };
  const sorted = entries.sort((a, b) => {
    let order: number;
    switch (controls.sort) {
      case "newest": case "oldest": order = dateOrder(a.fields, b.fields); break;
      case "title-asc": order = byTitle(a.fields, b.fields); break;
      case "title-desc": order = byTitle(b.fields, a.fields); break;
      case "most-liked": order = (b.fields.likes ?? 0) - (a.fields.likes ?? 0); break;
      case "most-viewed": order = (b.fields.views ?? 0) - (a.fields.views ?? 0); break;
      default: order = (a.fields.sortOrder ?? 9999) - (b.fields.sortOrder ?? 9999) || (a.fields.title ?? "").localeCompare(b.fields.title ?? "");
    }
    return order || a.index - b.index;
  });
  return {
    sortedItems: sorted.map((entry) => entry.item),
    visibleItems: sorted.filter(({ fields: row }) => {
      const text = [row.title, row.description, ...(row.tags ?? []), row.imagePath].filter(Boolean).join(" ").toLocaleLowerCase();
      return terms.every((term) => text.includes(term)) &&
        (!controls.status || controls.status === "all" || row.status === controls.status) &&
        (!controls.favoritesOnly || row.favorite);
    }).map((entry) => entry.item),
  };
}
