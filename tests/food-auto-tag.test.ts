import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAuth", () => ({ createSupabaseServer: vi.fn() }));
vi.mock("@/lib/food-tagging", async (original) => ({ ...await original<typeof import("@/lib/food-tagging")>(), analyzeFoodImage: vi.fn(), foodImageUrl: vi.fn(() => "https://media.example/food/a.jpg") }));
import { createSupabaseServer } from "@/lib/supabaseAuth";
import { analyzeFoodImage, FoodTaggingError } from "@/lib/food-tagging";
import { POST } from "@/app/api/photos/[id]/auto-tag/route";

const ID = "00000000-0000-4000-8000-000000000001";
const ok = (data: unknown) => ({ data, error: null });
const admin = () => ok({ user_id: "admin" });
const photo = (tags: string[] | null = [], category = "food") => ok({ id: ID, category, tags, image_path: "food/a.jpg" });
type Result = { data: unknown; error: unknown };
function database(results: Result[], user: { id: string } | null = { id: "admin" }) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const db = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: vi.fn((table: string) => {
    const chain = {
      select: vi.fn((...args: unknown[]) => { calls.push({ table, method: "select", args }); return chain; }),
      eq: vi.fn((...args: unknown[]) => { calls.push({ table, method: "eq", args }); return chain; }),
      is: vi.fn((...args: unknown[]) => { calls.push({ table, method: "is", args }); return chain; }),
      update: vi.fn((...args: unknown[]) => { calls.push({ table, method: "update", args }); return chain; }),
      maybeSingle: vi.fn(async () => { if (!results.length) throw new Error("Unexpected query"); return results.shift()!; }),
    }; return chain;
  }) };
  vi.mocked(createSupabaseServer).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);
  return { db, calls };
}
const run = (body: unknown = {}, id = ID, origin = "https://romanriv.com", contentType = "application/json") => POST(new Request(`https://romanriv.com/api/photos/${id}/auto-tag`, {
  method: "POST", headers: { Origin: origin, "Content-Type": contentType }, body: JSON.stringify(body),
}), { params: Promise.resolve({ id }) });
beforeEach(() => { vi.resetAllMocks(); vi.mocked(analyzeFoodImage).mockResolvedValue(["tomato", "Egg", "food"]); });
afterEach(() => vi.restoreAllMocks());

describe("admin ingredient tagging", () => {
  it("rejects anonymous visitors before touching rows or AI", async () => {
    const { db } = database([], null); expect((await run()).status).toBe(401); expect(db.from).not.toHaveBeenCalled(); expect(analyzeFoodImage).not.toHaveBeenCalled();
  });
  it("rejects a non-admin", async () => { database([ok(null)]); expect((await run()).status).toBe(403); expect(analyzeFoodImage).not.toHaveBeenCalled(); });
  it("rejects cross-origin and non-JSON requests", async () => {
    database([]); expect((await run({}, ID, "https://other.example")).status).toBe(403); expect((await run({}, ID, undefined, "text/plain")).status).toBe(415);
  });
  it.each([{ force: "true" }, null, []])("rejects malformed force/body %j", async (body) => { database([admin()]); expect((await run(body)).status).toBe(400); expect(analyzeFoodImage).not.toHaveBeenCalled(); });
  it("rejects an invalid ID", async () => { database([admin()]); expect((await run({}, "not-a-uuid")).status).toBe(400); });
  it("rejects a missing row", async () => { database([admin(), ok(null)]); expect((await run()).status).toBe(404); });
  it("rejects non-food rows without any AI call", async () => { database([admin(), photo([], "car")]); expect((await run()).status).toBe(422); expect(analyzeFoodImage).not.toHaveBeenCalled(); });
  it("returns existing manual tags unchanged without AI", async () => {
    const { calls } = database([admin(), photo(["My manual tag"])]); const response = await run();
    expect(await response.json()).toEqual({ id: ID, tags: ["My manual tag"], skipped: true }); expect(analyzeFoodImage).not.toHaveBeenCalled(); expect(calls.some(c => c.method === "update")).toBe(false);
  });
  it.each([[], null, [" "]])("normalizes before saving and protects the original tag value %j", async (tags) => {
    const { calls } = database([admin(), photo(tags), ok({ id: ID, tags: ["tomatoes", "eggs"] })]); const response = await run();
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ id: ID, tags: ["tomatoes", "eggs"], skipped: false });
    expect(calls).toContainEqual({ table: "photos", method: "update", args: [{ tags: ["tomatoes", "eggs"] }] });
    expect(calls).toContainEqual({ table: "photos", method: tags === null ? "is" : "eq", args: ["tags", tags === null ? null : tags.length ? '{" "}' : "{}"] });
    expect(calls).toContainEqual({ table: "photos", method: "eq", args: ["category", "food"] });
    expect(calls).toContainEqual({ table: "photos", method: "eq", args: ["image_path", "food/a.jpg"] });
  });
  it("allows explicit force but still compares original manual tags", async () => {
    const { calls } = database([admin(), photo(["manual"]), ok({ id: ID, tags: ["tomatoes", "eggs"] })]);
    expect((await run({ force: true })).status).toBe(200); expect(analyzeFoodImage).toHaveBeenCalledTimes(1);
    expect(calls).toContainEqual({ table: "photos", method: "eq", args: ["tags", '{"manual"}'] });
  });
  it("AI failure leaves existing tags unchanged even under force", async () => {
    const { calls } = database([admin(), photo(["manual"])]); vi.mocked(analyzeFoodImage).mockRejectedValueOnce(new Error("private provider details"));
    const response = await run({ force: true }); expect(response.status).toBe(500); expect(await response.text()).not.toContain("private provider details"); expect(calls.some(c => c.method === "update")).toBe(false);
  });
  it("rejects invalid AI output without a DB write", async () => {
    const { calls } = database([admin(), photo()]); vi.mocked(analyzeFoodImage).mockResolvedValueOnce(Array(11).fill("eggs"));
    expect((await run()).status).toBeGreaterThanOrEqual(400); expect(calls.some(c => c.method === "update")).toBe(false);
  });
  it("reports missing configuration without modifying tags", async () => {
    const { calls } = database([admin(), photo()]); vi.mocked(analyzeFoodImage).mockRejectedValueOnce(new FoodTaggingError("Add: OPENAI_API_KEY, FOOD_TAGGING_MODEL", 503, "tagging_not_configured"));
    expect((await run()).status).toBe(503); expect(calls.some(c => c.method === "update")).toBe(false);
  });
  it("does not overwrite a concurrent manual edit", async () => { database([admin(), photo(), ok(null)]); expect((await run()).status).toBe(409); });
  it("reports a DB save failure safely", async () => { database([admin(), photo(), { data: null, error: { message: "private DB details" } }]); const response = await run(); expect(response.status).toBe(500); expect(await response.text()).not.toContain("private DB details"); });
});
