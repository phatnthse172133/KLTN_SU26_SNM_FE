const getHeaders = (customHeaders?: HeadersInit) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api";

const handleResponse = async <T>(res: Response): Promise<T> => {
  const contentType = res.headers.get("content-type");
  const body = contentType?.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === "object" && body && "message" in body
      ? String((body as { message?: string }).message)
      : `HTTP error! status: ${res.status}`;
    throw new Error(message);
  }

  return body as T;
};

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

export const apiClient = {
  get: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE_URL}${url}`, { 
      method: "GET", 
      ...options,
      headers: getHeaders(options?.headers) 
    });
    return handleResponse<T>(res);
  },
  post: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
      headers: getHeaders(options?.headers),
    });
    return handleResponse<T>(res);
  },
  put: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
      headers: getHeaders(options?.headers),
    });
    return handleResponse<T>(res);
  },
  patch: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
      headers: getHeaders(options?.headers),
    });
    return handleResponse<T>(res);
  },
  delete: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE_URL}${url}`, { 
      method: "DELETE", 
      ...options,
      headers: getHeaders(options?.headers),
    });
    return handleResponse<T>(res);
  },
};
