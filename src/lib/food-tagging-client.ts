export class FoodTagRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function requestFoodTags(id: string | number, signal?: AbortSignal): Promise<{ tags: string[]; skipped: boolean }> {
  const response = await fetch(`/api/photos/${encodeURIComponent(String(id))}/auto-tag`, {
    method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}", signal,
  });
  const body = await response.json();
  if (!response.ok) throw new FoodTagRequestError(body.error || "Food tagging failed.", response.status);
  if (!Array.isArray(body.tags) || body.tags.some((tag: unknown) => typeof tag !== "string")) throw new Error("Invalid tag response.");
  return { tags: body.tags, skipped: body.skipped === true };
}

export type TagBatchProgress = { processed: number; remaining: number; failed: number; total: number };
export async function runFoodTagBatch(ids: (string | number)[], options: {
  signal: AbortSignal;
  shouldSkip: (id: string | number) => boolean;
  tag: (id: string | number, signal: AbortSignal) => Promise<{ tags: string[]; skipped: boolean }>;
  onResult: (id: string | number, result: { tags: string[]; skipped: boolean }) => void;
  onError: (id: string | number, error: unknown) => void;
  onProgress: (progress: TagBatchProgress) => void;
}) {
  const progress = { processed: 0, remaining: ids.length, failed: 0, total: ids.length };
  let reason = "Complete";
  options.onProgress({ ...progress });
  for (const id of ids) {
    if (options.signal.aborted) { reason = "Stopped"; break; }
    let pause = false;
    if (!options.shouldSkip(id)) {
      try {
        const result = await options.tag(id, options.signal);
        if (options.signal.aborted) { reason = "Stopped"; break; }
        options.onResult(id, result);
      } catch (error) {
        if (options.signal.aborted) { reason = "Stopped"; break; }
        progress.failed++;
        options.onError(id, error);
        if (error instanceof FoodTagRequestError && [401, 403, 429, 503].includes(error.status)) {
          reason = error.message; pause = true;
        }
      }
    }
    progress.processed++;
    progress.remaining--;
    options.onProgress({ ...progress });
    if (pause) break;
  }
  return { ...progress, reason };
}
