// src/app/page.tsx
import { SectionCard } from "@/components/SectionCard";
import { GalleryGrid } from "@/components/GalleryGrid";
import { ThreadList } from "@/components/ThreadList";

export default function HomePage() {
  const sampleFood = [
    {
      id: 1,
      title: "Miso Salmon & Broccoli",
      subtitle: "Gym-day dinner, high protein, low effort.",
      imageUrl: "/placeholder-food-1.jpg",
      tags: ["salmon", "broccoli", "dinner"],
    },
    {
      id: 2,
      title: "Steak & Potatoes",
      subtitle: "Weeknight experiment with a new pan.",
      imageUrl: "/placeholder-food-2.jpg",
      tags: ["steak", "comfort"],
    },
    {
      id: 3,
      title: "Shrimp & Rice Bowl",
      subtitle: "Sunday meal prep, camera loved it.",
      imageUrl: "/placeholder-food-3.jpg",
      tags: ["shrimp", "meal prep"],
    },
  ];

  const sampleCar = [
    {
      id: 1,
      title: "2024 GR Corolla Circuit Edition",
      subtitle: "Blue Ice. The current daily and track-day dream.",
      imageUrl: "/placeholder-car-1.jpg",
      tags: ["gr corolla", "blue ice", "2024"],
    },
  ];

  const sampleThreads = [
    {
      id: "1",
      title: "What anime should I binge next weekend?",
      category: "anime" as const,
      commentCount: 8,
      createdAt: "Nov 2025",
    },
    {
      id: "2",
      title: "Most photogenic meals you’ve cooked recently",
      category: "food" as const,
      commentCount: 5,
      createdAt: "Oct 2025",
    },
    {
      id: "3",
      title: "Thoughts on the GR Corolla vs Civic Type R",
      category: "cars" as const,
      commentCount: 12,
      createdAt: "Sep 2025",
    },
  ];

  return (
    <div className="page-shell">
      {/* Intro */}
      <section className="card">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">
          Hi, I&apos;m Roman.
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          This site is my personal playground. It collects the things I care
          about and spend time on: the food I cook, the cars I drive, the anime
          I watch, and the businesses I&apos;m building in the background.
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Think of it as a living notebook: part photo gallery, part anime log,
          part dev log for projects like{" "}
          <span className="font-semibold text-sky-300">Kiori Solutions</span>.
        </p>
      </section>

      {/* Food / Cars / Anime */}
      <section className="space-y-4">
        <SectionCard
          title="Food"
          description="Collage of the meals I cook and plate – mostly post-gym and weekend experiments."
          href="/food"
          badge="Gallery"
        >
          <div className="mt-3">
            <GalleryGrid items={sampleFood} />
          </div>
        </SectionCard>

        <SectionCard
          title="Cars"
          description="My current GR Corolla and a timeline of the cars that came before it."
          href="/cars"
          badge="Garage"
        >
          <div className="mt-3">
            <GalleryGrid items={sampleCar} />
          </div>
        </SectionCard>

        <SectionCard
          title="Anime"
          description="Watchlists, long-form shows, and the series I come back to over and over."
          href="/anime"
          badge="Lists"
        >
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Currently watching & seasonal shows.</li>
            <li>• Completed list & rewatch candidates.</li>
            <li>• Special lists for long shounen and comfy shows.</li>
          </ul>
        </SectionCard>
      </section>

      {/* Business + Recent discussions */}
      <section className="space-y-4">
        <SectionCard
          title="Projects"
          description="Notes and updates on Kiori Solutions, KDP experiments, and other side projects."
          href="/business"
          badge="Work in progress"
        >
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Kiori: inventory, costing, and clarity for food businesses.</li>
            <li>• KDP: journals, planners, and faith-based content.</li>
            <li>
              • Automations: n8n, Pinterest workflows, and other experiments.
            </li>
          </ul>
        </SectionCard>

        <ThreadList
          title="Recent discussions"
          threads={sampleThreads}
          showCategoryFilterHint
        />
      </section>
    </div>
  );
}
