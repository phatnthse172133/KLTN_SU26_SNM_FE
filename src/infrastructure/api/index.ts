import { mapApiError, mapNetworkError, mapTimeoutError, isAppError } from "@/shared/errors/errorMapper";
import { errorMessages } from "@/shared/errors/errorMessages";
import { createAppError } from "@/shared/errors/AppError";
import { DEFAULT_TIMEOUT_MS, safeJsonParse, serializeBody, buildAuthHeaders } from "./apiInternals.mjs";
import { createRequest } from "./requestCore.mjs";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api";

const onUnauthorized = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  const path = window.location.pathname;
  const loginPath = path.startsWith("/admin")
    ? "/admin/login?role=admin"
    : path.startsWith("/boothowner")
      ? "/boothowner/login"
      : "/login";
  const isAlreadyOnLogin = path === "/admin/login" || path === "/boothowner/login" || path === "/login";
  if (!isAlreadyOnLogin) {
    window.location.replace(loginPath);
  }
};

const request = createRequest({
  fetchFn: fetch,
  baseUrl: BASE_URL,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  safeJsonParse,
  buildAuthHeaders,
  mapApiError,
  mapTimeoutError,
  mapNetworkError,
  createAppError,
  errorMessages,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
  onUnauthorized,
});

export const buildQuery = (params: Record<string, string | number | boolean | null | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export { isAppError };

export const apiClient = {
  get: async <T>(url: string, options?: RequestInit): Promise<T> => {
    return request(url, { method: "GET", ...options }) as Promise<T>;
  },
  post: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    return request(url, { method: "POST", body: serializeBody(body), ...options }) as Promise<T>;
  },
  put: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    return request(url, { method: "PUT", body: serializeBody(body), ...options }) as Promise<T>;
  },
  patch: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    return request(url, { method: "PATCH", body: serializeBody(body), ...options }) as Promise<T>;
  },
  delete: async <T>(url: string, options?: RequestInit): Promise<T> => {
    return request(url, { method: "DELETE", ...options }) as Promise<T>;
  },
};
