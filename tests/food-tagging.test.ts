import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { analyzeFoodImage, foodImageUrl } from "@/lib/food-tagging";

const image = "https://media.example/food/photo.jpg";
const result = (content: unknown, status = "completed", refusal: unknown = null) => Response.json({ status, error: null,
  output: [{ type: "message", role: "assistant", status: status === "completed" ? "completed" : "incomplete",
    content: [refusal ? { type: "refusal", refusal } : { type: "output_text", text: typeof content === "string" ? content : JSON.stringify(content) }] }] });
beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "fake-key"); vi.stubEnv("FOOD_TAGGING_MODEL", "vision-model"); vi.stubEnv("FOOD_TAGGING_PROVIDER", "openai");
  vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_BASE_URL", "https://media.example"); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(result({ tags: ["Egg", "tomato"] })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("sends the R2 URL directly with strict structured output and a completion cap", async () => {
  expect(await analyzeFoodImage(image)).toEqual(["eggs", "tomatoes"]);
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/responses");
  const body = JSON.parse(options!.body as string);
  expect(body.model).toBe("vision-model"); expect(body.max_output_tokens).toBe(500); expect(body.store).toBe(false);
  expect(body.instructions).toContain("visible food ingredients");
  expect(body.input[0].content[1]).toEqual({ type: "input_image", image_url: image, detail: "auto" });
  expect(body.text.format.strict).toBe(true);
  expect(body.text.format.schema.additionalProperties).toBe(false);
  expect(body.text.format.schema.properties.tags.maxItems).toBe(10);
  expect(body.response_format).toBeUndefined(); expect(body.messages).toBeUndefined();
});
it.each(["OPENAI_API_KEY", "FOOD_TAGGING_MODEL"])("blocks missing %s before a network request", async (key) => {
  vi.stubEnv(key, "");
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 503, code: "tagging_not_configured" });
  expect(fetch).not.toHaveBeenCalled();
});
it("supports a configured compatible provider without sending the OpenAI credential", async () => {
  vi.stubEnv("FOOD_TAGGING_PROVIDER", "openai-compatible"); vi.stubEnv("FOOD_TAGGING_BASE_URL", "https://provider.example/v1"); vi.stubEnv("FOOD_TAGGING_API_KEY", "other-fake-key");
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ tags: ["eggs"] }) } }] }));
  await analyzeFoodImage(image);
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://provider.example/v1/chat/completions");
  expect(vi.mocked(fetch).mock.calls[0][1]!.headers).toMatchObject({ Authorization: "Bearer other-fake-key" });
  const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body.max_completion_tokens).toBe(500); expect(body.response_format.json_schema.strict).toBe(true);
  expect(body.messages[1].content[1].image_url.url).toBe(image); expect(body.input).toBeUndefined();
});
it.each(["http://provider.example/v1", "invalid", "https://user:password@provider.example/v1"])("rejects unsafe provider URL %s", async (base) => {
  vi.stubEnv("FOOD_TAGGING_PROVIDER", "openai-compatible"); vi.stubEnv("FOOD_TAGGING_BASE_URL", base); vi.stubEnv("FOOD_TAGGING_API_KEY", "fake");
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 503 }); expect(fetch).not.toHaveBeenCalled();
});
it.each([{ tags: ["food"] }, { tags: ["eggs", 5] }, { tags: ["eggs"], description: "extra" }, ["eggs"], "not json"])("rejects malformed AI output %j", async (value) => {
  vi.mocked(fetch).mockResolvedValueOnce(result(value)); await expect(analyzeFoodImage(image)).rejects.toThrow();
});
it("rejects refusals and truncated output", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(result({ tags: ["eggs"] }, "incomplete")); await expect(analyzeFoodImage(image)).rejects.toMatchObject({ code: "incomplete_output" });
  vi.mocked(fetch).mockResolvedValueOnce(result({ tags: ["eggs"] }, "completed", "refused")); await expect(analyzeFoodImage(image)).rejects.toMatchObject({ code: "provider_refusal" });
});
it("reports rate limits without retries", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 429 }));
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 429 }); expect(fetch).toHaveBeenCalledTimes(1);
});
it("reads typed error bodies before constructing admin errors", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: { type: "insufficient_quota", code: "insufficient_quota", message: "Quota exhausted" } }, { status: 429 }));
  await expect(analyzeFoodImage(image)).rejects.toMatchObject({ status: 503, code: "provider_quota_exhausted", diagnostic: { status: 429, type: "insufficient_quota", code: "insufficient_quota", message: "Quota exhausted" } });
  expect(log).toHaveBeenCalledTimes(1); log.mockRestore();
});
it("extracts Responses output text rather than assuming an output_text SDK helper", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ status: "completed", error: null, output: [
    { type: "reasoning", summary: [] }, { type: "message", role: "assistant", status: "completed", content: [
      { type: "output_text", text: '{"tags":[' }, { type: "output_text", text: '"eggs"]}' },
    ] },
  ] }));
  expect(await analyzeFoodImage(image)).toEqual(["eggs"]);
});
it.each([{}, { status: "completed", output: [] }, { status: "completed", output: [{ type: "message", status: "incomplete", content: [] }] }])("rejects malformed Responses envelopes %j", async (body) => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json(body)); await expect(analyzeFoodImage(image)).rejects.toThrow();
});
it("supports cancellation without exposing transport details", async () => {
  const controller = new AbortController(); controller.abort(); vi.mocked(fetch).mockRejectedValueOnce(new Error("private network details"));
  await expect(analyzeFoodImage(image, controller.signal)).rejects.toMatchObject({ status: 499 });
});
it("resolves only safe food R2 paths", () => {
  expect(foodImageUrl("food/my photo.jpg")).toBe("https://media.example/food/my%20photo.jpg");
  for (const key of ["car/a.jpg", "https://other.example/a.jpg", "food/../a.jpg", "food/a?x", "food/%2e/a.jpg"]) expect(() => foodImageUrl(key)).toThrow();
});
