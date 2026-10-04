import { describe, expect, it } from "vitest";
import { animeSavePayload, browseAnime, normaliseAnime, type AnimeDraft, type AnimeRow } from "@/lib/anime-management";

const row = (id: string, title: string, status = "planned", favorite = false, sortOrder = 0): AnimeRow => ({
  id, title, status, favorite, sortOrder, total_seasons: 1, seasons_watched: 0,
  tags: [], notes: "", likes: 3, views: 9, coverUrl: "https://media.example/cover.jpg",
});
const rows = [row("a", "Zebra", "watched", true, 2), row("b", "alpha", "watching", true, 1), row("c", "Beta", "planned", false, 3)];

describe("anime browsing", () => {
  it("combines case-insensitive title search, status, and favorites", () => {
    expect(browseAnime(rows, "  ALP  ", "watching", true, "title-asc").map((item) => item.id)).toEqual(["b"]);
    expect(browseAnime(rows, "Beta", "all", true, "title-asc")).toEqual([]);
  });
  it.each([
    ["title-asc", ["b", "c", "a"]], ["title-desc", ["a", "c", "b"]],
    ["sort-order", ["b", "a", "c"]], ["status", ["c", "a", "b"]],
  ] as const)("supports %s sorting without modifying loaded rows", (sort, expected) => {
    const before = [...rows];
    expect(browseAnime(rows, "", "all", false, sort).map((item) => item.id)).toEqual(expected);
    expect(rows).toEqual(before);
  });
  it.each(["watching", "watched", "planned", "on-hold", "dropped"])("filters status %s", (status) => {
    expect(browseAnime([row("match", "Anime", status), row("other", "Other", "unknown")], "", status, false, "status").map((item) => item.id)).toEqual(["match"]);
  });
  it("uses title as a stable tie-breaker for equal sort order", () => {
    expect(browseAnime([row("b", "Beta"), row("a", "Alpha")], "", "all", false, "sort-order").map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("anime metadata editing", () => {
  it("retains zero values and normalizes nullable DB fields", () => {
    expect(normaliseAnime({ id: "a", title: "Anime", status: null, total_seasons: 1, seasons_watched: 0,
      is_favorite: null, tags: [" drama ", ""], notes: null, likes: null, views: null, sort_order: 0, cover_url: null,
    })).toMatchObject({ status: "planned", seasons_watched: 0, sortOrder: 0, tags: ["drama"], coverUrl: "", likes: 0, views: 0 });
  });
  it("saves all metadata and manual cover URLs without writing likes or views", () => {
    const draft: AnimeDraft = { ...row("a", "Edited", "on-hold", true, 4), total_seasons: 3,
      seasons_watched: 2, tagsText: " action, drama, , ", notes: "Notes", coverUrl: " https://media.example/new.jpg ", dirty: true };
    expect(animeSavePayload(draft)).toEqual({ title: "Edited", status: "on-hold", total_seasons: 3,
      seasons_watched: 2, is_favorite: true, tags: ["action", "drama"], notes: "Notes", sort_order: 4,
      cover_url: "https://media.example/new.jpg" });
    expect(animeSavePayload({ ...draft, coverUrl: " " }).cover_url).toBeNull();
  });
});
