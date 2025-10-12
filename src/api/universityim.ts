const API_URL = "http://127.0.0.1:8080/universityims";

export async function createUniversityIM(data: any, token: string) {
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

export async function getUniversityIMById(
  universityimId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/${universityimId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllUniversityIMs(token: string, page = 1) {
  const res = await fetch(`${API_URL}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateUniversityIM(
  universityimId: number,
  data: any,
  token: string
) {
  const res = await fetch(`${API_URL}/${universityimId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUniversityIM(
  universityimId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/${universityimId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getUniversityIMsByCollege(
  collegeId: number,
  token: string,
  page = 1
) {
  const res = await fetch(`${API_URL}/college/${collegeId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getUniversityIMsByDepartment(
  departmentId: number,
  token: string,
  page = 1
) {
  const res = await fetch(
    `${API_URL}/department/${departmentId}?page=${page}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
}

export async function getUniversityIMsBySubject(
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
import type { UniversityIM } from "../types/universityim";

export async function getUniversityIMsByCollegeWithSubjects(
  collegeId: number,
  authToken: string
): Promise<UniversityIM[]> {
  const base: any = await (getUniversityIMsByCollege as any)(
    collegeId,
    authToken
  );
  const list: UniversityIM[] = Array.isArray(base)
    ? base
    : (base?.universityims as UniversityIM[]) || [];
  const enriched = await Promise.all(
    list.map(async (im: any) => {
      if (!im.subject && im.subject_id && authToken) {
        try {
          const subject = await getSubjectById(im.subject_id, authToken);
          return { ...im, subject } as UniversityIM;
        } catch {
          return im as UniversityIM;
        }
      }
      return im as UniversityIM;
    })
  );
  return enriched;
}
