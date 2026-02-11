const rawApiBase = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = rawApiBase ? rawApiBase.replace(/\/+$/, "") : "";
const AUTH_TOKEN_KEY = "petcrushes_token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (!token) localStorage.removeItem(AUTH_TOKEN_KEY);
  else localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withApiPrefix = normalizedPath.startsWith("/api") ? normalizedPath : `/api${normalizedPath}`;
  return API_BASE_URL ? `${API_BASE_URL}${withApiPrefix}` : withApiPrefix;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? {});
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(apiUrl(input), {
    ...init,
    headers,
  });
}
