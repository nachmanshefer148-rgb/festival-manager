"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FestivalViewerShareButton from "./FestivalViewerShareButton";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

export default function NavDrawer({
  festivalId,
  nav,
  isAdmin = false,
  viewerToken = null,
  viewerAccessEnabled = false,
  viewerShowBudget = false,
  viewerShowDocuments = false,
  generateFestivalViewerToken,
  saveFestivalViewerAccess,
}: {
  festivalId: string;
  nav: NavItem[];
  isAdmin?: boolean;
  viewerToken?: string | null;
  viewerAccessEnabled?: boolean;
  viewerShowBudget?: boolean;
  viewerShowDocuments?: boolean;
  generateFestivalViewerToken?: (festivalId: string) => Promise<string>;
  saveFestivalViewerAccess?: (festivalId: string, formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden text-white p-2 rounded-lg hover:bg-violet-600 transition-colors"
        aria-label="פתח תפריט"
        aria-expanded={open}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניווט"
      >
        {/* Drawer header */}
        <div className="bg-violet-700 px-4 py-4 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">תפריט</span>
          <button
            onClick={() => setOpen(false)}
            className="text-violet-200 hover:text-white transition-colors"
            aria-label="סגור תפריט"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col py-2 flex-1">
          {nav.map((item) => {
            const fullHref = `/festivals/${festivalId}${item.href}`;
            const isActive = item.exact
              ? pathname === fullHref
              : item.href === ""
                ? pathname === `/festivals/${festivalId}`
                : pathname.startsWith(fullHref);

            return (
              <Link
                key={item.href}
                href={fullHref}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 transition-colors text-sm font-medium border-r-2 ${
                  isActive
                    ? "bg-violet-50 text-violet-700 border-violet-600"
                    : "text-gray-700 hover:bg-violet-50 hover:text-violet-700 border-transparent"
                }`}
              >
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAdmin && generateFestivalViewerToken && saveFestivalViewerAccess && (
          <div className="border-t border-gray-200 p-3">
            <FestivalViewerShareButton
              compact
              festivalId={festivalId}
              viewerToken={viewerToken}
              viewerAccessEnabled={viewerAccessEnabled}
              viewerShowBudget={viewerShowBudget}
              viewerShowDocuments={viewerShowDocuments}
              generateFestivalViewerToken={generateFestivalViewerToken}
              saveFestivalViewerAccess={saveFestivalViewerAccess}
              onDone={() => setOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}
