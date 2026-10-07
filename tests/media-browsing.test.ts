import { describe, expect, it } from "vitest";
import { ANIME_SORT_OPTIONS, PHOTO_SORT_OPTIONS, browseMedia, type MediaFields, type MediaSort } from "@/lib/media-browsing";

const rows: (MediaFields & { id: string })[] = [
  { id: "a", title: "Zebra", description: "Grilled salmon", tags: ["Dinner"], imagePath: "food/weekend.jpg", timestamp: "2026-01-01", likes: 2, views: 30, sortOrder: 2, status: "watched", favorite: true },
  { id: "b", title: "alpha", description: "Track day", tags: ["Coupe"], imagePath: "cars/track.jpg", timestamp: "2026-03-01", likes: 8, views: 10, sortOrder: 1, status: "watching", favorite: false },
  { id: "c", title: "Beta", description: null, tags: null, timestamp: null, likes: null, views: null, sortOrder: 3, status: "planned", favorite: true },
];
const run = (search = "", sort: MediaSort = "newest", status = "all", favoritesOnly = false) => browseMedia(rows, { search, sort, status, favoritesOnly }, (row) => row);
const ids = (items: typeof rows) => items.map((row) => row.id);

describe("shared media browsing", () => {
  it.each([
    ["ZEBRA", ["a"]], ["salmon", ["a"]], ["dinner", ["a"]], ["weekend.jpg", ["a"]],
    ["  grilled   DINNER ", ["a"]], ["coupe track", ["b"]], ["[.*]", []], ["", ["b", "a", "c"]],
  ])("searches title, description, tags, and optional image path: %s", (search, expected) => {
    expect(ids(run(search).visibleItems)).toEqual(expected);
  });
  it.each<[MediaSort, string[]]>([
    ["newest", ["b", "a", "c"]], ["oldest", ["a", "b", "c"]],
    ["title-asc", ["b", "c", "a"]], ["title-desc", ["a", "c", "b"]],
    ["most-liked", ["b", "a", "c"]], ["most-viewed", ["a", "b", "c"]], ["sort-order", ["b", "a", "c"]],
  ])("sorts %s without mutating loaded rows", (sort, expected) => {
    const before = structuredClone(rows);
    expect(ids(run("", sort).visibleItems)).toEqual(expected);
    expect(rows).toEqual(before);
  });
  it("combines search, status and favorites", () => {
    expect(ids(run("zebra", "sort-order", "watched", true).visibleItems)).toEqual(["a"]);
    expect(run("alpha", "sort-order", "watching", true).visibleItems).toEqual([]);
    expect(ids(run("", "sort-order", "all", true).visibleItems)).toEqual(["a", "c"]);
  });
  it("keeps full ordering available while cards are hidden", () => {
    const result = run("coupe", "title-asc");
    expect(ids(result.sortedItems)).toEqual(["b", "c", "a"]);
    expect(ids(result.visibleItems)).toEqual(["b"]);
    expect(result.visibleItems[0]).toBe(rows[1]);
  });
  it.each(["newest", "oldest"] as MediaSort[])("puts invalid/missing dates last for %s", (sort) => {
    const items = [{ title: null, timestamp: "invalid" }, { title: "valid", timestamp: "2026-01-01" }, { title: "missing" }];
    expect(browseMedia(items, { search: "", sort }, (row) => row).visibleItems).toEqual([items[1], items[0], items[2]]);
  });
  it("keeps tied counters in their loaded order", () => {
    const items = [{ title: "Z", likes: 1 }, { title: "A", likes: 1 }];
    expect(browseMedia(items, { search: "", sort: "most-liked" }, (row) => row).visibleItems).toEqual(items);
  });
  it("uses title as the database sort-order tie breaker", () => {
    const items = [{ title: "Z", sortOrder: 1 }, { title: "A", sortOrder: 1 }];
    expect(browseMedia(items, { search: "", sort: "sort-order" }, (row) => row).visibleItems).toEqual([items[1], items[0]]);
  });
  it("handles empty loaded arrays", () => expect(browseMedia([], { search: "x", sort: "newest" }, () => ({ title: "" }))).toEqual({ sortedItems: [], visibleItems: [] }));
  it("offers exactly the required public photo and anime sorts", () => {
    expect(PHOTO_SORT_OPTIONS.map((option) => option.value)).toEqual(["newest", "oldest", "title-asc", "title-desc", "most-liked", "most-viewed"]);
    expect(ANIME_SORT_OPTIONS.map((option) => option.value)).toEqual(["sort-order", "title-asc", "title-desc", "most-liked", "most-viewed"]);
  });
});
