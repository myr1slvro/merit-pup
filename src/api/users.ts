import { users as mockUsers } from "./mockUsers";
import { User, UserRole } from "../types/user";

let users: User[] = [...mockUsers] as User[];

export async function getAllUserDetails() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return users;
}

export async function addUser(newUser: User) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  users.push(newUser);
  return { success: true, user: newUser };
}

  export async function deleteUser(staff_id: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  users = users.filter((u) => u.staff_id !== staff_id);
  return { success: true };
}

export async function updateUserRole(
  staff_id: string,
  newRole: UserRole,
  action: "add" | "remove" = "add"
) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const user = users.find((u) => u.staff_id === staff_id);
  if (user) {
    if (!user.roles) user.roles = [];
    if (action === "add" && !user.roles.includes(newRole)) {
      user.roles.push(newRole);
    } else if (action === "remove") {
      user.roles = user.roles.filter((role) => role !== newRole);
    }
  }
  return { success: !!user, user };
}

export async function updateUserStaffId(
  oldStaffId: string,
  newStaffId: string
) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const user = users.find((u) => u.staff_id === oldStaffId);
  if (user) user.staff_id = newStaffId;
  return { success: !!user, user };
}

export async function updateUserEmail(staff_id: string, newEmail: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const user = users.find((u) => u.staff_id === staff_id);
  if (user) user.email = newEmail;
  return { success: !!user, user };
}

export async function updateUserPassword(
  staff_id: string,
  newPassword: string
) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const user = users.find((u) => u.staff_id === staff_id);
  if (user) user.password = newPassword;
  return { success: !!user, user };
}
