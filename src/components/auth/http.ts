// Centralized fetch wrapper with 401 interception
// Lightweight logout event bus (inlined to avoid resolution issues)
const logoutEvent = {
  dispatch() {
    window.dispatchEvent(new Event("app-logout"));
  },
  on(handler: () => void) {
    window.addEventListener("app-logout", handler);
    return () => window.removeEventListener("app-logout", handler);
  },
};

export type HttpOptions = RequestInit & { authToken?: string; raw?: boolean };

export async function http(url: string, options: HttpOptions = {}) {
  const { authToken, raw, headers, ...rest } = options;
  const mergedHeaders: Record<string, string> = {
    ...(headers as any),
  };
  if (authToken) {
    mergedHeaders["Authorization"] = `Bearer ${authToken}`;
  }
  if (!(rest.body instanceof FormData) && !("Content-Type" in mergedHeaders)) {
    mergedHeaders["Content-Type"] = "application/json";
  }
  const response = await fetch(url, { ...rest, headers: mergedHeaders });
  if (response.status === 401 || response.status === 403) {
    // Broadcast logout intent; AuthProvider listens (optional future enhancement)
    logoutEvent.dispatch();
  }
  if (raw) return response;
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    return { error: true, status: response.status, data };
  }
  return data;
}
