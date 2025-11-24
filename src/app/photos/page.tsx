// src/app/photos/page.tsx
import { supabase, getMediaPublicUrl } from "@/lib/supabase";

export const metadata = {
  title: "Photos | Admin | romanriv.com",
};

type PhotoRow = {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  image_path: string;
  tags: string[] | null;
  created_at: string;
};

async function getAllPhotos(): Promise<PhotoRow[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("id, title, description, category, image_path, tags, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllPhotos] error:", error);
    return [];
  }

  return (data as PhotoRow[]) || [];
}

export default async function PhotosAdminPage() {
  const photos = await getAllPhotos();

  return (
    <div className="page-shell-wide space-y-6">
      {/* Header */}
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Photo Library (Admin)
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          This page lists every photo in Supabase as small thumbnails. Later
          we&apos;ll add editing, tagging, AI helpers, and batch operations.
        </p>
      </header>

      {/* Grid of thumbnails */}
      <section className="card">
        {photos.length === 0 ? (
          <p className="text-sm text-slate-300">No photos found yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 flex flex-col gap-2"
              >
                {/* Thumbnail – capped size */}
                <div className="w-full h-40 rounded-md overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={getMediaPublicUrl(p.image_path)}
                    alt={p.title || "Photo"}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-[0.65rem] text-slate-400">
                      {p.category || "uncategorized"}
                    </span>
                    <span>
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100">
                    {p.title || "Untitled photo"}
                  </h3>

                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  {p.tags && p.tags.length > 0 && (
                    <p className="text-[0.7rem] text-slate-400">
                      Tags: {p.tags.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
