const API_URL = "http://127.0.0.1:5000/requirements";

export async function downloadRecommendationLetter(token: string) {
  const res = await fetch(`${API_URL}/recommendation-letter/download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Download failed");
  }

  // Return blob for download
  return res.blob();
}

export async function getRecommendationLetterViewUrl(token: string) {
  const res = await fetch(`${API_URL}/recommendation-letter/view`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to get view URL");
  }

  return res.json();
}

export async function redirectToRecommendationLetter(token: string) {
  const res = await fetch(`${API_URL}/recommendation-letter/redirect`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Redirect failed");
  }

  return res.url; // The redirected URL
}

export async function checkRecommendationLetterExists(token: string) {
  const res = await fetch(`${API_URL}/recommendation-letter/check`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Check failed");
  }

  return res.json();
}

export async function getRequirementsInfo(token: string) {
  const res = await fetch(`${API_URL}/recommendation-letter/info`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Info request failed");
  }

  return res.json();
}

// Utility function to trigger browser download
export async function downloadRecommendationLetterToBrowser(
  token: string,
  filename = "recommendation-letter.pdf"
) {
  try {
    const blob = await downloadRecommendationLetter(token);

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    // removed debug log
    throw error;
  }
}

// Function to open PDF in new tab for viewing
export async function openRecommendationLetterInNewTab(token: string) {
  try {
    const response = await getRecommendationLetterViewUrl(token);
    window.open(response.url, "_blank", "noopener,noreferrer");
    return true;
  } catch (error) {
    // removed debug log
    throw error;
  }
}
