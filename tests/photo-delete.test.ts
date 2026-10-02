import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAuth", () => ({ createSupabaseServer: vi.fn() }));
import { createSupabaseServer } from "@/lib/supabaseAuth";
import { DELETE } from "@/app/api/photos/[id]/route";

type Result = { data: unknown; error: unknown };
const ok = (data: unknown): Result => ({ data, error: null });
const admin = () => ok({ user_id: "admin-1" });
const PHOTO_ID = "00000000-0000-4000-8000-000000000001";
const row = (image_path = "food/example.jpg") => ok({ id: PHOTO_ID, image_path });
const events: string[] = [];
const send = vi.fn<(command: unknown) => Promise<Record<string, unknown>>>();
function database(results: Result[], user: { id: string } | null = { id: "admin-1" }) {
  const filters: unknown[][] = [];
  const db = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn((table: string) => {
      let deleting = false;
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn((...args: unknown[]) => { filters.push(args); return chain; }),
        delete: vi.fn(() => { deleting = true; events.push("db-delete-start"); return chain; }),
        maybeSingle: vi.fn(async () => {
          events.push(table === "admins" ? "admin-check" : deleting ? "db-delete-end" : "load-photo");
          if (!results.length) throw new Error("Unexpected DB call");
          return results.shift()!;
        }),
      };
      return chain;
    }),
  };
  vi.mocked(createSupabaseServer).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);
  return { db, filters };
}
function run(id = PHOTO_ID, origin = "https://romanriv.com", body?: unknown) {
  return DELETE(new Request("https://romanriv.com/api/photos/" + id, {
    method: "DELETE", headers: { "Content-Type": "application/json", Origin: origin },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), { params: Promise.resolve({ id }) });
}
beforeEach(() => {
  events.length = 0;
  vi.stubEnv("R2_ACCOUNT_ID", "test-account");
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("R2_BUCKET_NAME", "romanriv-media");
  send.mockReset().mockImplementation(async () => { events.push("r2-delete"); return {}; });
  vi.spyOn(S3Client.prototype, "send").mockImplementation(send);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("admin photo deletion", () => {
  it("rejects signed-out requests without reading photos or deleting objects", async () => {
    const { db } = database([], null);
    expect((await run()).status).toBe(401);
    expect(db.from).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it.each([ok(null), { data: null, error: { message: "DB unavailable" } }])("fails closed for missing admin access: %j", async (result) => {
    database([result]);
    expect((await run()).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects cross-origin deletion", async () => {
    const { db } = database([]);
    expect((await run(PHOTO_ID, "https://other.example")).status).toBe(403);
    expect(db.auth.getUser).not.toHaveBeenCalled();
  });
  it.each(["0", "-1", "abc", "1.5", "123 OR true", "1".repeat(20)])("rejects invalid ID %s", async (id) => {
    database([admin()]);
    expect((await run(id)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("does nothing when the row does not exist", async () => {
    database([admin(), ok(null)]);
    expect((await run()).status).toBe(404);
    expect(send).not.toHaveBeenCalled();
  });
  it("does nothing when loading the row fails", async () => {
    database([admin(), { data: null, error: { message: "error" } }]);
    expect((await run()).status).toBe(500);
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["food/example.jpg", "car/new-photo.jpg"])("deletes the stored %s object before its row", async (key) => {
    const { filters } = database([admin(), row(key), ok({ id: PHOTO_ID })]);
    expect((await run(PHOTO_ID, undefined, { image_path: "anime-covers/do-not-delete.jpg" })).status).toBe(200);
    expect(events).toEqual(["admin-check", "load-photo", "r2-delete", "db-delete-start", "db-delete-end"]);
    const command = send.mock.calls[0][0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({ Bucket: "romanriv-media", Key: key });
    expect(filters).toContainEqual(["image_path", key]);
  });
  it("supports existing numeric photo IDs", async () => {
    const { filters } = database([admin(), ok({ id: 123, image_path: "food/example.jpg" }), ok({ id: 123 })]);
    const response = await run("123");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 123 });
    expect(filters).toContainEqual(["id", "123"]);
  });
  it("rejects an auth verification error even when a user is returned", async () => {
    const { db } = database([]);
    db.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-1" } }, error: new Error("Expired token") } as never);
    expect((await run()).status).toBe(401);
    expect(db.from).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("requires the same JSON request guard as uploads", async () => {
    const { db } = database([]);
    const response = await DELETE(new Request("https://romanriv.com/api/photos/" + PHOTO_ID, { method: "DELETE" }), {
      params: Promise.resolve({ id: PHOTO_ID }),
    });
    expect(response.status).toBe(415);
    expect(db.auth.getUser).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("allows missing-object cleanup", async () => {
    database([admin(), row(), ok({ id: PHOTO_ID })]);
    send.mockRejectedValueOnce(Object.assign(new Error("missing"), { name: "NoSuchKey" }));
    expect((await run()).status).toBe(200);
    expect(events).toContain("db-delete-end");
  });
  it.each(["AccessDenied", "NoSuchBucket", "TimeoutError"])("retains DB row on R2 %s", async (name) => {
    database([admin(), row()]);
    send.mockRejectedValueOnce(Object.assign(new Error("failure"), { name }));
    expect((await run()).status).toBe(502);
    expect(events).not.toContain("db-delete-start");
  });
  it.each([
    "anime-covers/cover.jpg", "business/test.jpg", "anime/test.jpg", "https://example.com/food/test.jpg",
    "/food/test.jpg", "food/../anime-covers/test.jpg", "food/%2e%2e/test.jpg", "food/a\\b.jpg",
    "food//test.jpg", "food/", "food/test.jpg?key=other", "food/test.jpg#fragment", "food/./test.jpg", "", null,
    "food/test\n.jpg", "food/test\u0000.jpg", "food/" + "a".repeat(1020), "food/" + "é".repeat(510),
  ])("rejects unsafe or unsupported DB key %s before R2 or DB deletion", async (key) => {
    database([admin(), ok({ id: PHOTO_ID, image_path: key })]);
    expect((await run()).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(events).not.toContain("db-delete-start");
  });
  it("retains the row when R2 is not configured and returns no SDK secrets", async () => {
    vi.stubEnv("R2_BUCKET_NAME", "");
    database([admin(), row()]);
    const response = await run();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("test-secret");
    expect(send).not.toHaveBeenCalled();
    expect(events).not.toContain("db-delete-start");
  });
  it("reports partial failure and permits a retry after the image is gone", async () => {
    database([admin(), row(), { data: null, error: { message: "RLS denied" } }]);
    const failed = await run();
    expect(failed.status).toBe(500);
    expect(await failed.text()).toContain("Retry Delete");
    database([admin(), row(), ok({ id: PHOTO_ID })]);
    expect((await run()).status).toBe(200);
  });
  it("does not claim success when RLS or a changed path prevents deleting the row", async () => {
    database([admin(), row(), ok(null)]);
    expect((await run()).status).toBe(409);
  });
});
