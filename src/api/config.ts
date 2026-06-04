// Centralized API base URL.
export const API_BASE_URL = "https://capstone-flask-backend-me02.onrender.com";

if (!API_BASE_URL) {
  // Warn but don't throw here — some dev setups may provide env later.
  console.warn(
    "API_BASE_URL is empty. Ensure /config.json is served and index.html fetches it before app bootstrap, or set VITE_API_BASE_URL at build time.",
  );
}
