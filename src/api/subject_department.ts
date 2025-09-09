const API_URL = "http://127.0.0.1:5000/subject-departments";

export async function createSubjectDepartment(
  subjectId: number,
  departmentId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject_id: subjectId,
      department_id: departmentId,
    }),
  });
  return res.json();
}

export async function getSubjectDepartment(
  subjectId: number,
  departmentId: number,
  token: string
) {
  const res = await fetch(
    `${API_URL}/subject/${subjectId}/department/${departmentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
}

export async function getDepartmentsForSubject(
  subjectId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/subject/${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getSubjectsForDepartment(
  departmentId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/department/${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteSubjectDepartment(
  subjectId: number,
  departmentId: number,
  token: string
) {
  const res = await fetch(
    `${API_URL}/subject/${subjectId}/department/${departmentId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
}
