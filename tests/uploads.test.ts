import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAuth", () => ({ createSupabaseServer: vi.fn() }));

import { createSupabaseServer } from "@/lib/supabaseAuth";
import { POST as presign } from "@/app/api/uploads/presign/route";
import { POST as complete } from "@/app/api/uploads/complete/route";
import { presignImageUpload, readUploadTicket, verifyUploadedImage } from "@/lib/r2";
import { uploadAdminImage } from "@/lib/upload-client";
import { MAX_IMAGE_BYTES, validateUploadInput, type UploadInput } from "@/lib/uploads";

const photo: UploadInput = { folder: "food", fileName: "My Dinner.jpg", contentType: "image/jpeg", size: 100 };
const cover: UploadInput = { ...photo, folder: "anime-covers", animeId: "anime-1" };
const oldCover = "https://old.example/cover.jpg";
const sendMock = vi.fn<(command: unknown) => Promise<Record<string, unknown>>>();

type DbResult = { data: unknown; error: null | { message: string } };
function database(results: DbResult[] = [], user: { id: string } | null = { id: "admin-1" }) {
  const queries: { table: string; calls: { method: string; args: unknown[] }[] }[] = [];
  const db = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn((table: string) => {
      const calls: { method: string; args: unknown[] }[] = [];
      queries.push({ table, calls });
      const chain: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const method of ["select", "eq", "is", "update", "insert"]) {
        chain[method] = vi.fn((...args: unknown[]) => { calls.push({ method, args }); return chain; });
      }
      for (const method of ["single", "maybeSingle"]) {
        chain[method] = vi.fn(async () => {
          const result = results.shift();
          if (!result) throw new Error("Unexpected database call");
          return result;
        });
      }
      return chain;
    }),
  };
  vi.mocked(createSupabaseServer).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);
  return { db, queries };
}
const ok = (data: unknown): DbResult => ({ data, error: null });
const admin = () => ok({ user_id: "admin-1" });
function request(body: unknown, origin = "https://romanriv.com") {
  return new Request("https://romanriv.com/api/uploads", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body),
  });
}
const writes = (queries: ReturnType<typeof database>["queries"]) => queries.flatMap(q => q.calls).filter(c => ["insert", "update"].includes(c.method));

beforeEach(() => {
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32));
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
  vi.stubEnv("R2_BUCKET_NAME", "romanriv-media");
  vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_BASE_URL", "https://media.example");
  sendMock.mockReset();
  sendMock.mockImplementation(async (command) => {
    if (command instanceof HeadObjectCommand) return { ContentLength: 100, ContentType: "image/jpeg" };
    if (command instanceof GetObjectCommand) return { Body: { transformToByteArray: async () => Uint8Array.from([255, 216, 255, 224]) } };
    throw new Error("Unexpected R2 command");
  });
  vi.spyOn(S3Client.prototype, "send").mockImplementation(sendMock);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("authorization on both endpoints", () => {
  for (const handler of [presign, complete]) {
    it(`${handler === presign ? "presign" : "complete"}: rejects an unauthenticated caller before touching storage`, async () => {
      const { db } = database([], null);
      expect((await handler(request(photo))).status).toBe(401);
      expect(db.from).not.toHaveBeenCalled();
      expect(S3Client.prototype.send).not.toHaveBeenCalled();
    });
    it(`${handler === presign ? "presign" : "complete"}: rejects a non-admin`, async () => {
      database([ok(null)]);
      expect((await handler(request(photo))).status).toBe(403);
      expect(S3Client.prototype.send).not.toHaveBeenCalled();
    });
    it(`${handler === presign ? "presign" : "complete"}: rejects cross-origin requests`, async () => {
      const { db } = database();
      expect((await handler(request(photo, "https://other.example"))).status).toBe(403);
      expect(db.auth.getUser).not.toHaveBeenCalled();
    });
  }
  it("fails closed when the admin query fails", async () => {
    database([{ data: null, error: { message: "connection failed" } }]);
    expect((await presign(request(photo))).status).toBe(403);
  });
});

describe("upload policy and signing", () => {
  it.each([
    { folder: "business" }, { folder: "anime" }, { folder: "../food" },
    { contentType: "text/html" }, { contentType: "image/svg+xml" },
    { size: 0 }, { size: MAX_IMAGE_BYTES + 1 }, { size: 1.5 },
    { folder: "anime-covers", animeId: "../other" },
  ])("rejects invalid metadata: %j", async (change) => {
    database([admin()]);
    expect((await presign(request({ ...photo, ...change }))).status).toBe(400);
    expect(S3Client.prototype.send).not.toHaveBeenCalled();
  });
  it("accepts the maximum image size", () => {
    expect(validateUploadInput({ ...photo, size: MAX_IMAGE_BYTES }).size).toBe(MAX_IMAGE_BYTES);
  });
  it("signs a short-lived PUT bound to content type, length, and create-only semantics", async () => {
    database([admin()]);
    const response = await presign(request(photo));
    expect(response.status).toBe(200);
    const result = await response.json();
    const url = new URL(result.uploadUrl);
    expect(url.hostname).toBe(`romanriv-media.${"a".repeat(32)}.r2.cloudflarestorage.com`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("120");
    for (const header of ["content-type", "content-length", "if-none-match"]) {
      expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(header);
    }
    expect(result.key).toMatch(/^food\/\d+-my-dinner-[a-f0-9-]+\.jpg$/);
    expect(JSON.stringify(result)).not.toContain("test-secret-key");
    const ticket = readUploadTicket(result.token, "admin-1");
    expect(ticket.input.folder).toBe("food");
    expect(() => readUploadTicket(result.token, "other-admin")).toThrow();
    expect(() => readUploadTicket(result.token + "x", "admin-1")).toThrow();
    vi.spyOn(Date, "now").mockReturnValue(ticket.expiresAt + 1);
    expect(() => readUploadTicket(result.token, "admin-1")).toThrow(/expired/);
  });
  it("requires a real anime record before signing a cover", async () => {
    database([admin(), ok(null)]);
    expect((await presign(request(cover))).status).toBe(404);
  });
  it("generates a new cover key each time", async () => {
    const a = await presignImageUpload(cover, "admin-1", oldCover);
    const b = await presignImageUpload(cover, "admin-1", oldCover);
    expect(a.key).toMatch(/^anime-covers\/anime-1\/[a-f0-9-]+\.jpg$/);
    expect(a.key).not.toBe(b.key);
  });
  it("reports missing configuration without returning secrets", async () => {
    vi.stubEnv("R2_BUCKET_NAME", "");
    database([admin()]);
    const response = await presign(request(photo));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("test-secret-key");
  });
});

describe("verified completion", () => {
  it("saves the relative photo key and derives category from the authorized folder", async () => {
    const upload = await presignImageUpload({ ...photo, folder: "car" }, "admin-1", null);
    const { queries } = database([admin(), ok(null), ok({ id: 1 })]);
    expect((await complete(request({ token: upload.token, category: "business" }))).status).toBe(200);
    expect(writes(queries)).toEqual([{ method: "insert", args: [{
      category: "car", title: "My Dinner", description: "", image_path: upload.key, tags: [],
    }] }]);
  });
  it("does not repeat a completed photo insert on a sequential retry", async () => {
    const upload = await presignImageUpload(photo, "admin-1", null);
    const { queries } = database([admin(), ok({ id: 1 })]);
    const response = await complete(request({ token: upload.token }));
    expect(response.status).toBe(200);
    expect((await response.json()).photoId).toBe(1);
    expect(writes(queries)).toEqual([]);
  });
  it.each(["missing", "size", "type", "bytes", "public"])("does not write DB when R2 verification fails: %s", async (failure) => {
    const upload = await presignImageUpload(cover, "admin-1", oldCover);
    const { queries } = database([admin()]);
    if (failure === "missing") sendMock.mockRejectedValueOnce(new Error("Not found"));
    if (failure === "size") sendMock.mockResolvedValueOnce({ ContentLength: 101, ContentType: "image/jpeg" });
    if (failure === "type") sendMock.mockResolvedValueOnce({ ContentLength: 100, ContentType: "text/html" });
    if (failure === "bytes") {
      sendMock.mockResolvedValueOnce({ ContentLength: 100, ContentType: "image/jpeg" });
      sendMock.mockResolvedValueOnce({ Body: { transformToByteArray: async () => new TextEncoder().encode("<html>") } });
    }
    if (failure === "public") vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await complete(request({ token: upload.token }))).status).toBeGreaterThanOrEqual(400);
    expect(writes(queries)).toEqual([]);
  });
  it("rejects a tampered receipt before looking up an object", async () => {
    database([admin()]);
    expect((await complete(request({ token: "tampered.receipt" }))).status).toBe(400);
    expect(S3Client.prototype.send).not.toHaveBeenCalled();
  });
  it.each([oldCover, null])("replaces a cover conditionally from %s", async (previous) => {
    const upload = await presignImageUpload(cover, "admin-1", previous);
    const { queries } = database([admin(), ok({ id: "anime-1", cover_url: previous }), ok({ id: "anime-1" })]);
    const response = await complete(request({ token: upload.token }));
    expect(response.status).toBe(200);
    const { publicUrl } = await response.json();
    expect(publicUrl).toBe(`https://media.example/${upload.key}`);
    expect(writes(queries)).toEqual([{ method: "update", args: [{ cover_url: publicUrl }] }]);
    expect(queries[2].calls).toContainEqual({ method: previous === null ? "is" : "eq", args: ["cover_url", previous] });
  });
  it("reports an anime DB save failure and never deletes the old cover", async () => {
    const upload = await presignImageUpload(cover, "admin-1", oldCover);
    database([admin(), ok({ id: "anime-1", cover_url: oldCover }), { data: null, error: { message: "RLS failure" } }]);
    const response = await complete(request({ token: upload.token }));
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("previous cover was retained");
    expect(vi.mocked(S3Client.prototype.send).mock.calls.every(([command]) => command instanceof HeadObjectCommand || command instanceof GetObjectCommand)).toBe(true);
  });
  it("reports a cover conflict instead of claiming a zero-row update succeeded", async () => {
    const upload = await presignImageUpload(cover, "admin-1", oldCover);
    database([admin(), ok({ id: "anime-1", cover_url: "newer-cover" }), ok(null)]);
    expect((await complete(request({ token: upload.token }))).status).toBe(409);
  });
  it("accepts a retry when the same cover URL was already saved", async () => {
    const upload = await presignImageUpload(cover, "admin-1", oldCover);
    const { queries } = database([admin(), ok({ id: "anime-1", cover_url: `https://media.example/${upload.key}` })]);
    expect((await complete(request({ token: upload.token }))).status).toBe(200);
    expect(writes(queries)).toEqual([]);
  });
  it("verifies an image without uploading bytes through the server", async () => {
    const upload = await presignImageUpload(photo, "admin-1", null);
    await verifyUploadedImage(readUploadTicket(upload.token, "admin-1"));
    const commands = vi.mocked(S3Client.prototype.send).mock.calls.map(([command]) => command);
    expect(commands[0]).toBeInstanceOf(HeadObjectCommand);
    expect(commands[1]).toBeInstanceOf(GetObjectCommand);
    expect((commands[1] as GetObjectCommand).input.Range).toBe("bytes=0-63");
  });
});

describe("browser upload flow", () => {
  it.each([false, true])("requests food tags after successful completion; tagging failure=%s never undoes upload", async (failure) => {
    const id = "00000000-0000-4000-8000-000000000001";
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ uploadUrl: "https://r2.example/signed", headers: {}, token: "receipt" }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ key: "food/new.jpg", publicUrl: "https://media.example/food/new.jpg", photoId: id }))
      .mockResolvedValueOnce(failure ? Response.json({ error: "Tagging unavailable" }, { status: 503 }) : Response.json({ tags: ["eggs"], skipped: false }));
    const result = await uploadAdminImage(new File(["image"], "photo.jpg", { type: "image/jpeg" }), "food");
    expect(result.key).toBe("food/new.jpg"); expect(result.photoId).toBe(id);
    expect(result.tagging).toEqual(failure ? { error: "Tagging unavailable" } : { tags: ["eggs"] });
    expect(fetch).toHaveBeenCalledTimes(4); expect(vi.mocked(fetch).mock.calls[3][0]).toBe(`/api/photos/${id}/auto-tag`);
  });
  it("never tags a car upload", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ uploadUrl: "https://r2.example/signed", headers: {}, token: "receipt" }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ key: "car/new.jpg", publicUrl: "https://media.example/car/new.jpg", photoId: "id" }));
    const result = await uploadAdminImage(new File(["image"], "car.jpg", { type: "image/jpeg" }), "car");
    expect(result.tagging).toBeUndefined(); expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("sends bytes only to the signed R2 URL, then sends only the receipt to completion", async () => {
    const file = new File(["image"], "cover.jpg", { type: "image/jpeg" });
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ uploadUrl: "https://r2.example/signed", headers: { "Content-Type": "image/jpeg", "If-None-Match": "*" }, token: "receipt" }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ key: "anime-covers/new.jpg", publicUrl: "https://media.example/anime-covers/new.jpg" }));
    await uploadAdminImage(file, "anime-covers", "anime-1");
    expect(vi.mocked(fetch).mock.calls[1]).toEqual(["https://r2.example/signed", {
      method: "PUT", body: file, headers: { "Content-Type": "image/jpeg", "If-None-Match": "*" }, credentials: "omit",
    }]);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as string)).toEqual({ token: "receipt" });
  });
  it("does not finalize a failed PUT", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ uploadUrl: "https://r2.example/signed", headers: {}, token: "receipt" }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(uploadAdminImage(new File(["image"], "photo.jpg", { type: "image/jpeg" }), "food")).rejects.toThrow(/403/);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
