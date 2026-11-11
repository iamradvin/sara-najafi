import "server-only";

const API_BASE_URL =
  process.env.INTERNAL_API_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:4000/api/v1";

export function serverApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
