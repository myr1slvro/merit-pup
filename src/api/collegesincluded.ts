import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/college-included`;

/** Returns [{college_id, user_id}] for all users associated with this college */
export async function getUsersForCollege(collegeId: number, token: string) {
  const res = await fetch(`${API_URL}/college/${collegeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
