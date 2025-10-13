import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/authors`;

export async function createAuthor(
  im_id: number,
  user_id: number,
  token: string
) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ im_id, user_id }),
  });
  return res.json();
}

export async function getAuthor(im_id: number, user_id: number, token: string) {
  const res = await fetch(`${API_URL}/im/${im_id}/user/${user_id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAuthorsForUser(user_id: number, token: string) {
  const res = await fetch(`${API_URL}/user/${user_id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAuthorsForIM(im_id: number, token: string) {
  const res = await fetch(`${API_URL}/im/${im_id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Convenience helper: returns unique user IDs of authors for a given IM
export async function getAllUsersForIM(im_id: number, token: string) {
  const resp = await getAuthorsForIM(im_id, token);
  const list = Array.isArray(resp)
    ? resp
    : Array.isArray(resp?.items)
    ? resp.items
    : Array.isArray(resp?.results)
    ? resp.results
    : Array.isArray(resp?.data)
    ? resp.data
    : [];
  const ids = new Set<number>();
  for (const a of list) {
    const uid = Number(
      a?.user_id ?? a?.userId ?? a?.user?.id ?? a?.user?.user_id
    );
    if (uid) ids.add(uid);
  }
  return Array.from(ids);
}

export async function deleteAuthor(
  im_id: number,
  user_id: number,
  token: string
) {
  const res = await fetch(`${API_URL}/im/${im_id}/user/${user_id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
