// app/business/page.tsx
import Link from "next/link";
import { ThreadList } from "@/components/ThreadList";

export const metadata = {
  title: "Business | romanriv.com",
};

const businessThreads = [
  {
    id: "biz-1",
    title: "Early thoughts on Kiori Solutions",
    category: "business" as const,
    commentCount: 3,
    createdAt: "Sep 2025",
  },
];

export default function BusinessPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Business
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          This is where I keep a public log of the projects I&apos;m building in
          the background:{" "}
          <span className="font-semibold text-sky-300">
            Kiori Solutions
          </span>{" "}
          for food businesses, my KDP experiments, and whatever else I’m
          currently obsessed with.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="section-title">Kiori Solutions</h2>
          <p className="mt-3 text-sm text-slate-300">
            Kiori is a tool I&apos;m building for food entrepreneurs: restaurants,
            food trucks, coffee shops, and anyone trying to keep costs and
            recipes under control without drowning in spreadsheets.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Recipe and inventory tracking.</li>
            <li>• Costing and margin clarity per dish.</li>
            <li>• A clearer view of whether the numbers make sense.</li>
          </ul>
          <p className="mt-3 text-sm text-slate-400">
            It&apos;s still in active development, but if you&apos;re curious:
          </p>
          <Link
            href="https://kiorisolutions.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm font-medium text-sky-400 hover:text-sky-300"
          >
            Visit kiorisolutions.com &rarr;
          </Link>
        </div>

        <div className="card">
          <h2 className="section-title">KDP & other experiments</h2>
          <p className="mt-3 text-sm text-slate-300">
            I also publish notebooks, journals, and other low/medium-content
            books through KDP. It&apos;s a mix of faith-based journals, simple
            planners, and experiments with more structured content.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Over time, I&apos;ll add links and notes here about what works, what
            doesn&apos;t, and what I&apos;m trying next.
          </p>
        </div>
      </section>

      <section>
        <ThreadList
          title="Business discussions"
          threads={businessThreads}
        />
      </section>
    </div>
  );
}
