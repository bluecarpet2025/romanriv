import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { changeMediaCounter, readVisitorLike, writeVisitorLike } from "@/lib/media-counters";

const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
});
afterEach(() => vi.unstubAllGlobals());

it.each(["photo", "anime"] as const)("sends one explicit %s view request and returns its count", async (kind) => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ views: 4 })); vi.stubGlobal("fetch", fetch);
  expect(await changeMediaCounter(kind, "view", "id")).toBe(4);
  expect(fetch).toHaveBeenCalledExactlyOnceWith(`/api/${kind === "photo" ? "photos" : "anime"}/view`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "id" }),
  });
});
it.each([1, -1] as const)("sends explicit like delta %s", async (delta) => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ likes: 0 })); vi.stubGlobal("fetch", fetch);
  expect(await changeMediaCounter("photo", "like", "id", delta)).toBe(0);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ id: "id", delta });
});
it.each([{}, { likes: -1 }, { likes: "1" }, { likes: 0.1 }])("rejects malformed counter response %j", async (body) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  await expect(changeMediaCounter("anime", "like", "id", 1)).rejects.toThrow("Invalid counter response");
});
it("rejects a failed response without retrying a mutation", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ error: "failure" }, { status: 500 })); vi.stubGlobal("fetch", fetch);
  await expect(changeMediaCounter("photo", "view", "id")).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("propagates network errors to the caller's rollback handler", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  await expect(changeMediaCounter("photo", "like", "id", 1)).rejects.toThrow("offline");
});
it("keeps the existing photo browser storage format and restores only the failed item", () => {
  storage.set("rr_liked_photos_v1", JSON.stringify(["existing"]));
  writeVisitorLike("photo", "a", true);
  writeVisitorLike("photo", "b", true);
  writeVisitorLike("photo", "a", false);
  expect(readVisitorLike("photo", "existing")).toBe(true);
  expect(readVisitorLike("photo", "a")).toBe(false);
  expect(readVisitorLike("photo", "b")).toBe(true);
});
it("keeps the anime per-ID key format", () => {
  writeVisitorLike("anime", "a", true);
  expect(storage.get("anime-liked-a")).toBe("1");
  expect(readVisitorLike("anime", "a")).toBe(true);
  writeVisitorLike("anime", "a", false);
  expect(storage.has("anime-liked-a")).toBe(false);
});
it("handles malformed or unavailable browser storage", () => {
  storage.set("rr_liked_photos_v1", "{");
  expect(readVisitorLike("photo", "a")).toBe(false);
  vi.stubGlobal("window", { localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } });
  expect(() => writeVisitorLike("photo", "a", true)).not.toThrow();
  expect(readVisitorLike("photo", "a")).toBe(false);
});
