import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));
import { supabase } from "@/lib/supabase";
import { POST as view } from "@/app/api/photos/view/route";
import { POST as like } from "@/app/api/photos/like/route";

const ID = "00000000-0000-4000-8000-000000000001";
const endpoints = [
  { handler: view, rpc: "increment_photo_view", body: { id: ID }, args: { photo_id: ID }, count: { ok: true, views: 3 } },
  { handler: like, rpc: "increment_photo_likes", body: { id: ID, delta: 1 }, args: { photo_id: ID, delta: 1 }, count: { likes: 3 } },
];
const request = (body: unknown) => new Request("https://romanriv.com/api/photos/counter", { method: "POST", body: JSON.stringify(body) });
function result(data: unknown, error: unknown = null) { vi.mocked(supabase.rpc).mockResolvedValue({ data, error } as Awaited<ReturnType<typeof supabase.rpc>>); }
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

describe.each(endpoints)("public photo RPC $rpc", ({ handler, rpc, body, args, count }) => {
  it("updates only the requested UUID via RPC", async () => {
    result(3);
    const response = await handler(request(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(count);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(rpc, args);
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it.each([null, [], {}, { id: 1 }, { id: "not-a-uuid" }])("rejects invalid payload %j", async (payload) => {
    expect((await handler(request(payload))).status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    expect((await handler(new Request("https://romanriv.com", { method: "POST", body: "{" }))).status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it("reports a missing row rather than claiming success", async () => {
    result(null);
    const response = await handler(request(body));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Photo not found" });
  });
  it("does not leak RPC errors", async () => {
    result(null, { message: "private details" });
    const response = await handler(request(body));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private details");
  });
  it("handles network rejection", async () => {
    vi.mocked(supabase.rpc).mockRejectedValue(new Error("connection"));
    expect((await handler(request(body))).status).toBe(500);
  });
  it.each([-1, 0.5, "3", undefined])("rejects invalid results %j", async (value) => {
    result(value);
    expect((await handler(request(body))).status).toBe(500);
  });
});
it.each([null, undefined, 0, 2, -2, "1", 0.5])("rejects photo like delta %j", async (delta) => {
  expect((await like(request({ id: ID, delta }))).status).toBe(400);
  expect(supabase.rpc).not.toHaveBeenCalled();
});
it("accepts unlike at zero", async () => {
  result(0);
  const response = await like(request({ id: ID, delta: -1 }));
  expect(await response.json()).toEqual({ likes: 0 });
  expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith("increment_photo_likes", { photo_id: ID, delta: -1 });
});
