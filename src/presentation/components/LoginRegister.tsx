"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Store } from "lucide-react";
import { useAuth } from "@/application/context/AuthContext";
import { authService } from "@/application/features/auth/authService";
import { getErrorMessage } from "@/shared/errors/errorMapper";

export function LoginRegister() {
  const pathname = usePathname();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const portalName = pathname?.startsWith("/admin") ? "Admin Portal" : "Booth Owner Portal";

  const getLandingPath = (role?: string | null) => {
    const normalizedRole = role?.replace(/[_\s-]/g, "").toLowerCase();
    if (normalizedRole === "admin") return "/admin";
    if (normalizedRole === "boothowner") return "/boothowner";
    if (normalizedRole === "marketowner") return "/marketowner";
    return "/boothowner/login";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (!response.data?.accessToken) {
        setError("Login failed. Please check your email and password.");
        return;
      }
      login(response.data.accessToken, response.data.refreshToken, response.data.user);
      const role = response.data.user?.role ?? response.data.role;
      const normalizedRole = role?.replace(/[_\s-]/g, "").toLowerCase();
      router.replace(normalizedRole === "boothowner" && response.data.user?.mustChangePassword
        ? "/boothowner/change-password"
        : getLandingPath(role));
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4F46E5]"><Store className="h-8 w-8 text-white" /></div></div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Smart Night Market</h1>
        <p className="mt-2 text-center text-sm text-slate-500">{portalName}</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="relative mt-1 rounded-md shadow-sm"><Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="block w-full appearance-none rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-[#4F46E5]" /></div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1 rounded-md shadow-sm"><Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="block w-full appearance-none rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-[#4F46E5]" /></div>
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-md border border-transparent bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in"}{!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
