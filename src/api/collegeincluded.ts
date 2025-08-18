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
