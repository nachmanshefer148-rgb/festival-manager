export const dynamic = "force-dynamic";
import Link from "next/link";
import { logout } from "@/app/actions";
import { requireOwnedFestivalPage } from "@/lib/access";
import { formatDate } from "@/lib/utils";
import NavDrawer from "./NavDrawer";
import { NavLink } from "./NavLink";

export default async function FestivalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, festival } = await requireOwnedFestivalPage(id);

  const nav = [
    { href: "", label: "דשבורד", icon: "🏠" },
    { href: "/artists", label: "אמנים", icon: "🎤" },
    { href: "/schedule", label: "לוח זמנים", icon: "📅" },
    { href: "/stages", label: "במות", icon: "🎪" },
    { href: "/team", label: "צוות", icon: "👥" },
    { href: "/vendors", label: "ספקים", icon: "🏢" },
    { href: "/documents", label: "מסמכים", icon: "📁" },
    { href: "/budget", label: "תקציב", icon: "💰" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-violet-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <NavDrawer festivalId={id} nav={nav} />
          <Link href="/" className="text-violet-200 hover:text-white transition-colors text-sm hidden sm:block shrink-0">
            ← כל הפסטיבלים
          </Link>
          <span className="text-violet-400 hidden sm:block">|</span>
          <div className="min-w-0">
            <span className="font-bold text-base sm:text-lg truncate block">{festival.name}</span>
            <span className="text-violet-200 text-xs hidden md:block">
              {formatDate(festival.startDate)} - {formatDate(festival.endDate)} · {festival.location}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs font-medium px-2 py-1 rounded-lg hidden sm:block bg-violet-900 text-violet-200">
            {user.name}
          </span>
          <form action={logout}>
            <button type="submit" className="text-violet-200 hover:text-white text-xs transition-colors">
              יציאה
            </button>
          </form>
          <Link href="/settings" className="text-violet-200 hover:text-white text-xs transition-colors" aria-label="הגדרות">
            ⚙️
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="hidden lg:flex w-48 bg-white border-l border-gray-200 flex-col py-4 shadow-sm shrink-0">
          {nav.map((item) => (
            <NavLink key={item.href} festivalId={id} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
