"use client";

import { useMediaLike } from "./useMediaCounters";

type AnimeLikeButtonProps = { animeId: string; initialLikes: number };

export function AnimeLikeButton({ animeId, initialLikes }: AnimeLikeButtonProps) {
  const { likes, liked, loading, toggle: handleToggle } = useMediaLike("anime", animeId, initialLikes);

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike anime" : "Like anime"}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition
        ${
          liked
            ? "border-rose-500 bg-rose-500/20 text-rose-200"
            : "border-slate-600 bg-slate-900/70 text-slate-200 hover:border-slate-400"
        }`}
    >
      <span className={liked ? "text-[13px]" : "text-[12px]"}>
        {liked ? "❤️" : "🤍"}
      </span>
      <span className="tabular-nums">{likes}</span>
    </button>
  );
}
