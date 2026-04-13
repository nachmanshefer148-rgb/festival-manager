export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getRole } from "@/lib/auth";
import { logout } from "@/app/actions";
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
  const [festival, role, settings] = await Promise.all([
    prisma.festival.findUnique({ where: { id } }),
    getRole(),
    prisma.appSettings.findUnique({ where: { id: "global" } }),
  ]);
  if (!festival) notFound();

  const showBudget = role !== "limited" || (settings?.showBudget ?? true);

  const NAV = [
    { href: "", label: "דשבורד", icon: "🏠" },
    { href: "/artists", label: "אמנים", icon: "🎤" },
    { href: "/schedule", label: "לוח זמנים", icon: "📅" },
    { href: "/stages", label: "במות", icon: "🎪" },
    { href: "/team", label: "צוות", icon: "👥" },
    { href: "/vendors", label: "ספקים", icon: "🏢" },
    ...(role !== "limited" ? [{ href: "/documents", label: "מסמכים", icon: "📁" }] : []),
    ...(showBudget ? [{ href: "/budget", label: "תקציב", icon: "💰" }] : []),
  ];

  const roleLabel =
    role === "admin" ? "מנהל" : role === "viewer" ? "צופה" : "צופה מוגבל";
  const roleBg =
    role === "admin"
      ? "bg-violet-900 text-violet-200"
      : role === "viewer"
      ? "bg-blue-800 text-blue-200"
      : "bg-gray-700 text-gray-300";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-violet-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Hamburger — mobile only */}
          <NavDrawer festivalId={id} nav={NAV} />

          <Link href="/" className="text-violet-200 hover:text-white transition-colors text-sm hidden sm:block shrink-0">
            ← כל הפסטיבלים
          </Link>
          <span className="text-violet-400 hidden sm:block">|</span>

          <div className="min-w-0">
            <span className="font-bold text-base sm:text-lg truncate block">{festival.name}</span>
            <span className="text-violet-200 text-xs hidden md:block">
              {formatDate(festival.startDate)} – {formatDate(festival.endDate)} · {festival.location}
            </span>
          </div>
        </div>

        {/* Auth bar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-lg hidden sm:block ${roleBg}`}>
            {roleLabel}
          </span>
          {role !== "limited" ? (
            <form action={logout}>
              <button type="submit" className="text-violet-200 hover:text-white text-xs transition-colors">
                יציאה
              </button>
            </form>
          ) : (
            <Link href="/login" className="text-violet-200 hover:text-white text-xs transition-colors">
              כניסה
            </Link>
          )}
          {role === "admin" && (
            <Link href="/settings" className="text-violet-200 hover:text-white text-xs transition-colors" aria-label="הגדרות">
              ⚙️
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only */}
        <nav className="hidden lg:flex w-48 bg-white border-l border-gray-200 flex-col py-4 shadow-sm shrink-0">
          {NAV.map((item) => (
            <NavLink key={item.href} festivalId={id} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>


        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
