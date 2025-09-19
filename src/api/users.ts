const API_URL = "http://127.0.0.1:5000/users";

export async function createUser(user: any, token: string) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  });
  return res.json();
}

export async function getUserById(userId: number, token: string) {
  const res = await fetch(`${API_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllUsers(
  token: string,
  page = 1,
  sort_by?: string,
  sort_dir: "asc" | "desc" = "asc"
) {
  const params = new URLSearchParams();
  params.append("page", String(page));
  if (sort_by) params.append("sort_by", sort_by);
  if (sort_dir) params.append("sort_dir", sort_dir);
  const res = await fetch(`${API_URL}/?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllUsersNoPagination(
  token: string,
  sort_by?: string,
  sort_dir: "asc" | "desc" = "asc"
) {
  const params = new URLSearchParams();
  if (sort_by) params.append("sort_by", sort_by);
  if (sort_dir) params.append("sort_dir", sort_dir);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/all${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateUser(userId: number, data: any, token: string) {
  const res = await fetch(`${API_URL}/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUser(userId: number, token: string) {
  const res = await fetch(`${API_URL}/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getDeletedUsers(token: string, page = 1) {
  const res = await fetch(`${API_URL}/deleted?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function restoreUser(userId: number, token: string) {
  const res = await fetch(`${API_URL}/${userId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
