// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "romanriv.com",
  description: "Roman Rivera's personal playground.",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/food", label: "Food" },
  { href: "/cars", label: "Cars" },
  { href: "/anime", label: "Anime" },
  { href: "/Projects", label: "Projects" },
  { href: "/discuss", label: "Discuss" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col">
          {/* NAVBAR */}
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4">
              {/* Logo + title */}
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src="/rr-logo.png"
                    alt="RR Logo"
                    fill
                    className="rounded-full object-contain"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xl font-semibold tracking-tight">
                    romanriv<span className="text-sky-400">.com</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Food • Cars • Anime • Projects
                  </span>
                </div>
              </Link>

              {/* Nav links */}
              <ul className="flex list-none flex-wrap items-center justify-end gap-5 text-xs font-medium text-slate-200 sm:text-sm">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-full px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          {/* MAIN CONTENT – 4xl, pages can be narrower inside */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-4xl px-4 py-10">
              {children}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-800 bg-slate-950/90">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} Roman Rivera</span>
              <span className="text-slate-600">Built with Next.js</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
