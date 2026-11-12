import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Check, TriangleAlert, X } from "lucide-react";

import { useT } from "../lib/i18n";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const t = useT();

  const notify = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-8"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-fade-up pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-white/10 bg-ink-800/95 px-4 py-3 text-sm shadow-2xl shadow-black/60 backdrop-blur"
          >
            <span
              className={
                toast.tone === "error"
                  ? "text-ember"
                  : toast.tone === "info"
                    ? "text-gold"
                    : "text-emerald-400"
              }
            >
              {toast.tone === "error" ? <TriangleAlert size={16} /> : <Check size={16} />}
            </span>
            <span className="text-cream/90">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-1 rounded p-1 text-muted transition hover:text-cream"
              aria-label={t("toast.dismiss")}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}