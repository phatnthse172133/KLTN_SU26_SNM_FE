"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { boothService } from "@/application/features/booth/boothService";
import type { Booth } from "@/shared/types";

interface BoothContextType {
  selectedBooth: Booth | null;
  booths: Booth[];
  setSelectedBooth: (booth: Booth | null) => void;
  loading: boolean;
  refreshBooths: () => Promise<void>;
}

const BoothContext = createContext<BoothContextType | undefined>(undefined);

export function BoothProvider({ children }: { children: ReactNode }) {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshBooths() {
    setLoading(true);
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      setBooths([]);
      setSelectedBooth(null);
      setLoading(false);
      return;
    }
    try {
      const res = await boothService.getMyBooths();
      // The Booth Owner endpoint returns one owned booth, not a paged collection.
      const boothList = res.data ? [res.data] : [];
      setBooths(boothList);
      setSelectedBooth((current) => boothList.find((booth) => booth.id === current?.id) ?? boothList[0] ?? null);
    } catch {
      setBooths([]);
      setSelectedBooth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshBooths();
  }, []);

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
