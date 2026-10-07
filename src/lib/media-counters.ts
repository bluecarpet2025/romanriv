export type MediaKind = "photo" | "anime";
export type CounterAction = "view" | "like";

/** Explicit visitor actions only; callers decide when to invoke this request. */
export async function changeMediaCounter(kind: MediaKind, action: CounterAction, id: string, delta?: 1 | -1): Promise<number> {
  const response = await fetch(`/api/${kind === "photo" ? "photos" : "anime"}/${action}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...(action === "like" ? { delta } : {}) }),
  });
  if (!response.ok) throw new Error(`Could not update ${action} count.`);
  const body = await response.json();
  const value = body?.[action === "view" ? "views" : "likes"];
  if (!Number.isInteger(value) || value < 0) throw new Error("Invalid counter response.");
  return value;
}

const PHOTO_LIKES_KEY = "rr_liked_photos_v1";
function photoLikes(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(PHOTO_LIKES_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}
export function readVisitorLike(kind: MediaKind, id: string): boolean {
  if (typeof window === "undefined") return false;
  try { return kind === "photo" ? photoLikes().includes(id) : window.localStorage.getItem(`anime-liked-${id}`) === "1"; }
  catch { return false; }
}
export function writeVisitorLike(kind: MediaKind, id: string, liked: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (kind === "photo") {
      const ids = photoLikes().filter((value) => value !== id);
      window.localStorage.setItem(PHOTO_LIKES_KEY, JSON.stringify(liked ? [...ids, id] : ids));
    } else if (liked) window.localStorage.setItem(`anime-liked-${id}`, "1");
    else window.localStorage.removeItem(`anime-liked-${id}`);
  } catch { /* The current card still works when browser storage is unavailable. */ }
}
