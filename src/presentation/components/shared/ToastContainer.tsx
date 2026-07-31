"use client";

import React from "react";
import { useToast } from "./ToastContext";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const toastStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: "#F0FDF4",
    border: "#86EFAC",
    text: "#166534",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  error: {
    bg: "#FEF2F2",
    border: "#FCA5A5",
    text: "#991B1B",
    icon: <AlertCircle className="w-5 h-5" />,
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FCD34D",
    text: "#92400E",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  info: {
    bg: "#EFF6FF",
    border: "#93C5FD",
    text: "#1E40AF",
    icon: <Info className="w-5 h-5" />,
  },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type] ?? toastStyles.info;
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-[300px] max-w-[400px] transition-all duration-300"
            style={{
              background: style.bg,
              borderColor: style.border,
              color: style.text,
              opacity: toast.visible ? 1 : 0,
              transform: toast.visible ? "translateX(0)" : "translateX(100%)",
            }}
            role="alert"
          >
            <span className="flex-shrink-0">{style.icon}</span>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: style.text }}
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
