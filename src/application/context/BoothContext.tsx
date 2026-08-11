"use client";
import { createContext, useCallback, useContext, useState, ReactNode, useEffect } from "react";
import { boothService } from "@/application/features/booth/boothService";
import { useAuth } from "@/application/context/AuthContext";
import type { Booth } from "@/shared/types";
import { getErrorMessage, isAppError } from "@/shared/errors/errorMapper";

interface BoothContextType {
  selectedBooth: Booth | null;
  booths: Booth[];
  setSelectedBooth: (booth: Booth | null) => void;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refreshBooths: () => Promise<void>;
}

const BoothContext = createContext<BoothContextType | undefined>(undefined);
const normalizeRole = (role?: string | null) => role?.replace(/[_\s-]/g, "").toLowerCase();

export function BoothProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const refreshBooths = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);
    setNotFound(false);
    if (!isAuthenticated || normalizeRole(user?.role) !== "boothowner" || user?.mustChangePassword) {
      setBooths([]);
      setSelectedBooth(null);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      const res = await boothService.getMyBooths();
      const boothList = res.data ? [res.data] : [];
      setBooths(boothList);
      setSelectedBooth((current) => boothList.find((booth) => booth.id === current?.id) ?? boothList[0] ?? null);
    } catch (boothError) {
      setBooths([]);
      setSelectedBooth(null);
      // A 404 means the account has not been provisioned with a Booth yet;
      // other failures must be shown as an API error instead of an empty state.
      // Keep the distinction in context so every Booth Owner screen can render
      // an actionable message consistently.
      setNotFound(isAppError(boothError) && boothError.status === 404);
      setError(getErrorMessage(boothError));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isReady, user?.role]);

  useEffect(() => {
    if (!isReady) return;
    void Promise.resolve().then(refreshBooths);
  }, [isReady, refreshBooths]);

  return (
    <BoothContext.Provider value={{ selectedBooth, booths, setSelectedBooth, loading, error, notFound, refreshBooths }}>
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
