// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "romanriv.com",
  description: "Roman's personal playground.",
   icons: {
    icon: "/icon.png",
    },
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/food", label: "Food" },
  { href: "/cars", label: "Cars" },
  { href: "/anime", label: "Anime" },
  { href: "/business", label: "Projects" },
  //{ href: "/discuss", label: "Discuss" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                  src="/rr-logo.png"   // <— updated here
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
