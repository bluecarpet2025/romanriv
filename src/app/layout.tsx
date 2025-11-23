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
        {/* Full-page background */}
        <div className="flex min-h-screen flex-col">
          {/* Sticky top nav with centered content, like Kiori */}
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              {/* Logo / title */}
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold">
                  RR
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-semibold tracking-tight">
                    romanriv<span className="text-sky-400">.com</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Food • Cars • Anime • Projects
                  </span>
                </div>
              </Link>

              {/* Tabs */}
              <ul className="hidden items-center gap-7 text-sm font-medium text-slate-200 md:flex">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-full px-3 py-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Simple fallback for very small screens */}
              <div className="flex items-center gap-2 md:hidden">
                <span className="text-xs text-slate-400">
                  Menu: Home • Food • Cars • Anime • Business • Discuss
                </span>
              </div>
            </nav>
          </header>

          {/* Centered content container */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-10">
              {children}
            </div>
          </main>

          {/* Footer, also centered like Kiori */}
          <footer className="border-t border-slate-800 bg-slate-950/90">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-slate-500">
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
