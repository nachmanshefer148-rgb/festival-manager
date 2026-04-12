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
