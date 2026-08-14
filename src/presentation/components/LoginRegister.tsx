"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Store } from "lucide-react";
import { useAuth } from "@/application/context/AuthContext";
import { authService } from "@/application/features/auth/authService";
import { getErrorMessage } from "@/shared/errors/errorMapper";

export function LoginRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const getLandingPath = (role?: string | null) => {
    const normalizedRole = role?.replace(/[_\s-]/g, "").toLowerCase();
    if (normalizedRole === "admin") return "/admin";
    if (normalizedRole === "boothowner") return "/boothowner";
    if (normalizedRole === "marketowner") return "/marketowner";
    return "/boothowner/login";
  };

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (!response.data?.accessToken) {
        setError("Login failed. Please try again.");
        return;
      }
      login(response.data.accessToken, response.data.refreshToken, response.data.user);
      const normalizedRole = (response.data.user?.role ?? response.data.role)?.replace(/[_\s-]/g, "").toLowerCase();
      router.replace(normalizedRole === "boothowner" && response.data.user?.mustChangePassword ? "/boothowner/change-password" : getLandingPath(response.data.user?.role ?? response.data.role));
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-[#4F46E5] rounded-xl flex items-center justify-center">
            <Store className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Smart Night Market</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                />
              </div>
            </div>

            {message && <p className="text-emerald-600 text-sm font-medium">{message}</p>}
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4F46E5] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
