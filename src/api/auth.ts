const API_URL = "http://127.0.0.1:5000/auth";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    return { error: "Login failed", status: res.status };
  }
  return res.json();
}
