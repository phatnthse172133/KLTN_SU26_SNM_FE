"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  visible: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastRef = useRef<{ type: ToastType; message: string } | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    clearAllTimers();
    lastToastRef.current = null;
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearAllTimers]);

  const showToast = useCallback((type: ToastType, message: string) => {
    if (
      lastToastRef.current &&
      lastToastRef.current.type === type &&
      lastToastRef.current.message === message
    ) {
      return;
    }
    lastToastRef.current = { type, message };

    clearAllTimers();

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts([{ id, type, message, visible: true }]);

    timerRef.current = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );
      animationTimerRef.current = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        lastToastRef.current = null;
        timerRef.current = null;
        animationTimerRef.current = null;
      }, 300);
    }, 3000);
  }, [clearAllTimers]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
