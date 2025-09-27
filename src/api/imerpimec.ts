import {
  IMERPIMEC,
  CreateIMERPIMECPayload,
  UpdateIMERPIMECPayload,
} from "../types/imerpimec";

const API_URL = "http://127.0.0.1:5000/imerpimec"; // Matches blueprint url_prefix

async function jsonOrText(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createIMERPIMEC(
  data: CreateIMERPIMECPayload,
  token: string
) {
  try {
    const res = await fetch(`${API_URL}/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    const body = await jsonOrText(res);
    if (!res.ok) return { error: (body as any)?.error || res.statusText };
    return body; // Currently { message: 'IMERPIMEC X created successfully' }
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}

export async function getIMERPIMECById(
  id: number,
  token: string
): Promise<IMERPIMEC | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: authHeaders(token),
    });
    const body = await jsonOrText(res);
    if (!res.ok) return { error: (body as any)?.error || res.statusText };
    return body as IMERPIMEC;
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}

export interface PaginatedIMERPIMECResponse {
  imerpimecs: IMERPIMEC[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
  error?: string;
}

export async function getAllIMERPIMECs(
  token: string,
  page = 1
): Promise<PaginatedIMERPIMECResponse> {
  try {
    const res = await fetch(`${API_URL}/?page=${page}`, {
      headers: authHeaders(token),
    });
    const body = await jsonOrText(res);
    if (!res.ok) {
      return {
        imerpimecs: [],
        total: 0,
        pages: 0,
        current_page: page,
        per_page: 0,
        error: (body as any)?.error || res.statusText,
      };
    }
    return body as PaginatedIMERPIMECResponse;
  } catch (e: any) {
    return {
      imerpimecs: [],
      total: 0,
      pages: 0,
      current_page: page,
      per_page: 0,
      error: e.message || "Network error",
    };
  }
}

export async function updateIMERPIMEC(
  id: number,
  data: UpdateIMERPIMECPayload,
  token: string
) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    const body = await jsonOrText(res);
    if (!res.ok) return { error: (body as any)?.error || res.statusText };
    return body; // { message: 'IMERPIMEC X updated successfully' }
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}

export async function deleteIMERPIMEC(id: number, token: string) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    const body = await jsonOrText(res);
    if (!res.ok) return { error: (body as any)?.error || res.statusText };
    return body; // { message: 'IMERPIMEC deleted successfully' }
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}

export async function restoreIMERPIMEC(id: number, token: string) {
  try {
    const res = await fetch(`${API_URL}/${id}/restore`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const body = await jsonOrText(res);
    if (!res.ok) return { error: (body as any)?.error || res.statusText };
    return body; // { message: 'IMERPIMEC restored successfully' }
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}

// Helper to derive metric payload from an ordered list of up to 5 numeric scores.
// Extra scores are ignored; missing scores default to 0.
export function buildIMERPIMECPayloadFromScores(
  scores: number[],
  userIdOrEmail: string
): CreateIMERPIMECPayload {
  const [a, b, c, d, e] = [0, 1, 2, 3, 4].map((i) => Number(scores[i] ?? 0));
  return {
    a,
    b,
    c,
    d,
    e,
    created_by: userIdOrEmail,
    updated_by: userIdOrEmail,
  };
}
