const API_URL = "http://127.0.0.1:5000/college-included";

export async function createAssociation(data: any, token: string) {
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

export async function getAssociation(
  collegeId: number,
  userId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/college/${collegeId}/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getCollegesForUser(userId: number, token: string) {
  const res = await fetch(`${API_URL}/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getUsersForCollege(collegeId: number, token: string) {
  const res = await fetch(`${API_URL}/college/${collegeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteAssociation(
  collegeId: number,
  userId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/college/${collegeId}/user/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Convenience: fetch full College objects for a user
import { getCollegeById } from "./college";
import type { College } from "../types/college";
import type { CollegeIncluded } from "../types/collegeincluded";

export async function getCollegesForUserDetailed(
  userId: number,
  authToken: string
): Promise<College[]> {
  const res = (await (getCollegesForUser as any)(userId, authToken)) as
    | CollegeIncluded[]
    | any;
  const list: CollegeIncluded[] = Array.isArray(res) ? res : res?.data || [];
  const collegeIds = list
    .map((ci) =>
      typeof (ci as any).college_id === "string"
        ? parseInt((ci as any).college_id, 10)
        : (ci as any).college_id
    )
    .filter((id): id is number => Number.isFinite(id));
  const results = await Promise.all(
    collegeIds.map((id) => getCollegeById(id, authToken))
  );
  return results
    .map((r: any) => r?.college || r)
    .filter((c: any) => c && c.id != null && c.name != null) as College[];
}
