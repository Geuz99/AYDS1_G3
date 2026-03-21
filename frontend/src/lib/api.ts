type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

const normalizeBaseUrl = (url: string): string => {
  const trimmed = url.replace(/\/+$/, "");

  if (trimmed.endsWith("/api")) {
    return `${trimmed}/`;
  }

  return `${trimmed}/api/`;
};

export const API_BASE_URL = normalizeBaseUrl(rawBaseUrl);

let authToken: string | null = null;
let tokenProvider: (() => string | null) | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const setTokenProvider = (provider: (() => string | null) | null): void => {
  tokenProvider = provider;
};

const resolveToken = (): string | null => {
  if (typeof tokenProvider === "function") {
    return tokenProvider();
  }

  return authToken;
};

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = resolveToken();
  const cleanEndpoint = endpoint.replace(/^\/+/, "");

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache || "no-store",
  });

  if (!response.ok) {
    let details: unknown = null;

    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        details,
      }),
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
