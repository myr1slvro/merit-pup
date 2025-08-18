const API_URL = "http://127.0.0.1:5000/serviceims";

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
