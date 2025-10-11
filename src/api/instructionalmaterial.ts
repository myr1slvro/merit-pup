const API_URL = "http://127.0.0.1:5000/instructionalmaterials";

export async function uploadIMPdf(file: File, token: string) {
  const form = new FormData();
  form.append("pdf_file", file);
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  return res.json();
}

export async function checkMissingSections(file: File, token: string) {
  const form = new FormData();
  form.append("pdf_file", file);
  const res = await fetch(`${API_URL}/check-missing-sections`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  return res.json();
}

export async function createInstructionalMaterial(data: any, token: string) {
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

export async function updateInstructionalMaterial(
  imId: number,
  data: any,
  token: string
) {
  // If data contains a pdf_file, send as multipart/form-data
  if (data.pdf_file) {
    const form = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "pdf_file") {
        form.append("pdf_file", data[key]);
      } else {
        form.append(key, data[key]);
      }
    });
    const res = await fetch(`${API_URL}/${imId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    return res.json();
  } else {
    const res = await fetch(`${API_URL}/${imId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }
}

export async function getInstructionalMaterial(imId: number, token: string) {
  const res = await fetch(`${API_URL}/${imId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getAllInstructionalMaterials(
  token: string,
  page: number = 1
) {
  const res = await fetch(`${API_URL}/?page=${page}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function deletePdfFromS3(s3_link: string, token: string) {
  const res = await fetch(`${API_URL}/delete-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ s3_link }),
  });
  return res.json();
}

export async function deleteInstructionalMaterial(imId: number, token: string) {
  const res = await fetch(`${API_URL}/${imId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getDeletedInstructionalMaterials(
  token: string,
  page: number = 1
) {
  const res = await fetch(`${API_URL}/deleted?page=${page}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function restoreInstructionalMaterial(
  imId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/${imId}/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function downloadInstructionalMaterial(
  imId: number,
  token: string,
  downloadDir?: string
) {
  let url = `${API_URL}/${imId}/download`;
  if (downloadDir) {
    url += `?download_dir=${encodeURIComponent(downloadDir)}`;
  }
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getForPIMEC(
  token: string,
  page: number = 1,
  departmentId?: number
) {
  const params = new URLSearchParams({ page: String(page) });
  if (departmentId) params.append("department_id", String(departmentId));
  const res = await fetch(`${API_URL}/get-for-pimec?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getInstructionalMaterialPresignedUrl(
  imId: number,
  token: string
) {
  const res = await fetch(`${API_URL}/${imId}/presigned`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getForUtldo(token: string, page: number = 1) {
  const res = await fetch(`${API_URL}/get-for-utldo?page=${page}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getForCertification(token: string, page: number = 1) {
  const res = await fetch(`${API_URL}/get-for-certification?page=${page}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// Send certificate of appreciation to IM authors (with file upload)
export async function sendCertsOfAppreciation(
  imId: number,
  file: File,
  token: string,
  opts?: { subject?: string; text_body?: string; html_body?: string }
) {
  const form = new FormData();
  form.append("file", file);
  if (opts?.subject) form.append("subject", opts.subject);
  if (opts?.text_body) form.append("text_body", opts.text_body);
  if (opts?.html_body) form.append("html_body", opts.html_body);
  const res = await fetch(`${API_URL}/send-certs-of-appreciation/${imId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  return res.json();
}

// Download the certificate of appreciation DOCX template
export async function getCertOfAppreciation(token: string) {
  const url = `${API_URL}/cert-of-appreciation`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to download certificate");
  }

  // Get the blob from the response
  const blob = await res.blob();

  // Create a download link and trigger it
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = "cert-of-appreciation.docx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);

  return { success: true };
}
