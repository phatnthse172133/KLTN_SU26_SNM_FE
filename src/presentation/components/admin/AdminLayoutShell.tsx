"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/application/context/AuthContext";
import { Sidebar } from "@/presentation/components/admin/Sidebar";
import { Header } from "@/presentation/components/admin/Header";

const normalizeRole = (role?: string | null) => role?.replace(/[_\s-]/g, "").toLowerCase();

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady, user } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !user) {
      router.replace("/login?role=admin");
      return;
    }
    const role = normalizeRole(user?.role);
    if (role !== "admin") {
      if (role === "boothowner") router.replace("/boothowner");
      else if (role === "marketowner") router.replace("/marketowner");
      else router.replace("/login");
    }
  }, [isAuthenticated, isReady, router, user]);

  const role = normalizeRole(user?.role);
  if (!isReady || !isAuthenticated || !user || role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm font-medium text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
