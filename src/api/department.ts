export const getCollegeIdFromIM = (im: any): number | undefined => {
  const raw = im?.college?.id ?? im?.college_id;
  if (raw == null) return undefined;
  const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
  return Number.isFinite(n) ? (n as number) : undefined;
};

export const getDepartmentIdFromIM = (im: any): number | undefined => {
  const raw = im?.department?.id ?? im?.department_id;
  if (raw == null) return undefined;
  const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
  return Number.isFinite(n) ? (n as number) : undefined;
};
const API_URL = "http://127.0.0.1:5000/departments";

export async function createDepartment(department: any, token: string) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(department),
  });
  return res.json();
}

export async function getDepartmentById(departmentId: number, token: string) {
  const res = await fetch(`${API_URL}/${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllDepartments(token: string) {
  const res = await fetch(`${API_URL}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getDepartmentsByCollegeId(
  collegeId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/college/${collegeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateDepartment(
  departmentId: number,
  data: any,
  token: string
) {
  const res = await fetch(`${API_URL}/${departmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteDepartment(departmentId: number, token: string) {
  const res = await fetch(`${API_URL}/${departmentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getDeletedDepartments(token: string, page = 1) {
  const res = await fetch(`${API_URL}/deleted?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function restoreDepartment(departmentId: number, token: string) {
  const res = await fetch(`${API_URL}/${departmentId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

import type { Department } from "../types/department";

const __departmentCache: Record<
  number,
  { name: string; abbreviation?: string }
> = {};

export function getDepartmentCacheEntry(
  id: number
): { name: string; abbreviation?: string } | undefined {
  return __departmentCache[id];
}

export async function getDepartmentsByIdsCached(
  ids: number[],
  authToken: string
): Promise<Record<number, { name: string; abbreviation?: string }>> {
  const unique = Array.from(new Set(ids.filter((x) => Number.isFinite(x))));
  const missing = unique.filter((id) => __departmentCache[id] === undefined);
  if (missing.length) {
    const results = await Promise.all(
      missing.map((id) =>
        (getDepartmentById as any)(id, authToken)
          .then((dep: any) => ({ id, dep }))
          .catch(() => null)
      )
    );
    results.forEach((r) => {
      if (r && r.dep) {
        const d: Department =
          (r.dep as any).department || (r.dep as Department);
        if (d && d.id != null) {
          __departmentCache[d.id] = {
            name: d.name,
            abbreviation: (d as any).abbreviation,
          };
        }
      }
    });
  }
  const out: Record<number, { name: string; abbreviation?: string }> = {};
  unique.forEach((id) => {
    const c = __departmentCache[id];
    if (c) out[id] = { ...c };
  });
  return out;
}
