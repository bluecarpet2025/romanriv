import { afterEach, describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAuth", () => ({ createSupabaseServer: vi.fn() }));

import { createSupabaseServer } from "@/lib/supabaseAuth";
import { DELETE } from "@/app/api/anime/[id]/route";

type Result = { data: unknown; error: unknown };
const ok = (data: unknown): Result => ({ data, error: null });
const admin = () => ok({ user_id: "admin-1" });
const ID = "00000000-0000-4000-8000-000000000001";

function database(results: Result[], user: { id: string } | null = { id: "admin-1" }) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const db = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn((table: string) => {
      const chain = {
        select: vi.fn((...args: unknown[]) => { calls.push({ table, method: "select", args }); return chain; }),
        eq: vi.fn((...args: unknown[]) => { calls.push({ table, method: "eq", args }); return chain; }),
        delete: vi.fn(() => { calls.push({ table, method: "delete", args: [] }); return chain; }),
        maybeSingle: vi.fn(async () => {
          if (!results.length) throw new Error("Unexpected DB call");
          return results.shift()!;
        }),
      };
      return chain;
    }),
  };
  vi.mocked(createSupabaseServer).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);
  return { db, calls };
}
function run(id = ID, origin = "https://romanriv.com", contentType: string | null = "application/json") {
  return DELETE(new Request("https://romanriv.com/api/anime/" + encodeURIComponent(id), {
    method: "DELETE", headers: { Origin: origin, ...(contentType ? { "Content-Type": contentType } : {}) },
  }), { params: Promise.resolve({ id }) });
}
afterEach(() => vi.restoreAllMocks());

describe("admin anime deletion", () => {
  it("rejects signed-out callers before accessing tables", async () => {
    const { db } = database([], null);
    expect((await run()).status).toBe(401);
    expect(db.from).not.toHaveBeenCalled();
  });
  it("rejects failed auth verification even with a returned user", async () => {
    const { db } = database([]);
    db.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-1" } }, error: new Error("Expired") });
    expect((await run()).status).toBe(401);
    expect(db.from).not.toHaveBeenCalled();
  });
  it.each([ok(null), { data: null, error: { message: "DB unavailable" } }])("fails closed on admin lookup: %j", async (result) => {
    const { db } = database([result]);
    expect((await run()).status).toBe(403);
    expect(db.from).toHaveBeenCalledExactlyOnceWith("admins");
  });
  it("rejects cross-origin requests before auth", async () => {
    const { db } = database([]);
    expect((await run(ID, "https://other.example")).status).toBe(403);
    expect(db.auth.getUser).not.toHaveBeenCalled();
  });
  it("requires the same JSON guard as photo deletion", async () => {
    const { db } = database([]);
    expect((await run(ID, undefined, null)).status).toBe(415);
    expect(db.auth.getUser).not.toHaveBeenCalled();
  });
  it.each(["", "../other", "id with spaces", "x".repeat(65)])("rejects invalid ID %s", async (id) => {
    const { calls } = database([admin()]);
    expect((await run(id)).status).toBe(400);
    expect(calls.every((call) => call.table === "admins")).toBe(true);
  });
  it.each([
    { result: ok(null), status: 404 },
    { result: { data: null, error: { message: "Lookup failed" } }, status: 500 },
  ])("does not delete if row lookup fails: $status", async ({ result, status }) => {
    const { calls } = database([admin(), result]);
    expect((await run()).status).toBe(status);
    expect(calls.some((call) => call.method === "delete")).toBe(false);
  });
  it("deletes only the selected anime row and never touches cover storage", async () => {
    const storage = vi.spyOn(S3Client.prototype, "send").mockRejectedValue(new Error("Storage must not be called"));
    const { calls } = database([admin(), ok({ id: ID }), ok({ id: ID })]);
    const response = await run();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ id: ID });
    expect(calls.filter((call) => call.table === "anime")).toEqual([
      { table: "anime", method: "select", args: ["id"] },
      { table: "anime", method: "eq", args: ["id", ID] },
      { table: "anime", method: "delete", args: [] },
      { table: "anime", method: "eq", args: ["id", ID] },
      { table: "anime", method: "select", args: ["id"] },
    ]);
    expect(storage).not.toHaveBeenCalled();
  });
  it("reports a DB error without leaking its details", async () => {
    database([admin(), ok({ id: ID }), { data: null, error: { message: "private DB error" } }]);
    const response = await run();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private DB error");
  });
  it("does not claim success when deletion returns no rows", async () => {
    database([admin(), ok({ id: ID }), ok(null)]);
    expect((await run()).status).toBe(409);
  });
});
