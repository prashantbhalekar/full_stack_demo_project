import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  raw?: unknown;

  constructor(message: string, status: number, code?: string, raw?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

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

async function parseErrorResponse(
  response: Response,
): Promise<ApiRequestError> {
  const text = await response.text();
  if (!text) {
    return new ApiRequestError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  try {
    const parsed = JSON.parse(text) as {
      message?: string | string[];
      code?: string;
      error?: string;
      statusCode?: number;
    };

    const message = Array.isArray(parsed.message)
      ? parsed.message.join(", ")
      : (parsed.message ??
        parsed.error ??
        `Request failed with status ${response.status}`);

    return new ApiRequestError(message, response.status, parsed.code, parsed);
  } catch {
    return new ApiRequestError(text, response.status);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
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
    throw await parseErrorResponse(response);
  }

  return response.json() as Promise<T>;
}
