"use client";

import { useMediaLike } from "./useMediaCounters";

type LikeButtonProps = { photoId: string; initialLikes: number };

export function LikeButton({ photoId, initialLikes }: LikeButtonProps) {
  const { likes, liked: isLiked, loading: isLoading, hydrated: hasHydrated, toggle: handleClick } = useMediaLike("photo", photoId, initialLikes);

  // While not hydrated, avoid rendering a misleading state
  if (!hasHydrated) {
    return (
      <div className="flex items-center gap-3 text-xs text-slate-400 opacity-70">
        <span className="inline-flex items-center gap-1">
          <span>♡</span>
          <span>{likes}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span>👁</span>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isLiked}
      aria-label={isLiked ? "Unlike photo" : "Like photo"}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs sm:text-sm
        text-slate-200 transition
        hover:bg-slate-900/60 hover:text-sky-200
        disabled:cursor-not-allowed disabled:opacity-60
      `}
    >
      {/* Heart + count */}
      <span
        className={`inline-flex items-center gap-1 transition-transform ${
          isLiked ? "scale-110 text-rose-300" : "text-slate-300"
        }`}
      >
        <span className={isLiked ? "animate-[pulse_0.4s_ease-out]" : ""}>
          {isLiked ? "♥" : "♡"}
        </span>
        <span>{likes}</span>
      </span>

      {/* "You liked this" badge */}
      {isLiked && (
        <span className="hidden rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-200 sm:inline">
          You liked this
        </span>
      )}
    </button>
  );
}
