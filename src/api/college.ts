const API_URL = "http://127.0.0.1:5000/colleges";

export async function createCollege(college: any, token: string) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(college),
  });
  return res.json();
}

export async function getCollegeById(collegeId: number, token: string) {
  const res = await fetch(`${API_URL}/${collegeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllColleges(token: string) {
  const res = await fetch(`${API_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllCollegesWithPagination(token: string, page = 1) {
  const res = await fetch(`${API_URL}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateCollege(
  collegeId: number,
  data: any,
  token: string
) {
  const res = await fetch(`${API_URL}/${collegeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCollege(collegeId: number, token: string) {
  const res = await fetch(`${API_URL}/${collegeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getDeletedColleges(token: string, page = 1) {
  const res = await fetch(`${API_URL}/deleted?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function restoreCollege(collegeId: number, token: string) {
  const res = await fetch(`${API_URL}/${collegeId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
