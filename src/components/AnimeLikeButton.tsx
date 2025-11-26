"use client";

import { useEffect, useState } from "react";

type AnimeLikeButtonProps = {
  animeId: string;
  initialLikes: number;
};

export function AnimeLikeButton({
  animeId,
  initialLikes,
}: AnimeLikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hydrate "liked" state from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        `anime-liked-${animeId}`
      );
      if (stored === "1") {
        setLiked(true);
      }
    } catch {
      // ignore
    }
  }, [animeId]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    const nextLiked = !liked;
    const delta = nextLiked ? 1 : -1;

    try {
      const res = await fetch("/api/anime/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: animeId, delta }),
      });

      if (!res.ok) {
        console.error("Failed to toggle like", await res.text());
        setLoading(false);
        return;
      }

      const json = await res.json();
      setLikes(json.likes ?? likes);

      setLiked(nextLiked);
      try {
        if (nextLiked) {
          window.localStorage.setItem(
            `anime-liked-${animeId}`,
            "1"
          );
        } else {
          window.localStorage.removeItem(
            `anime-liked-${animeId}`
          );
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Toggle like error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
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
