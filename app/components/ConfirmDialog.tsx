"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const confirm: ConfirmFn = useCallback((options) => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setState({ options: opts, resolve });
    });
  }, []);

  function handleClose(val: boolean) {
    state?.resolve(val);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10"
            dir="rtl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={state.options.title ? "confirm-title" : undefined}
            aria-describedby="confirm-message"
          >
            {state.options.title && (
              <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
                {state.options.title}
              </h3>
            )}
            <p id="confirm-message" className="text-gray-600 text-sm">
              {state.options.message}
            </p>
            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                ביטול
              </button>
              <button
                autoFocus
                onClick={() => handleClose(true)}
                className={`px-4 py-2 text-sm text-white rounded-xl transition ${
                  state.options.danger
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {state.options.confirmLabel ?? "אישור"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
