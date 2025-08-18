const API_URL = "http://127.0.0.1:5000/departments";

export async function createDepartment(department: any, token: string) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(department),
  });
  return res.json();
}

export async function getDepartmentById(departmentId: number, token: string) {
  const res = await fetch(`${API_URL}/${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllDepartments(token: string, page = 1) {
  const res = await fetch(`${API_URL}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateDepartment(
  departmentId: number,
  data: any,
  token: string
) {
  const res = await fetch(`${API_URL}/${departmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteDepartment(departmentId: number, token: string) {
  const res = await fetch(`${API_URL}/${departmentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getDeletedDepartments(token: string, page = 1) {
  const res = await fetch(`${API_URL}/deleted?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function restoreDepartment(departmentId: number, token: string) {
  const res = await fetch(`${API_URL}/${departmentId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
