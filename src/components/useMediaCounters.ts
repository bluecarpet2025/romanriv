"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { changeMediaCounter, readVisitorLike, writeVisitorLike, type MediaKind } from "@/lib/media-counters";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useMediaViews(kind: MediaKind, id: string, initialViews: number) {
  const [views, setViews] = useState(initialViews);
  function onOpen() {
    void changeMediaCounter(kind, "view", id).then((value) => {
      // Rapid close/reopen requests may finish out of order; views only increase.
      setViews((previous) => Math.max(previous, value));
    }).catch((error) => console.warn("Could not record image view", error));
  }
  return { views, onOpen };
}

export function useMediaLike(kind: MediaKind, id: string, initialLikes: number) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const rememberedLike = useSyncExternalStore(subscribe, () => readVisitorLike(kind, id), serverSnapshot);
  const [likes, setLikes] = useState(initialLikes);
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const liked = likedOverride ?? rememberedLike;
  async function toggle() {
    if (!hydrated || pending.current) return;
    pending.current = true;
    const previousLikes = likes;
    const previousLiked = liked;
    const nextLiked = !previousLiked;
    setLoading(true);
    setLikedOverride(nextLiked);
    setLikes(Math.max(0, previousLikes + (nextLiked ? 1 : -1)));
    writeVisitorLike(kind, id, nextLiked);
    try {
      setLikes(await changeMediaCounter(kind, "like", id, nextLiked ? 1 : -1));
    } catch (error) {
      setLikes(previousLikes);
      setLikedOverride(previousLiked);
      // Restore this item only, preserving likes made on other cards meanwhile.
      writeVisitorLike(kind, id, previousLiked);
      console.warn("Could not update item like", error);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  return { likes, liked, loading, hydrated, toggle };
}
