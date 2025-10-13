// Centralized API base URL.
const winEnv = (typeof window !== "undefined" && (window as any)._env_) || {};
export const API_BASE_URL: string = (winEnv.VITE_API_BASE_URL ||
  winEnv.API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.API_BASE_URL ||
  "") as string;

if (!API_BASE_URL) {
  // Warn but don't throw here — some dev setups may provide env later.
  console.warn(
    "API_BASE_URL is empty. Ensure /config.json is served and index.html fetches it before app bootstrap, or set VITE_API_BASE_URL at build time."
  );
}
