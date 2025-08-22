import { useEffect, useState } from "react";
import { getAllUsers, updateUser, deleteUser } from "../../api/users";
import { User } from "../../types/user";
import EditButton from "./EditButton";
import EditModal from "./EditModal";
import { useAuth } from "../auth/AuthProvider";

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      if (!authToken) {
        setUsers([]);
        setLoading(false);
        return;
      }
      try {
        const res = await getAllUsers(authToken);
        setUsers(res?.users ?? []);
      } catch (e) {
        setUsers([]);
      }
      setLoading(false);
    }
    fetchUsers();
  }, [authToken]);

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
    if (!authToken) return;
    setSaving(true);
    const payload: Partial<User> = {};
    if (editForm.email && editForm.email !== editingUser.email) {
      payload.email = editForm.email;
    }
    if (editForm.staff_id && editForm.staff_id !== editingUser.staff_id) {
      payload.staff_id = editForm.staff_id;
    }
    if (editForm.role && editForm.role !== editingUser.role) {
      payload.role = editForm.role;
    }
    if (editForm.password && editForm.password !== editingUser.password) {
      payload.password = editForm.password;
    }
    try {
      if (Object.keys(payload).length > 0 && editingUser.id != null) {
        await updateUser(editingUser.id, payload, authToken);
      }
      const res = await getAllUsers(authToken);
      setUsers(res?.users ?? []);
    } finally {
      setEditingUser(null);
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!editingUser) return;
    if (!authToken) return;
    setSaving(true);
    try {
      if (editingUser.id != null) {
        await deleteUser(editingUser.id, authToken);
      }
      // Refresh list after delete
      const res = await getAllUsers(authToken);
      setUsers(res?.users ?? []);
    } finally {
      setEditingUser(null);
      setSaving(false);
    }
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

  // Define the desired column order
  const columns = [
    "id",
    "last_name",
    "first_name",
    "middle_name",
    "role",
    "staff_id",
    "email",
    "phone_number",
    "birth_date",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  // Map column names to readable labels
  const columnLabels: Record<string, string> = {
    id: "User ID",
    staff_id: "Staff ID",
    first_name: "First Name",
    middle_name: "Middle Name",
    last_name: "Last Name",
    email: "Email",
    phone_number: "Phone",
    password: "Password",
    role: "Role",
    birth_date: "Birthdate",
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
            <tr key={user.id || idx} className="hover:bg-gray-50">
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
