import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/im-submissions`;

export interface IMSubmission {
  id: number;
  user_id: number;
  im_id: number;
  due_date: string | null;
  date_submitted: string;
}

export interface PaginatedSubmissions {
  submissions: IMSubmission[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

// Get all submissions for a specific IM
export async function getSubmissionsByIM(
  imId: number,
  token: string,
  page: number = 1
): Promise<PaginatedSubmissions> {
  const res = await fetch(`${API_URL}/im/${imId}?page=${page}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Get all submissions by a specific user
export async function getSubmissionsByUser(
  userId: number,
  token: string,
  page: number = 1
): Promise<PaginatedSubmissions> {
  const res = await fetch(`${API_URL}/user/${userId}?page=${page}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
