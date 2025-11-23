// src/app/discuss/page.tsx
import { ThreadList, ThreadSummary } from "@/components/ThreadList";

export const metadata = {
  title: "Discuss | romanriv.com",
};

const allThreads: ThreadSummary[] = [
  {
    id: "1",
    title: "What anime should I binge next weekend?",
    category: "anime",
    commentCount: 8,
    createdAt: "Nov 2025",
  },
  {
    id: "2",
    title: "Most photogenic meals you’ve cooked recently",
    category: "food",
    commentCount: 5,
    createdAt: "Oct 2025",
  },
  {
    id: "3",
    title: "Thoughts on the GR Corolla vs Civic Type R",
    category: "cars",
    commentCount: 12,
    createdAt: "Sep 2025",
  },
  {
    id: "4",
    title: "Early thoughts on Kiori and similar tools",
    category: "business",
    commentCount: 3,
    createdAt: "Sep 2025",
  },
];

export default function DiscussPage() {
  return (
    <div className="page-shell">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Discuss
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Instead of comments under every photo or anime entry, conversations
          live here in one place. Anyone can start a thread with a title and a
          post, and others can reply under it.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Threads are grouped by category: anime, food, cars, business, or
          general. Later, these will come from Supabase instead of static data,
          and you&apos;ll be able to create new threads directly from this
          page.
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>v1 is read-only mock data.</span>
          <span>Next step: Supabase + thread creation form.</span>
        </div>
      </header>

      <section>
        <ThreadList threads={allThreads} />
      </section>

      <section className="card text-sm text-slate-400">
        <p>
          In the real version, this section will be a simple form to start a new
          thread:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Choose a category (anime, food, cars, business, general).</li>
          <li>Give it a title.</li>
          <li>Write your post and submit.</li>
        </ul>
        <p className="mt-2">
          For now, this is just a placeholder note so we remember what we&apos;re
          building toward.
        </p>
        <p className="mt-2">
          You&apos;ll also see thread-specific pages at URLs like{" "}
          <code className="rounded bg-slate-900 px-2 py-1 text-xs">
            /discuss/&lt;thread-id&gt;
          </code>{" "}
          once we add dynamic routes.
        </p>
      </section>
    </div>
  );
}
