import {
  IMERPIMEC,
  CreateIMERPIMECPayload,
  UpdateIMERPIMECPayload,
} from "../types/imerpimec";

const API_URL = "http://127.0.0.1:8080/imerpimec"; // Matches blueprint url_prefix

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
    if (!res.ok) {
      // removed debug log
      return { error: (body as any)?.error || res.statusText };
    }
    return body; // Currently { message: 'IMERPIMEC X created successfully' }
  } catch (e: any) {
    // removed debug log
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

// Helper to build a full IMERPIMEC payload from rubric scores and comments
// rubricScores: { [rubricItemId: string]: number }
// sectionComments: { [section: string]: string }
// overallComment: string
// userIdOrEmail: string
export function buildFullIMERPIMECPayload(
  rubricScores: Record<string, number>,
  sectionComments: Record<string, string>,
  overallComment: string,
  userIdOrEmail: string
) {
  // Helper to get score by key (case-insensitive)
  const getScore = (key: string): number => {
    return (
      rubricScores[key] ??
      rubricScores[key.toUpperCase()] ??
      rubricScores[key.toLowerCase()] ??
      0
    );
  };

  // Map rubric item IDs to model fields
  // A section
  const a1 = getScore("a1");
  const a2 = getScore("a2");
  const a3 = getScore("a3");
  const a_comment = sectionComments["A"] ?? "";
  const a_subtotal = a1 + a2 + a3;
  // B section (B1, B2, B3 in rubric, but b1, b2, b3 in backend)
  const b1 = getScore("b1");
  const b2 = getScore("b2");
  const b3 = getScore("b3");
  const b_comment = sectionComments["B1"] ?? sectionComments["B"] ?? "";
  const b_subtotal = b1 + b2 + b3;
  // C section
  const c1 = getScore("c1");
  const c2 = getScore("c2");
  const c3 = getScore("c3");
  const c4 = getScore("c4");
  const c5 = getScore("c5");
  const c6 = getScore("c6");
  const c7 = getScore("c7");
  const c8 = getScore("c8");
  const c9 = getScore("c9");
  const c10 = getScore("c10");
  const c_comment = sectionComments["C"] ?? "";
  const c_subtotal = c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8 + c9 + c10;
  // D section
  const d1 = getScore("d1");
  const d2 = getScore("d2");
  const d3 = getScore("d3");
  const d_comment = sectionComments["D"] ?? "";
  const d_subtotal = d1 + d2 + d3;
  // E section
  const e1 = getScore("e1");
  const e2 = getScore("e2");
  const e3 = getScore("e3");
  const e_comment = sectionComments["E"] ?? "";
  const e_subtotal = e1 + e2 + e3;
  // Total
  const total = a_subtotal + b_subtotal + c_subtotal + d_subtotal + e_subtotal;

  return {
    a1,
    a2,
    a3,
    a_comment,
    // a_subtotal is dump_only, calculated by backend
    b1,
    b2,
    b3,
    b_comment,
    // b_subtotal is dump_only, calculated by backend
    c1,
    c2,
    c3,
    c4,
    c5,
    c6,
    c7,
    c8,
    c9,
    c10,
    c_comment,
    // c_subtotal is dump_only, calculated by backend
    d1,
    d2,
    d3,
    d_comment,
    // d_subtotal is dump_only, calculated by backend
    e1,
    e2,
    e3,
    e_comment,
    // e_subtotal is dump_only, calculated by backend
    // total is dump_only, calculated by backend
    overall_comment: overallComment,
    created_by: userIdOrEmail,
    updated_by: userIdOrEmail,
  };
}
