const API_URL = "http://127.0.0.1:5000/authors";

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
