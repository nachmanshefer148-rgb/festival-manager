"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  type?: ToastType;
  action?: ToastAction;
  duration?: number; // milliseconds; -1 = persistent until dismissed
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, typeOrOptions?: ToastType | ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: "bg-emerald-600", icon: <CheckCircle size={16} aria-hidden /> },
  error:   { bg: "bg-red-600",     icon: <XCircle size={16} aria-hidden /> },
  info:    { bg: "bg-blue-600",    icon: <Info size={16} aria-hidden /> },
  warning: { bg: "bg-amber-500",   icon: <AlertTriangle size={16} aria-hidden /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, typeOrOptions?: ToastType | ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    let type: ToastType = "success";
    let action: ToastAction | undefined;
    let duration = 3500;

    if (typeof typeOrOptions === "string") {
      type = typeOrOptions;
    } else if (typeOrOptions) {
      type = typeOrOptions.type ?? "success";
      action = typeOrOptions.action;
      duration = typeOrOptions.duration ?? 3500;
    }

    // errors persist until manually dismissed
    if (type === "error") duration = -1;

    setToasts((prev) => [...prev, { id, message, type, action, duration }]);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none"
        dir="rtl"
        aria-live="assertive"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const { bg, icon } = STYLES[t.type];
          return (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              className={`flex items-center gap-2 pl-2 pr-3 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto ${bg} animate-in slide-in-from-bottom-2 duration-200`}
            >
              <span className="shrink-0">{icon}</span>
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                  className="shrink-0 underline underline-offset-2 text-white/90 hover:text-white text-xs font-semibold ml-1"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
                aria-label="סגור"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
