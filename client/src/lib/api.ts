const rawApiBase = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = rawApiBase ? rawApiBase.replace(/\/+$/, "") : "";

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withApiPrefix = normalizedPath.startsWith("/api")
    ? normalizedPath
    : `/api${normalizedPath}`;

  if (!API_BASE_URL) {
    return withApiPrefix;
  }

  return `${API_BASE_URL}${withApiPrefix}`;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(input), {
    credentials: "include",
    ...init,
  });
}
