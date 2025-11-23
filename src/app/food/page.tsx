// src/app/food/page.tsx
import { GalleryGrid, GalleryItem } from "@/components/GalleryGrid";

export const metadata = {
  title: "Food | romanriv.com",
};

const dummyFood: GalleryItem[] = [
  {
    id: 1,
    title: "Miso Salmon & Broccoli",
    subtitle: "Saturday post-gym dinner, simple and clean.",
    imageUrl: "/placeholder-food-1.jpg",
    tags: ["salmon", "broccoli", "dinner"],
  },
  {
    id: 2,
    title: "Steak, Potatoes & Greens",
    subtitle: "Learning the line between seared and burned.",
    imageUrl: "/placeholder-food-2.jpg",
    tags: ["steak", "comfort", "weeknight"],
  },
  {
    id: 3,
    title: "Shrimp Rice Bowl",
    subtitle: "Shrimp, rice, and greens – camera favorite.",
    imageUrl: "/placeholder-food-3.jpg",
    tags: ["shrimp", "bowl", "meal prep"],
  },
];

export default function FoodPage() {
  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Food
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          For the last few years, every time I cook something and the plate
          looks good, I take a picture. This page is a collage of those meals:
          post-gym dinners, weekend experiments, and whatever looked good
          enough to grab the camera.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          In the future, each dish will come from a real database entry with
          tags, likes, and an optional description. For now, this is a static
          preview of how the gallery will feel.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Recent dishes</h2>
          <p className="section-subtitle">
            Tags and likes per picture, comments in the global discussion.
          </p>
        </div>

        <GalleryGrid items={dummyFood} />
      </section>
    </div>
  );
}
