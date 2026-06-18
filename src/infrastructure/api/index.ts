// Infrastructure Layer - API Client
// This directory contains API clients, Axios instances, custom fetch wrappers, and headers interceptors.

export const apiClient = {
  get: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(url, { method: 'GET', ...options });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json() as Promise<T>;
  },
  post: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body),
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json() as Promise<T>;
  },
  put: async <T>(url: string, body: unknown, options?: RequestInit): Promise<T> => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body),
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json() as Promise<T>;
  },
  delete: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(url, { method: 'DELETE', ...options });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json() as Promise<T>;
  },
};
