"use client";

import { useEffect } from "react";

type Props = {
  id: string;
};

export function AnimeViewTracker({ id }: Props) {
  useEffect(() => {
    let cancelled = false;

    const bump = async () => {
      try {
        await fetch("/api/anime/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        // fine to ignore for now
      }
    };

    if (!cancelled) bump();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return null;
}
