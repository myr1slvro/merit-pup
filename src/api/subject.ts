const API_URL = "http://127.0.0.1:8080/subjects";

export async function createSubject(subject: any, token: string) {
  const res = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subject),
  });
  return res.json();
}

export async function getSubjectById(subjectId: number, token: string) {
  const res = await fetch(`${API_URL}/${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getSubjectByImID(imId: number, token: string) {
  const res = await fetch(`${API_URL}/instructionalmaterial/${imId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllSubjects(token: string, page = 1) {
  const res = await fetch(`${API_URL}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAllSubjectsNoPagination(token: string) {
  const res = await fetch(`${API_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateSubject(
  subjectId: number,
  data: any,
  token: string
) {
  const res = await fetch(`${API_URL}/${subjectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSubject(subjectId: number, token: string) {
  const res = await fetch(`${API_URL}/${subjectId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getDeletedSubjects(token: string, page = 1) {
  const res = await fetch(`${API_URL}/deleted?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function restoreSubject(subjectId: number, token: string) {
  const res = await fetch(`${API_URL}/${subjectId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getSubjectsByCollegeId(collegeId: number, token: string) {
  const res = await fetch(`${API_URL}/college/${collegeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
