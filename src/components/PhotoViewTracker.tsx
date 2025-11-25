"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type PhotoViewTrackerProps = {
  // accept both string and number IDs from the page
  ids: (string | number)[];
};

export function PhotoViewTracker({ ids }: PhotoViewTrackerProps) {
  useEffect(() => {
    if (!ids || ids.length === 0) return;

    // Normalize everything to numbers for the RPC
    const numericIds = ids
      .map((id) => Number(id))
      .filter((value) => Number.isFinite(value));

    if (numericIds.length === 0) return;

    const incrementViews = async () => {
      try {
        const { error } = await supabase.rpc("increment_photo_views", {
          photo_ids: numericIds,
        });

        if (error) {
          console.error(
            "[PhotoViewTracker] Supabase RPC error while incrementing views",
            error
          );
        }
      } catch (err) {
        console.error(
          "[PhotoViewTracker] Unexpected error while incrementing views",
          err
        );
      }
    };

    incrementViews();
  }, [ids]);

  // No UI – this just fires the RPC
  return null;
}
