import { useEffect, useState } from "react";
import {
  updateUserEmail,
  updateUserStaffId,
  updateUserRole,
  updateUserPassword,
} from "../../api/users";
import { getAllUserDetails } from "../../api/users";
import { User } from "../../types/user";
import EditButton from "./EditButton";
import EditModal from "./EditModal";

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const data = await getAllUserDetails();
      setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  function handleEditClick(user: User) {
    setEditingUser(user);
    setEditForm({ ...user });
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSave() {
    if (!editingUser) return;
    setSaving(true);
    if (editForm.email && editForm.email !== editingUser.email) {
      await updateUserEmail(editingUser.staff_id, editForm.email);
    }
    if (editForm.staff_id && editForm.staff_id !== editingUser.staff_id) {
      await updateUserStaffId(editingUser.staff_id, editForm.staff_id);
    }
    if (editForm.role && editForm.role !== editingUser.role) {
      await updateUserRole(editingUser.staff_id, editForm.role as any);
    }
    if (editForm.password && editForm.password !== editingUser.password) {
      await updateUserPassword(editingUser.staff_id, editForm.password);
    }
    // Refresh users
    const data = await getAllUserDetails();
    setUsers(data);
    setEditingUser(null);
    setSaving(false);
  }

  async function handleDeleteUser() {
    if (!editingUser) return;
    setSaving(true);
    // Soft delete: set is_deleted to true
    editingUser.is_deleted = true;
    // Remove from table immediately
    setUsers((prev) => prev.filter((u) => u.user_id !== editingUser.user_id));
    setEditingUser(null);
    setSaving(false);
  }

  function handleEditCancel() {
    setEditingUser(null);
    setEditForm({});
  }

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (!users.length) {
    return <div className="p-4">No users found.</div>;
  }

  // Get all unique keys from users for columns
  const columns = Array.from(
    new Set(users.flatMap((user) => Object.keys(user)))
  ).filter((col) => col !== "is_deleted");

  // Map column names to readable labels
  const columnLabels: Record<string, string> = {
    user_id: "User ID",
    staff_id: "Staff ID",
    first_name: "First Name",
    middle_name: "Middle Name",
    last_name: "Last Name",
    email: "Email",
    phone: "Phone",
    password: "Password",
    role: "Role",
    birthdate: "Birthdate",
    created_by: "Created By",
    created_at: "Created At",
    updated_by: "Updated By",
    updated_at: "Updated At",
  };

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full border border-gray-300 bg-white rounded shadow">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold"
              >
                {columnLabels[col] ||
                  col.charAt(0).toUpperCase() + col.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={user.user_id || idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 border-b text-sm">
                  {Array.isArray(user[col])
                    ? user[col].join(", ")
                    : user[col] ?? ""}
                </td>
              ))}
              <td className="px-4 py-2 border-b text-sm">
                <EditButton onClick={() => handleEditClick(user)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <EditModal
        editingUser={editingUser}
        editForm={editForm}
        handleEditChange={handleEditChange}
        handleEditSave={handleEditSave}
        handleEditCancel={handleEditCancel}
        handleDeleteUser={handleDeleteUser}
        saving={saving}
      />
    </div>
  );
}
