"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  festivalId,
  href,
  icon,
  label,
}: {
  festivalId: string;
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const fullHref = `/festivals/${festivalId}${href}`;
  const isActive =
    href === ""
      ? pathname === `/festivals/${festivalId}`
      : pathname.startsWith(fullHref);

  return (
    <Link
      href={fullHref}
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors text-sm font-medium border-l-2 ${
        isActive
          ? "bg-violet-50 text-violet-700 border-violet-600"
          : "text-gray-700 hover:bg-violet-50 hover:text-violet-700 border-transparent"
      }`}
    >
      <span className="text-base" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}
