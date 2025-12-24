"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabaseAuth";

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "car", label: "Cars" },
  { value: "anime", label: "Anime" },
  { value: "business", label: "Business / Projects" },
];

type UploadStatus = "idle" | "uploading" | "done" | "error";

export default function AdminPhotosPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [category, setCategory] = useState<string>("food");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [log, setLog] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
    setLog([]);
    setStatus("idle");
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!files || files.length === 0) {
      alert("Pick at least one image file to upload.");
      return;
    }

    setStatus("uploading");
    const messages: string[] = [];

    // iterate over a real array, not FileList
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const originalName = file.name;
      const ext = originalName.split(".").pop() || "jpg";
      const baseName = originalName.replace(/\.[^/.]+$/, "");

      // e.g. "food/1732320000000-salmon-bowl.jpg"
      const timestamp = Date.now();
      const safeBase = baseName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");
      const path = `${category}/${timestamp}-${safeBase}.${ext}`;

      messages.push(`Uploading ${originalName} → ${path} ...`);
      setLog([...messages]);

      try {
        // 0) Confirm auth session (so RLS policies match authenticated user)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          messages.push(
            `❌ ${originalName}: you are not signed in (no session). Please sign in again.`
          );
          setLog([...messages]);
          setStatus("error");
          break;
        }

        // 1) Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from("media")
          .upload(path, file);

        if (storageError) {
          messages.push(
            `❌ ${originalName}: storage upload failed – ${storageError.message}`
          );
          setLog([...messages]);
          continue;
        }

        const imagePath = storageData?.path ?? path;

        // 2) Insert row into photos
        const { error: insertError } = await supabase.from("photos").insert({
          category,
          title: baseName,
          description: "",
          image_path: imagePath,
          tags: [], // we’ll fill these later or with n8n
        });

        if (insertError) {
          messages.push(
            `⚠️ ${originalName}: uploaded, but DB insert failed – ${insertError.message}`
          );
        } else {
          messages.push(`✅ ${originalName}: uploaded and saved`);
        }

        setLog([...messages]);
      } catch (err: any) {
        messages.push(
          `❌ ${originalName}: unexpected error – ${err?.message ?? String(err)}`
        );
        setLog([...messages]);
      }
    }

    setLog(messages);
    if (messages.some((m) => m.startsWith("❌"))) setStatus("error");
    else setStatus("done");
  };

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Photo uploader
        </h1>

        <p className="mt-3 text-sm text-slate-300">
          Bulk upload photos into the Supabase{" "}
          <code className="rounded bg-slate-900/60 px-1 py-0.5 text-xs">
            photos
          </code>{" "}
          table and{" "}
          <code className="rounded bg-slate-900/60 px-1 py-0.5 text-xs">
            media
          </code>{" "}
          storage bucket.
        </p>

        <p className="mt-2 text-xs text-slate-400">
          Later we can add automatic titles/tags via n8n. For now, this saves the
          filename as the title and leaves tags empty.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold text-sky-300 hover:bg-slate-900/60 hover:text-sky-200"
          >
            Admin home
          </Link>
          <Link
            href="/admin/photos/manage"
            className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold text-sky-300 hover:bg-slate-900/60 hover:text-sky-200"
          >
            Manage photos
          </Link>
        </div>
      </header>

      <section className="card mt-4 space-y-4">
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Category selector */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium text-slate-200">
              Category
              <select
                className="mt-1 block rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-xs text-slate-400">
              Tip: you can select many files at once with Ctrl/Shift-click in
              the file picker.
            </p>
          </div>

          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Photos
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 block w-full text-sm text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-sky-600/90 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-500"
              />
            </label>
            {files && files.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {files.length} file{files.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === "uploading"}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "uploading" ? "Uploading..." : "Upload to Supabase"}
          </button>
        </form>

        {/* Upload log */}
        {log.length > 0 && (
          <div className="mt-4 rounded-md bg-slate-900/80 p-3 text-xs text-slate-200">
            <h2 className="mb-2 font-semibold text-slate-100">Upload log</h2>
            <ul className="space-y-1">
              {log.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
