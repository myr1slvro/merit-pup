import { users } from "./mockUsers";

export async function getUser() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  // No-op for mock
}
export async function login(email?: string | number, password?: string) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (!email) {
    return { error: "Email is required." };
  }
  if (!password) {
    return { error: "Password is required." };
  }
  const userByEmail = users.find((u) => String(u.email) === String(email));
  if (!userByEmail || userByEmail.password !== password) {
    return { error: "Incorrect User ID or password entered." };
  }
  if (!userByEmail.roles || userByEmail.roles.length === 0) {
    return { error: "No roles found for this user." };
  }
  const authToken = generateAuthToken();
  return [200, { authToken, user: userByEmail }] as const;
}

function generateAuthToken() {
  return Math.random().toString(36).substring(2);
}
