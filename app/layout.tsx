import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";
import { ConfirmProvider } from "@/app/components/ConfirmDialog";

export const metadata: Metadata = {
  title: "Festival Manager",
  description: "ניהול ותכנון פסטיבלים",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* Prevent flash of unstyled dark mode */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
