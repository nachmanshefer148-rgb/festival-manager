"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="w-7 h-7" />;

  return (
    <button
      onClick={toggle}
      className={`p-1.5 rounded-lg transition-colors text-violet-200 hover:text-white hover:bg-violet-600 ${className}`}
      aria-label={dark ? "עבור למצב בהיר" : "עבור למצב כהה"}
      title={dark ? "מצב בהיר" : "מצב כהה"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
