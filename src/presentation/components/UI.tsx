import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]", className)} {...props}>
      {children}
    </div>
  );
}

export function Button({ 
  className, 
  variant = "primary", 
  size = "md",
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: "primary" | "secondary" | "danger" | "danger-outline" | "ghost",
  size?: "sm" | "md" | "lg"
}) {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent",
    secondary: "bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50",
    danger: "bg-red-500 text-white hover:bg-red-600 border border-transparent",
    "danger-outline": "bg-white text-red-500 border border-red-500 hover:bg-red-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ 
  className, 
  variant = "gray", 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLSpanElement> & { 
  variant?: "green" | "amber" | "indigo" | "red" | "blue" | "gray" | "orange" | "yellow"
}) {
  const variants = {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    indigo: "bg-indigo-100 text-indigo-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
    orange: "bg-orange-100 text-orange-800",
    yellow: "bg-yellow-100 text-yellow-800"
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
}

export function Toggle({ 
  checked, 
  onChange 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void 
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        checked ? "bg-indigo-600" : "bg-gray-200"
      )}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
