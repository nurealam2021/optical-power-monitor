/**
 * API location used by browser-side requests.
 *
 * - Local development defaults to the backend on :8000.
 * - Production defaults to same-origin, where Nginx proxies /api and /health.
 * - NEXT_PUBLIC_API_BASE_URL can explicitly point the frontend at a separate API.
 */
export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "";
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return "";
}
