"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, Store, User } from "lucide-react";
import { useAuth } from "@/application/context/AuthContext";
import { authService } from "@/application/features/auth/authService";

export function LoginRegister() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams?.get("tab") !== "register");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const getLandingPath = (role?: string | null) => {
    const normalizedRole = role?.replace(/[_\s-]/g, "").toLowerCase();
    if (normalizedRole === "admin") return "/admin";
    if (normalizedRole === "boothowner") return "/boothowner";
    return "/login";
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
      if (isLogin) {
        const response = await authService.login({ email, password });
        if (!response.data?.accessToken) {
          setError("Login failed. Please try again.");
          return;
        }
        login(response.data.accessToken, response.data.refreshToken, response.data.user);
        router.replace(getLandingPath(response.data.user?.role ?? response.data.role));
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const response = await authService.registerBoothOwner({
        userName,
        fullName,
        email,
        password,
        confirmPassword,
      });
      setMessage(response.message || "Registration submitted. Please verify your email before signing in.");
      setIsLogin(true);
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
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
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Username</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="userName"
                      type="text"
                      required
                      minLength={3}
                      value={userName}
                      onChange={(event) => setUserName(event.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

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
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                  />
                </div>
              </div>
            )}

            {message && <p className="text-emerald-600 text-sm font-medium">{message}</p>}
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4F46E5] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-colors disabled:opacity-60"
            >
              {loading ? "Processing..." : (isLogin ? "Sign in" : "Register booth owner")}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                resetFeedback();
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-colors"
            >
              {isLogin ? "Register a booth owner account" : "Sign in to existing account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
