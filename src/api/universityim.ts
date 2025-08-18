const API_URL = "http://127.0.0.1:5000/universityims";

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

export async function getUniversityIMsByCollege(collegeId: number, token: string, page = 1) {
  const res = await fetch(`${API_URL}/college/${collegeId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getUniversityIMsByDepartment(departmentId: number, token: string, page = 1) {
  const res = await fetch(`${API_URL}/department/${departmentId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getUniversityIMsBySubject(subjectId: number, token: string, page = 1) {
  const res = await fetch(`${API_URL}/subject/${subjectId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
