import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

import { supabase } from "@/lib/supabase";
import { POST as view } from "@/app/api/anime/view/route";
import { POST as like } from "@/app/api/anime/like/route";

const ID = "00000000-0000-4000-8000-000000000001";
const endpoints = [
  { name: "view", handler: view, rpc: "increment_anime_views", field: "views", payload: { id: ID }, args: { anime_id: ID } },
  { name: "like", handler: like, rpc: "increment_anime_likes", field: "likes", payload: { id: ID, delta: 1 }, args: { anime_id: ID, delta: 1 } },
];
function request(payload: unknown, raw = false) {
  return new Request("https://romanriv.com/api/anime/counter", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: raw ? String(payload) : JSON.stringify(payload),
  });
}
function result(data: unknown, error: unknown = null) {
  vi.mocked(supabase.rpc).mockResolvedValue({ data, error } as Awaited<ReturnType<typeof supabase.rpc>>);
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe.each(endpoints)("public anime $name endpoint", ({ handler, rpc, field, payload, args }) => {
  it.each([0, 12])("returns the RPC count %s without direct table access", async (count) => {
    result(count);
    const response = await handler(request(payload));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ [field]: count });
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(rpc, args);
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it.each([null, [], {}, { id: 1 }, { id: "not-a-uuid" }, { id: "" }])("rejects invalid payload %j before the RPC", async (body) => {
    expect((await handler(request(body))).status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    expect((await handler(request("{", true))).status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it("returns 404 for a missing anime row", async () => {
    result(null);
    const response = await handler(request(payload));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Anime not found" });
  });
  it("returns a safe 500 for an RPC error", async () => {
    result(null, { message: "private database details" });
    const response = await handler(request(payload));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private database details");
  });
  it("handles rejected RPC calls", async () => {
    vi.mocked(supabase.rpc).mockRejectedValue(new Error("private connection details"));
    const response = await handler(request(payload));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private connection details");
  });
  it.each([-1, 1.5, "1", {}, undefined])("rejects invalid RPC result %j", async (count) => {
    result(count);
    expect((await handler(request(payload))).status).toBe(500);
  });
});

describe("anime like delta validation", () => {
  it.each([0, 2, -2, 1.5, "1", null, undefined])("rejects delta %j", async (delta) => {
    expect((await like(request({ id: ID, delta }))).status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it("passes unlike to the RPC and accepts its zero floor", async () => {
    result(0);
    const response = await like(request({ id: ID, delta: -1 }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ likes: 0 });
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith("increment_anime_likes", { anime_id: ID, delta: -1 });
  });
});
