import { afterEach, expect, it, vi } from "vitest";
import { FoodTagRequestError, requestFoodTags, runFoodTagBatch } from "@/lib/food-tagging-client";
afterEach(() => vi.unstubAllGlobals());
function options(controller = new AbortController()) {
  return { signal: controller.signal, shouldSkip: vi.fn(() => false), tag: vi.fn(async (id: string | number, signal: AbortSignal) => {
    expect(id).toBeDefined(); expect(signal).toBeInstanceOf(AbortSignal); return { tags: ["eggs"], skipped: false };
  }), onResult: vi.fn(), onError: vi.fn(), onProgress: vi.fn() };
}
it("processes sequentially with immediate per-photo results and progress", async () => {
  const opts = options(); let active = 0, peak = 0;
  opts.tag.mockImplementation(async () => { active++; peak = Math.max(peak, active); await Promise.resolve(); active--; return { tags: ["eggs"], skipped: false }; });
  expect(await runFoodTagBatch(["a", "b", "c"], opts)).toEqual({ processed: 3, remaining: 0, failed: 0, total: 3, reason: "Complete" });
  expect(peak).toBe(1); expect(opts.onResult).toHaveBeenCalledTimes(3);
});
it("skips manually tagged or busy rows before sending requests", async () => {
  const opts = options(); opts.shouldSkip.mockReturnValueOnce(true);
  await runFoodTagBatch(["a", "b"], opts); expect(opts.tag).toHaveBeenCalledTimes(1); expect(opts.tag.mock.calls[0][0]).toBe("b");
});
it("records a failure once and continues without retrying", async () => {
  const opts = options(); opts.tag.mockRejectedValueOnce(new Error("AI failed"));
  const result = await runFoodTagBatch(["a", "b"], opts); expect(result.failed).toBe(1); expect(opts.tag).toHaveBeenCalledTimes(2); expect(opts.onError).toHaveBeenCalledTimes(1);
});
it.each([401, 403, 429, 503])("pauses on status %s", async (status) => {
  const opts = options(); opts.tag.mockRejectedValueOnce(new FoodTagRequestError("Paused", status));
  const result = await runFoodTagBatch(["a", "b"], opts); expect(result).toMatchObject({ processed: 1, failed: 1, remaining: 1, reason: "Paused" }); expect(opts.tag).toHaveBeenCalledTimes(1);
});
it("stops dispatching after cancellation and leaves the aborted row resumable", async () => {
  const controller = new AbortController(); const opts = options(controller);
  opts.tag.mockImplementationOnce(async () => { controller.abort(); throw new Error("aborted"); });
  const result = await runFoodTagBatch(["a", "b"], opts); expect(result).toMatchObject({ processed: 0, failed: 0, remaining: 2, reason: "Stopped" }); expect(opts.tag).toHaveBeenCalledTimes(1);
});
it("sends default non-force authenticated requests", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ tags: ["eggs"], skipped: false })); vi.stubGlobal("fetch", fetch);
  expect(await requestFoodTags("a")).toEqual({ tags: ["eggs"], skipped: false });
  expect(fetch.mock.calls[0][0]).toBe("/api/photos/a/auto-tag"); expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: "same-origin", body: "{}" });
});
