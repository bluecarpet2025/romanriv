// src/app/page.tsx
import { SectionCard } from "@/components/SectionCard";
import { GalleryGrid, GalleryItem } from "@/components/GalleryGrid";
import { supabase, getMediaPublicUrl } from "@/lib/supabase";

/**
 * Utility: pick N random items from an array (Fisher–Yates shuffle)
 */
function pickRandom<T>(arr: T[], count: number): T[] {
  if (arr.length <= count) return arr;
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/* --------------------------------------------------
 * HOME FOOD
 * -------------------------------------------------- */

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
    .limit(12); // grab a few, we will show 3

  if (error || !data || data.length === 0) return fallback;

  const mapped: GalleryItem[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
  }));

  return pickRandom(mapped, 3);
}

/* --------------------------------------------------
 * HOME CARS
 * -------------------------------------------------- */

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
    .limit(12);

  if (error || !data || data.length === 0) return fallback;

  const mapped: GalleryItem[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.description ?? "",
    imageUrl: getMediaPublicUrl(row.image_path),
    tags: (row.tags as string[]) ?? [],
  }));

  return pickRandom(mapped, 3);
}

/* --------------------------------------------------
 * HOME ANIME – random covers from anime table
 * -------------------------------------------------- */

type DbAnimeRow = {
  id: string;
  title: string;
  status: string | null;
  total_seasons: number | null;
  seasons_watched: number | null;
  cover_url: string | null;
};

function formatAnimeSubtitle(row: DbAnimeRow): string {
  const status = row.status ?? "planned";
  const total = row.total_seasons ?? 1;
  const watched = row.seasons_watched ?? 0;

  if (total > 0) {
    return `${status} • ${watched} of ${total} season${total === 1 ? "" : "s"}`;
  }
  return status;
}

async function getHomeAnime(): Promise<GalleryItem[]> {
  // Grab all anime that actually have a cover image
  const { data, error } = await supabase
    .from("anime")
    .select("id, title, status, total_seasons, seasons_watched, cover_url")
    .not("cover_url", "is", null);

  if (error || !data || data.length === 0) {
    // fallback – just return empty and the section will show blanks
    console.error("[home] getHomeAnime error", error);
    return [];
  }

  const rows = data as DbAnimeRow[];

  const mapped: GalleryItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: formatAnimeSubtitle(row),
    imageUrl: row.cover_url as string,
    tags: [],
  }));

  return pickRandom(mapped, 3);
}

/* --------------------------------------------------
 * PAGE
 * -------------------------------------------------- */

export default async function HomePage() {
  const [foodItems, carItems, animeItems] = await Promise.all([
    getHomeFood(),
    getHomeCars(),
    getHomeAnime(),
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

      {/* Food / Cars / Anime */}
      <section className="space-y-4">
        <SectionCard
          title="Food"
          description="Collage of the meals I cook and plate – mostly post-gym and weekend experiments."
          href="/food"
          badge="Gallery"
        >
          <div className="mt-3">
            <GalleryGrid items={foodItems} />
          </div>
        </SectionCard>

        <SectionCard
          title="Cars"
          description="My current GR Corolla and a timeline of the cars that came before it."
          href="/cars"
          badge="Garage"
        >
          <div className="mt-3">
            <GalleryGrid items={carItems} />
          </div>
        </SectionCard>

        <SectionCard
          title="Anime"
          description="Watchlists, covers, and the series I come back to over and over."
          href="/anime"
          badge="Lists"
        >
          <div className="mt-3">
            <GalleryGrid items={animeItems} />
          </div>
        </SectionCard>
      </section>

      {/* Projects */}
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
      </section>
    </div>
  );
}
