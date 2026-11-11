import { createApiClient } from "@attractory/api-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://localhost:4000/api/v1";

function apiBaseUrl(): string {
  let baseUrl = API_BASE_URL;

  if (typeof window !== "undefined") {
    const api = new URL(API_BASE_URL);
    const localHosts = new Set(["localhost", "127.0.0.1"]);
    if (localHosts.has(window.location.hostname) && localHosts.has(api.hostname)) {
      api.hostname = window.location.hostname;
      baseUrl = api.toString().replace(/\/+$/, "");
    }
  }

  return baseUrl;
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const apiClient = createApiClient(apiBaseUrl);

export function courseImageUrl(path: string): string {
  if (!path.startsWith("/uploads/")) return path;
  return new URL(path, `${new URL(apiUrl("/")).origin}/`).toString();
}
