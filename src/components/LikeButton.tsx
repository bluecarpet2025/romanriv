"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LikeButtonProps = {
  photoId: string;          // photos.id (uuid)
  initialLikes: number;     // value from DB
};

const STORAGE_KEY = "rr_liked_photos_v1";

function loadLikedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLikedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function LikeButton({ photoId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(initialLikes ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // On mount, hydrate from localStorage
  useEffect(() => {
    setHasHydrated(true);
    const likedIds = loadLikedIds();
    if (likedIds.includes(String(photoId))) {
      setIsLiked(true);
    }
  }, [photoId]);

  const handleClick = async () => {
    if (!hasHydrated || isLoading) return;

    const likedIds = loadLikedIds();
    const currentlyLiked = likedIds.includes(String(photoId));
    const nextLiked = !currentlyLiked;
    const delta = nextLiked ? 1 : -1;

    // Optimistic UI update
    setIsLoading(true);
    setIsLiked(nextLiked);
    setLikes((prev) => Math.max(0, (prev ?? 0) + delta));

    let newLikedIds: string[];
    if (nextLiked) {
      newLikedIds = Array.from(new Set([...likedIds, String(photoId)]));
    } else {
      newLikedIds = likedIds.filter((id) => id !== String(photoId));
    }
    saveLikedIds(newLikedIds);

    const { data, error } = await supabase.rpc("increment_photo_likes", {
      photo_id: photoId,
      delta,
    });

    if (error) {
      // Roll back if RPC fails
      console.error("[LikeButton] RPC error", error);
      setIsLiked(currentlyLiked);
      setLikes((prev) => Math.max(0, (prev ?? 0) - delta));
      saveLikedIds(likedIds);
    } else if (typeof data === "number") {
      // Trust server value if it comes back
      setLikes(Math.max(0, data));
    }

    setIsLoading(false);
  };

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
