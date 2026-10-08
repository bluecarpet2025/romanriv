import "server-only";

export type ProviderDiagnostic = { status: number; type: string | null; code: string | null; message: string };
export class FoodTaggingError extends Error {
  constructor(message: string, public status = 502, public code = "tagging_failed", public diagnostic?: ProviderDiagnostic) { super(message); }
}

export function sanitizeProviderMessage(value: unknown, secrets: readonly string[] = []): string {
  let message = typeof value === "string" ? value : "Provider did not return a JSON error message.";
  for (const secret of secrets) if (secret) message = message.replaceAll(secret, "[redacted]");
  message = message.replace(/\bsk[-_][a-zA-Z0-9_*.-]+/g, "[redacted]")
    .replace(/\bBearer\s+[a-zA-Z0-9._~+/-]+/gi, "Bearer [redacted]")
    .replace(/https?:\/\/[^\s"'<>]+/g, (url) => {
      try { const parsed = new URL(url); return `${parsed.origin}${parsed.pathname}`; }
      catch { return "[redacted URL]"; }
    }).replace(/[\x00-\x1f\x7f]/g, " ");
  return message.slice(0, 1000);
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function providerFailure(status: number, body: unknown, provider: "openai" | "openai-compatible", key: string): FoodTaggingError {
  const error = record(record(body).error);
  const label = (value: unknown) => {
    const safe = typeof value === "string" ? sanitizeProviderMessage(value, [key]) : "";
    return /^[a-zA-Z0-9_.-]{1,100}$/.test(safe) ? safe : null;
  };
  const diagnostic: ProviderDiagnostic = { status, type: label(error.type), code: label(error.code), message: sanitizeProviderMessage(error.message, [key]) };
  const signal = [diagnostic.type, diagnostic.code, diagnostic.message, error.param].filter((value) => typeof value === "string").join(" ").toLowerCase();
  const name = provider === "openai" ? "OpenAI" : "The configured AI provider";
  let message: string, code: string, responseStatus = 503;
  if (status === 401 || diagnostic.code === "invalid_api_key") {
    message = `${name} rejected the API key. Check the configured credential.`; code = "invalid_api_key";
  } else if (status === 403) {
    message = `The API key does not have permission for ${provider === "openai" ? "Responses" : "Chat Completions"}.`; code = "insufficient_key_permission";
  } else if (status === 404) {
    message = /model/.test(signal) ? "The configured model is unavailable." : "The configured API endpoint is unavailable.";
    code = /model/.test(signal) ? "model_unavailable" : "endpoint_unavailable";
  } else if (status === 429) {
    const explicitRateLimit = /rate_limit/.test(diagnostic.code ?? diagnostic.type ?? "");
    const quota = !explicitRateLimit && /insufficient_quota|billing|credit|exceeded.*quota|quota.*exhaust/.test(signal);
    message = quota ? `${name} API quota is exhausted. Check project billing.` : `${name} rate limit reached. Resume tagging later.`;
    code = quota ? "provider_quota_exhausted" : "provider_rate_limit";
    responseStatus = quota ? 503 : 429;
  } else if ([400, 422].includes(status) && (/^(model|text\.format|response_format|max_output_tokens)/.test(typeof error.param === "string" ? error.param : "") || /invalid_json_schema|unsupported_parameter|unsupported_model/.test(diagnostic.code ?? ""))) {
    message = `${name} rejected the request, schema, or model configuration. Check the server diagnostics.`; code = "invalid_provider_request";
  } else if (/image/.test(signal) && (status === 400 || status === 422 || /invalid_image|image_url|image_parse|image_too|unsupported_image/.test(signal))) {
    message = `${name} cannot access or process this image URL.`; code = "invalid_image"; responseStatus = 422;
  } else if (status >= 500 || diagnostic.code === "server_error") {
    message = `${name} is temporarily unavailable. Resume tagging later.`; code = "provider_unavailable";
  } else if (status === 400 || status === 422) {
    message = `${name} rejected the request, schema, or model configuration. Check the server diagnostics.`; code = "invalid_provider_request";
  } else {
    message = `${name} analysis failed. Check the server diagnostics.`; code = "provider_error"; responseStatus = 502;
  }
  // Log selected, redacted fields only. Never log request objects or headers.
  console.error("[food-tagging] provider_error", JSON.stringify({ provider, ...diagnostic }));
  return new FoodTaggingError(message, responseStatus, code, diagnostic);
}
