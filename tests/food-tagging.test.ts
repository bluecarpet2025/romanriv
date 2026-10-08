import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { analyzeFoodImage, foodImageUrl } from "@/lib/food-tagging";

const image = "https://media.example/food/photo.jpg";
const result = (content: unknown, finish_reason = "stop", refusal: unknown = null) => Response.json({ choices: [{ finish_reason, message: { content: typeof content === "string" ? content : JSON.stringify(content), refusal } }] });
beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "fake-key"); vi.stubEnv("FOOD_TAGGING_MODEL", "vision-model"); vi.stubEnv("FOOD_TAGGING_PROVIDER", "openai");
  vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_BASE_URL", "https://media.example"); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(result({ tags: ["Egg", "tomato"] })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("sends the R2 URL directly with strict structured output and a completion cap", async () => {
  expect(await analyzeFoodImage(image)).toEqual(["eggs", "tomatoes"]);
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/chat/completions");
  const body = JSON.parse(options!.body as string);
  expect(body.model).toBe("vision-model"); expect(body.max_completion_tokens).toBe(500);
  expect(body.messages[1].content[1].image_url.url).toBe(image);
  expect(body.response_format.json_schema.strict).toBe(true);
  expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
  expect(body.response_format.json_schema.schema.properties.tags.maxItems).toBe(10);
});
it.each(["OPENAI_API_KEY", "FOOD_TAGGING_MODEL"])("blocks missing %s before a network request", async (key) => {
  vi.stubEnv(key, "");
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 503, code: "tagging_not_configured" });
  expect(fetch).not.toHaveBeenCalled();
});
it("supports a configured compatible provider without sending the OpenAI credential", async () => {
  vi.stubEnv("FOOD_TAGGING_PROVIDER", "openai-compatible"); vi.stubEnv("FOOD_TAGGING_BASE_URL", "https://provider.example/v1"); vi.stubEnv("FOOD_TAGGING_API_KEY", "other-fake-key");
  await analyzeFoodImage(image);
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://provider.example/v1/chat/completions");
  expect(vi.mocked(fetch).mock.calls[0][1]!.headers).toMatchObject({ Authorization: "Bearer other-fake-key" });
});
it.each(["http://provider.example/v1", "invalid", "https://user:password@provider.example/v1"])("rejects unsafe provider URL %s", async (base) => {
  vi.stubEnv("FOOD_TAGGING_PROVIDER", "openai-compatible"); vi.stubEnv("FOOD_TAGGING_BASE_URL", base); vi.stubEnv("FOOD_TAGGING_API_KEY", "fake");
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 503 }); expect(fetch).not.toHaveBeenCalled();
});
it.each([{ tags: ["food"] }, { tags: ["eggs", 5] }, { tags: ["eggs"], description: "extra" }, ["eggs"], "not json"])("rejects malformed AI output %j", async (value) => {
  vi.mocked(fetch).mockResolvedValueOnce(result(value)); await expect(analyzeFoodImage(image)).rejects.toThrow();
});
it("rejects refusals and truncated output", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(result({ tags: ["eggs"] }, "length")); await expect(analyzeFoodImage(image)).rejects.toThrow();
  vi.mocked(fetch).mockResolvedValueOnce(result({ tags: ["eggs"] }, "stop", "refused")); await expect(analyzeFoodImage(image)).rejects.toThrow();
});
it("reports rate limits without retries", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 429 }));
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 429 }); expect(fetch).toHaveBeenCalledTimes(1);
});
it("supports cancellation without exposing transport details", async () => {
  const controller = new AbortController(); controller.abort(); vi.mocked(fetch).mockRejectedValueOnce(new Error("private network details"));
  await expect(analyzeFoodImage(image, controller.signal)).rejects.toMatchObject({ status: 499 });
});
it("resolves only safe food R2 paths", () => {
  expect(foodImageUrl("food/my photo.jpg")).toBe("https://media.example/food/my%20photo.jpg");
  for (const key of ["car/a.jpg", "https://other.example/a.jpg", "food/../a.jpg", "food/a?x", "food/%2e/a.jpg"]) expect(() => foodImageUrl(key)).toThrow();
});
