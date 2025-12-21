// src/app/admin/photos/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "car", label: "Cars" },
  { value: "anime", label: "Anime" },
  { value: "business", label: "Business / Projects" },
];

type UploadStatus = "idle" | "uploading" | "done" | "error";

const linkBase =
  "inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/70 hover:text-white";

const linkPrimary =
  "inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-500";

export default function AdminPhotosPage() {
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
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const originalName = file.name;
      const ext = originalName.split(".").pop() || "jpg";
      const baseName = originalName.replace(/\.[^/.]+$/, "");

      const timestamp = Date.now();
      const safeBase = baseName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");
      const path = `${category}/${timestamp}-${safeBase}.${ext}`;

      messages.push(`Uploading ${originalName} → ${path} ...`);
      setLog([...messages]);

      try {
        const { data: storageData, error: storageError } =
          await supabase.storage.from("media").upload(path, file);

        if (storageError) {
          messages.push(
            `❌ ${originalName}: storage upload failed – ${storageError.message}`
          );
          setLog([...messages]);
          continue;
        }

        const imagePath = storageData?.path ?? path;

        const { error: insertError } = await supabase.from("photos").insert({
          category,
          title: baseName,
          description: "",
          image_path: imagePath,
          tags: [],
        });

        if (insertError) {
          messages.push(
            `⚠️ ${originalName}: uploaded, but DB insert failed – ${insertError.message}`
          );
        } else {
          messages.push(`✅ ${originalName}: uploaded and saved`);
        }
      } catch (err: any) {
        messages.push(
          `❌ ${originalName}: unexpected error – ${err?.message ?? String(err)}`
        );
      }

      setLog([...messages]);
    }

    setStatus("done");
  };

  return (
    <div className="page-shell-wide">
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Photo uploader
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Bulk upload food and car photos into the Supabase{" "}
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

        {/* Quick links (uniform button style) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className={linkBase} href="/admin">
            Admin home
          </Link>
          <Link className={linkPrimary} href="/admin/photos/manage">
            Manage photos
          </Link>
        </div>
      </header>

      <section className="card mt-4 space-y-4">
        <form onSubmit={handleUpload} className="space-y-4">
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

          <button
            type="submit"
            disabled={status === "uploading"}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "uploading" ? "Uploading..." : "Upload to Supabase"}
          </button>
        </form>

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
