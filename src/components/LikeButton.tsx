"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";

type LikeButtonProps = {
  photoId: number;
  initialLikes?: number | null;
};

export function LikeButton({ photoId, initialLikes = 0 }: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(initialLikes ?? 0);
  const [isPending, startTransition] = useTransition();
  const [hasClicked, setHasClicked] = useState(false);

  const handleClick = () => {
    if (isPending || hasClicked) return;

    const nextLikes = likes + 1;
    setHasClicked(true);
    setLikes(nextLikes); // optimistic update

    startTransition(async () => {
      const { data, error } = await supabase
        .from("photos")
        .update({ likes: nextLikes })
        .eq("id", photoId)
        .select("likes")
        .single();

      if (error) {
        console.error("Failed to update likes", error);
        // roll back if needed
        setLikes((current) => Math.max(current - 1, 0));
        setHasClicked(false);
      } else if (data?.likes !== undefined && data.likes !== null) {
        setLikes(data.likes);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || hasClicked}
      className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Like photo"
    >
      <span className="text-[10px]" aria-hidden="true">
        ♥
      </span>
      <span>{likes}</span>
    </button>
  );
}
