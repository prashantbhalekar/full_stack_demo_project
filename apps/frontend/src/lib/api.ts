import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean;
};

async function doFetch(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await doFetch(path, options);

  if (response.status === 401 && options.auth) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshResponse = await doFetch("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        saveTokens(data.accessToken, data.refreshToken);
        response = await doFetch(path, options);
      } else {
        clearTokens();
      }
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
