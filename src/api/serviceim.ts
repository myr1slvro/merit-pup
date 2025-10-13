import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/serviceims`;

export async function createServiceIM(data: any, token: string) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getServiceIMById(serviceimId: number, token: string) {
  const res = await fetch(`${API_URL}/${serviceimId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllServiceIMs(token: string, page = 1) {
  const res = await fetch(`${API_URL}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateServiceIM(
  serviceimId: number,
  data: any,
  token: string
) {
  const res = await fetch(`${API_URL}/${serviceimId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteServiceIM(serviceimId: number, token: string) {
  const res = await fetch(`${API_URL}/${serviceimId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getServiceIMsByCollege(
  collegeId: number,
  token: string,
  page = 1
) {
  const res = await fetch(`${API_URL}/college/${collegeId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getServiceIMsBySubject(
  subjectId: number,
  token: string,
  page = 1
) {
  const res = await fetch(`${API_URL}/subject/${subjectId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

import { getSubjectById } from "./subject";
import type { ServiceIM } from "../types/serviceim";

export async function getServiceIMsByCollegeWithSubjects(
  collegeId: number,
  authToken: string
): Promise<ServiceIM[]> {
  const base: any = await (getServiceIMsByCollege as any)(collegeId, authToken);
  const list: ServiceIM[] = Array.isArray(base)
    ? base
    : (base?.serviceims as ServiceIM[]) || [];
  const enriched = await Promise.all(
    list.map(async (im: any) => {
      if (!im.subject && im.subject_id && authToken) {
        try {
          const subject = await getSubjectById(im.subject_id, authToken);
          return { ...im, subject } as ServiceIM;
        } catch {
          return im as ServiceIM;
        }
      }
      return im as ServiceIM;
    })
  );
  return enriched;
}
