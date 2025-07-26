import { User } from "../types/user";

const users: User[] = [
  {
    id: "CCIS-1001-MN",
    email: "test@email.com",
    password: "password",
    role: "Faculty",
  },
  {
    id: "UTLDO-3001-MN",
    email: "admin@email.com",
    password: "adminpass",
    role: "UTLDO Admin",
  },
  {
    id: "CCIS-2001-MN",
    email: "evaluator@email.com",
    password: "evalpass",
    role: "Evaluator",
  },
];

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
    return { error: "Wrong ID or password." };
  }
  if (!userById.role) {
    return { error: "No role found for this user." };
  }
  if (!userById.id) {
    return { error: "No id found for this user." };
  }
  const authToken = generateAuthToken();
  return [200, { authToken, user: userById }] as const;
}

function generateAuthToken() {
  return Math.random().toString(36).substring(2);
}
