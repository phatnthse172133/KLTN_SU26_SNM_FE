"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { accountService } from "@/application/features/account/accountService";
import { authService } from "@/application/features/auth/authService";
import type { UserProfile } from "@/shared/types";

interface AuthContextType {
  isAuthenticated: boolean;
  isReady: boolean;
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  login: (token: string, refreshToken?: string | null, user?: UserProfile | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");
    if (storedToken) {
      let parsedUser: UserProfile | null = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser) as UserProfile;
        } catch {
          localStorage.removeItem("user");
        }
      }
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(parsedUser);
      setIsAuthenticated(true);
      accountService.getMyAccount()
        .then((response) => {
          if (response.data) {
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
          }
        })
        .catch(() => undefined);
    }
    setIsReady(true);
  }, []);

  const login = (newToken: string, newRefreshToken?: string | null, newUser?: UserProfile | null) => {
    localStorage.setItem("token", newToken);
    if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
    if (newUser) localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setRefreshToken(newRefreshToken ?? null);
    setUser(newUser ?? null);
    setIsAuthenticated(true);
  };

  const refreshUser = async () => {
    const response = await accountService.getMyAccount();
    setUser(response.data ?? null);
    if (response.data) localStorage.setItem("user", JSON.stringify(response.data));
  };

  const logout = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (storedRefreshToken) {
      authService.logout(storedRefreshToken).catch(() => undefined);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isReady, token, refreshToken, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
