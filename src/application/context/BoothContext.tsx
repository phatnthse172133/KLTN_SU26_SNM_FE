"use client";
import { createContext, useCallback, useContext, useState, ReactNode, useEffect } from "react";
import { boothService } from "@/application/features/booth/boothService";
import { useAuth } from "@/application/context/AuthContext";
import type { Booth } from "@/shared/types";

interface BoothContextType {
  selectedBooth: Booth | null;
  booths: Booth[];
  setSelectedBooth: (booth: Booth | null) => void;
  loading: boolean;
  refreshBooths: () => Promise<void>;
}

const BoothContext = createContext<BoothContextType | undefined>(undefined);
const normalizeRole = (role?: string | null) => role?.replace(/[_\s-]/g, "").toLowerCase();

export function BoothProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBooths = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    if (!isAuthenticated || normalizeRole(user?.role) !== "boothowner") {
      setBooths([]);
      setSelectedBooth(null);
      setLoading(false);
      return;
    }
    try {
      const res = await boothService.getMyBooths();
      const boothList = res.data ? [res.data] : [];
      setBooths(boothList);
      setSelectedBooth((current) => boothList.find((booth) => booth.id === current?.id) ?? boothList[0] ?? null);
    } catch {
      setBooths([]);
      setSelectedBooth(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isReady, user?.role]);

  useEffect(() => {
    if (!isReady) return;
    void Promise.resolve().then(refreshBooths);
  }, [isReady, refreshBooths]);

  return (
    <BoothContext.Provider value={{ selectedBooth, booths, setSelectedBooth, loading, refreshBooths }}>
      {children}
    </BoothContext.Provider>
  );
}

export function useBooth() {
  const context = useContext(BoothContext);
  if (!context) {
    throw new Error("useBooth must be used within a BoothProvider");
  }
  return context;
}
