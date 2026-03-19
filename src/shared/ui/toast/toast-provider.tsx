"use client";

import { createContext, useContext, useMemo, useState } from "react";
import styles from "./toast-provider.module.css";

type ToastKind = "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const value = useMemo(
    () => ({
      showToast: (message: string, kind: ToastKind = "success") => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, kind }]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 2500);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container}>
        {toasts.map((item) => (
          <div key={item.id} className={styles[item.kind]}>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
