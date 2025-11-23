// components/SectionCard.tsx
import Link from "next/link";
import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description: string;
  href: string;
  badge?: string;
  children?: ReactNode;
}

export function SectionCard({
  title,
  description,
  href,
  badge,
  children,
}: SectionCardProps) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 section-subtitle">{description}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
            {badge}
          </span>
        )}
      </div>
      {children}
      <div className="mt-2">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          Explore &rarr;
        </Link>
      </div>
    </div>
  );
}
