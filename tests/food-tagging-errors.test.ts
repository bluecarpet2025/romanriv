import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { providerFailure, sanitizeProviderMessage } from "@/lib/food-tagging-errors";
beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

it.each([
  { status: 401, type: "invalid_request_error", code: "invalid_api_key", message: "Incorrect API key", expected: "invalid_api_key", http: 503 },
  { status: 403, type: "permission_error", code: "insufficient_permissions", message: "Missing scope", expected: "insufficient_key_permission", http: 503 },
  { status: 404, type: "invalid_request_error", code: "model_not_found", message: "Model unavailable", expected: "model_unavailable", http: 503 },
  { status: 404, type: null, code: null, message: "Unknown endpoint", expected: "endpoint_unavailable", http: 503 },
  { status: 429, type: "insufficient_quota", code: "insufficient_quota", message: "Check project billing", expected: "provider_quota_exhausted", http: 503 },
  { status: 429, type: "rate_limit_error", code: "rate_limit_exceeded", message: "Request rate exceeded; billing is active", expected: "provider_rate_limit", http: 429 },
  { status: 400, type: "invalid_request_error", code: "invalid_image_url", message: "Unable to download image URL", expected: "invalid_image", http: 422 },
  { status: 400, type: "invalid_request_error", code: "unsupported_image", message: "Unsupported image format", expected: "invalid_image", http: 422 },
  { status: 400, type: "invalid_request_error", code: "invalid_json_schema", message: "Invalid image-tag schema", expected: "invalid_provider_request", http: 503 },
  { status: 400, type: "invalid_request_error", code: "unsupported_model", message: "Model lacks image support", expected: "invalid_provider_request", http: 503 },
  { status: 500, type: "server_error", code: "server_error", message: "Provider failed", expected: "provider_unavailable", http: 503 },
])("classifies $status / $code without exposing raw data", ({ status, type, code, message, expected, http }) => {
  const failure = providerFailure(status, { error: { type, code, message, other: "private provider data" } }, "openai", "secret-key");
  expect(failure).toMatchObject({ status: http, code: expected, diagnostic: { status, type, code, message } });
  expect(failure.message).not.toContain("private provider data");
  const log = vi.mocked(console.error).mock.calls[0];
  expect(JSON.parse(String(log[1]))).toEqual({ provider: "openai", status, type, code, message });
});
it("gives an endpoint-specific permission message", () => {
  expect(providerFailure(403, {}, "openai", "secret-key").message).toContain("permission for Responses");
  expect(providerFailure(403, {}, "openai-compatible", "secret-key").message).toContain("permission for Chat Completions");
});
it("redacts configured credentials, masked OpenAI keys, bearer headers and URL query secrets", () => {
  const text = sanitizeProviderMessage('Key secret-key; sk-proj-test****123; Authorization: Bearer random-token; https://user:password@example.com/photo.jpg?token=private#fragment\n', ["secret-key"]);
  for (const value of ["secret-key", "sk-proj-", "random-token", "password", "private", "fragment"]) expect(text).not.toContain(value);
  expect(text).toContain("https://example.com/photo.jpg"); expect(text).not.toContain("\n");
});
it("redacts type/code fields too, and never logs headers or raw response bodies", () => {
  providerFailure(401, { error: { type: "secret-key", code: "sk-proj-secret", message: "secret-key" }, headers: { Authorization: "secret-key" } }, "openai", "secret-key");
  const log = JSON.stringify(vi.mocked(console.error).mock.calls);
  expect(log).not.toContain("secret-key"); expect(log).not.toContain("sk-proj-secret"); expect(log).not.toContain("Authorization");
});
it("limits log message size and handles non-JSON errors", () => {
  expect(sanitizeProviderMessage("x".repeat(2000))).toHaveLength(1000);
  expect(providerFailure(502, "<html>private</html>", "openai", "secret-key").diagnostic).toMatchObject({ type: null, code: null, message: "Provider did not return a JSON error message." });
});
