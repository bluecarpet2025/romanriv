// src/components/ThreadList.tsx
import Link from "next/link";

export interface ThreadSummary {
  id: string | number;
  title: string;
  category: "anime" | "food" | "cars" | "business" | "general";
  commentCount: number;
  createdAt: string; // display-ready
}

interface ThreadListProps {
  title?: string;
  threads: ThreadSummary[];
  showCategoryFilterHint?: boolean;
}

const categoryLabels: Record<ThreadSummary["category"], string> = {
  anime: "Anime",
  food: "Food",
  cars: "Cars",
  business: "Business",
  general: "General",
};

export function ThreadList({
  title,
  threads,
  showCategoryFilterHint,
}: ThreadListProps) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">{title ?? "Latest discussions"}</h2>
          {showCategoryFilterHint && (
            <p className="mt-1 section-subtitle">
              Threads are grouped by category: Anime, Food, Cars, Business, or
              General.
            </p>
          )}
        </div>
        <Link
          href="/discuss"
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          View all &rarr;
        </Link>
      </div>

      <ul className="divide-y divide-slate-800 text-sm">
        {threads.length === 0 && (
          <li className="py-3 text-xs text-slate-500">
            No threads yet. Be the first to start a discussion.
          </li>
        )}
        {threads.map((thread) => (
          <li key={thread.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/discuss/${thread.id}`}
                  className="line-clamp-2 font-medium text-slate-100 hover:text-sky-300"
                >
                  {thread.title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-900 px-2 py-0.5">
                    {categoryLabels[thread.category]}
                  </span>
                  <span>{thread.commentCount} comments</span>
                  <span>•</span>
                  <span>{thread.createdAt}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
