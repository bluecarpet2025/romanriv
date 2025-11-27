// src/app/page.tsx
import Image from "next/image";
import { SectionCard } from "@/components/SectionCard";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";

// ----- Types -----

export type GalleryItem = {
  id: number | string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  tags: string[];
};

// ----- Data loaders -----

async function getHomeFood(): Promise<GalleryItem[]> {
  const fallback: GalleryItem[] = [
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

  const { data, error } = await supabase
    .from("photos")
    .select("id, title, description, image_path, tags, category, created_at")
    .eq("category", "food")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data || data.length === 0) return fallback;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
  }));
}

async function getHomeCars(): Promise<GalleryItem[]> {
  const fallback: GalleryItem[] = [
    {
      id: 1,
      title: "2024 GR Corolla Circuit Edition",
      subtitle: "Blue Ice. The current daily and track-day dream.",
      imageUrl: "/placeholder-car-1.jpg",
      tags: ["gr corolla", "blue ice", "2024"],
    },
  ];

  const { data, error } = await supabase
    .from("photos")
    .select("id, title, description, image_path, tags, category, created_at")
    .eq("category", "car")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data || data.length === 0) return fallback;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
  }));
}

// Simple static anime previews for now – you can swap these
// for real anime cover URLs later if you want.
const ANIME_PREVIEW_IMAGES = [
  "/placeholder-anime-1.jpg",
  "/placeholder-anime-2.jpg",
  "/placeholder-anime-3.jpg",
];

export default async function HomePage() {
  const [foodItems, carItems] = await Promise.all([
    getHomeFood(),
    getHomeCars(),
  ]);

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

      {/* Food / Cars / Anime – 3 tiles in a row on desktop */}
      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Food */}
        <SectionCard
          title="Food"
          description="Collage of the meals I cook and plate – mostly post-gym and weekend experiments."
          href="/food"
          badge="Gallery"
        >
          <div className="mt-3 grid grid-cols-3 gap-2">
            {foodItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="relative aspect-[4/5] overflow-hidden rounded-md border border-slate-800/80 bg-slate-900/80"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Cars */}
        <SectionCard
          title="Cars"
          description="My current GR Corolla and a timeline of the cars that came before it."
          href="/cars"
          badge="Garage"
        >
          <div className="mt-3 grid grid-cols-3 gap-2">
            {carItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="relative aspect-[4/5] overflow-hidden rounded-md border border-slate-800/80 bg-slate-900/80"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}

            {/* If you only have 1 car photo, this keeps the row looking full */}
            {carItems.length === 1 &&
              [1, 2].map((idx) => (
                <div
                  key={`car-placeholder-${idx}`}
                  className="relative aspect-[4/5] overflow-hidden rounded-md border border-slate-800/40 bg-slate-950/60"
                >
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                    More shots coming soon
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>

        {/* Anime */}
        <SectionCard
          title="Anime"
          description="Watchlists, long-form shows, and the series I come back to over and over."
          href="/anime"
          badge="Lists"
        >
          {/* 3 small anime tiles in a row */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ANIME_PREVIEW_IMAGES.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/5] overflow-hidden rounded-md border border-slate-800/80 bg-slate-900/80"
              >
                <Image
                  src={src}
                  alt={`Anime preview ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <ul className="mt-3 space-y-1 text-xs text-slate-300">
            <li>• Currently watching &amp; seasonal shows.</li>
            <li>• Completed list &amp; rewatch candidates.</li>
            <li>• Special lists for long shounen and comfy shows.</li>
          </ul>
        </SectionCard>
      </section>

      {/* Projects only – discussions removed */}
      <section className="mt-6">
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
      </section>
    </div>
  );
}
