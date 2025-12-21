import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServer } from "@/lib/supabaseAuth";

export const metadata: Metadata = {
  title: "romanriv.com",
  description: "Roman Rivera's personal playground.",
  icons: {
    icon: "/icon-32.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/maskable-icon-512.png",
      },
    ],
  },
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/food", label: "Food" },
  { href: "/cars", label: "Cars" },
  { href: "/anime", label: "Anime" },
  { href: "/business", label: "Projects" },
];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check (createSupabaseServer returns a Promise in your project)
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdmin = Boolean(session);

  return (
    <html lang="en">
      <body>
        {/* Top navbar */}
        <header className="top-nav">
          <nav className="top-nav-inner">
            <Link href="/" className="top-nav-logo">
              <div
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                }}
              >
                <Image
                  src="/rr-logo.png"
                  alt="RR Logo"
                  fill
                  className="rounded-full"
                />
              </div>
              <div>
                <div className="top-nav-title">
                  romanriv
                  <span className="top-nav-title-accent">.com</span>
                </div>
                <div className="top-nav-subtitle">
                  Food • Cars • Anime • Projects
                </div>
              </div>
            </Link>

            <ul className="top-nav-links">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}

              {/* Admin link – visible ONLY when logged in */}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className="font-semibold text-sky-400 hover:text-sky-300"
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </header>

        {/* Page content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <span>© {new Date().getFullYear()} Roman Rivera</span>
            <span>Built with Next.js • Personal playground</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
