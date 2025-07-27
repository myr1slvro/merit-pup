import { users } from "./mockUsers";

export async function getUser() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  // No-op for mock
}
export async function login(id?: string | number, password?: string) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (!id) {
    return { error: "ID is required." };
  }
  if (!password) {
    return { error: "Password is required." };
  }
  const userById = users.find((u) => String(u.id) === String(id));
  if (!userById || userById.password !== password) {
    return { error: "Incorrect User ID or password entered." };
  }
  if (!userById.roles || userById.roles.length === 0) {
    return { error: "No roles found for this user." };
  }
  const authToken = generateAuthToken();
  return [200, { authToken, user: userById }] as const;
}

function generateAuthToken() {
  return Math.random().toString(36).substring(2);
}
