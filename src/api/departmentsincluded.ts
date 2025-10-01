const API_URL = "http://127.0.0.1:5000/department-included";

export async function createAssociation(
  department_id: number,
  user_id: number,
  token: string
) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ department_id, user_id }),
  });
  return res.json();
}

export async function getAssociation(
  department_id: number,
  user_id: number,
  token: string
) {
  const res = await fetch(
    `${API_URL}/department/${department_id}/user/${user_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
}

export async function getDepartmentsForUser(user_id: number, token: string) {
  const res = await fetch(`${API_URL}/user/${user_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getUsersForDepartment(
  department_id: number,
  token: string
) {
  const res = await fetch(`${API_URL}/department/${department_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteAssociation(
  department_id: number,
  user_id: number,
  token: string
) {
  const res = await fetch(
    `${API_URL}/department/${department_id}/user/${user_id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
}
