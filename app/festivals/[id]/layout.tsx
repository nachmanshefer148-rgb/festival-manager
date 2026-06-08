export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  generateFestivalViewerToken,
  logout,
  saveFestivalViewerAccess,
} from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { formatDate } from "@/lib/utils";
import NavDrawer from "./NavDrawer";
import { NavLink } from "./NavLink";
import FestivalViewerShareButton from "./FestivalViewerShareButton";
import { DarkModeToggle } from "@/app/components/DarkModeToggle";

export default async function FestivalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);
  const { user, festival, isAdmin, canViewBudget, canViewDocuments } = access;

  const nav = [
    { href: "", label: "דשבורד", icon: "🏠" },
    { href: "/artists", label: "אמנים", icon: "🎤" },
    { href: "/schedule", label: "לוח הופעות", icon: "📅", exact: true },
    { href: "/schedule/technical", label: "לוז טכני כללי", icon: "📋", exact: true },
    { href: "/stages", label: "במות", icon: "🎪" },
    { href: "/team", label: "צוות", icon: "👥" },
    { href: "/vendors", label: "ספקים", icon: "🏢" },
    { href: "/booths", label: "דוכנים", icon: "🛒" },
    { href: "/vehicles", label: "רכבים", icon: "🚗" },
    ...(canViewDocuments ? [{ href: "/documents", label: "מסמכים", icon: "📁" }] : []),
    ...(canViewBudget ? [{ href: "/budget", label: "תקציב", icon: "💰" }] : []),
    ...(isAdmin ? [{ href: "/analytics", label: "סטטיסטיקות", icon: "📊" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-violet-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <NavDrawer
            festivalId={id}
            nav={nav}
            isAdmin={isAdmin}
            viewerToken={festival.viewerToken}
            viewerAccessEnabled={festival.viewerAccessEnabled}
            viewerShowBudget={festival.viewerShowBudget}
            viewerShowDocuments={festival.viewerShowDocuments}
            generateFestivalViewerToken={generateFestivalViewerToken}
            saveFestivalViewerAccess={saveFestivalViewerAccess}
          />
          <Link href="/" className="text-violet-200 hover:text-white transition-colors text-sm hidden sm:block shrink-0">
            ← כל הפסטיבלים
          </Link>
          <span className="text-violet-400 hidden sm:block">|</span>
          {festival.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={festival.logoUrl} alt="לוגו פסטיבל" className="h-8 w-8 object-contain rounded shrink-0 bg-white/10 p-0.5" />
          )}
          <div className="min-w-0">
            <span className="font-bold text-base sm:text-lg truncate block">{festival.name}</span>
            <span className="text-violet-200 text-xs hidden md:block">
              {formatDate(festival.startDate)} - {formatDate(festival.endDate)} · {festival.location}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="text-xs font-medium px-2 py-1 rounded-lg hidden sm:block bg-violet-900 text-violet-200">
            {isAdmin ? user?.name : "צפייה מוגבלת"}
          </span>
          <DarkModeToggle />
          <form action={logout}>
            <button type="submit" className="text-violet-200 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-violet-600">
              {isAdmin ? "יציאה" : "סיום צפייה"}
            </button>
          </form>
          {isAdmin && (
            <>
              <Link href={`/festivals/${id}/settings`} className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-violet-600 transition-colors" aria-label="הגדרות פסטיבל" title="הגדרות פסטיבל">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </Link>
              <Link href="/settings" className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-violet-600 transition-colors hidden sm:block" aria-label="הגדרות חשבון" title="הגדרות חשבון">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="hidden lg:flex w-56 flex-col bg-white border-l border-gray-200 py-4 shadow-sm shrink-0">
          {nav.map((item) => (
            <NavLink key={item.href} festivalId={id} href={item.href} icon={item.icon} label={item.label} exact={item.exact} />
          ))}
          {isAdmin && (
            <FestivalViewerShareButton
              festivalId={id}
              viewerToken={festival.viewerToken}
              viewerAccessEnabled={festival.viewerAccessEnabled}
              viewerShowBudget={festival.viewerShowBudget}
              viewerShowDocuments={festival.viewerShowDocuments}
              generateFestivalViewerToken={generateFestivalViewerToken}
              saveFestivalViewerAccess={saveFestivalViewerAccess}
            />
          )}
        </nav>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
