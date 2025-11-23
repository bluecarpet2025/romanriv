// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "romanriv.com",
  description:
    "Roman Rivera's personal site – food, cars, anime, and business experiments.",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/food", label: "Food" },
  { href: "/cars", label: "Cars" },
  { href: "/anime", label: "Anime" },
  { href: "/business", label: "Business" },
  { href: "/discuss", label: "Discuss" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col">
          {/* Top nav */}
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full border border-slate-700 bg-slate-900 text-center text-sm font-semibold leading-8">
                  RR
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  romanriv<span className="text-sky-400">.com</span>
                </span>
              </Link>
              <ul className="flex items-center gap-4 text-sm font-medium">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-full px-3 py-1 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-950/80">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} Roman Rivera</span>
              <span className="text-slate-600">
                Built with Next.js • Personal playground
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
