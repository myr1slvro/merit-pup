import { useEffect, useState } from "react";
import Pagination from "../navigation/Pagination";
import { getAllUsers, updateUser, deleteUser } from "../../api/users";
import { getCollegesForUser } from "../../api/collegeincluded";
import { getCollegeById } from "../../api/college";
import { User } from "../../types/user";
import EditButton from "./EditButton";
import EditModal from "./EditModal";
import { useAuth } from "../auth/AuthProvider";

interface UserManagementTableProps {
  page: number;
  setPage: (page: number) => void;
  setHasNext: (hasNext: boolean) => void;
  setHasPrev: (hasPrev: boolean) => void;
}

type CollegeMap = Record<number, string[]>;

export default function UserManagementTable({
  page,
  setPage,
  setHasNext,
  setHasPrev,
}: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [collegeMap, setCollegeMap] = useState<CollegeMap>({});
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const { authToken } = useAuth();

  async function fetchUsers(currentPage = page) {
    setLoading(true);
    if (!authToken) {
      setUsers([]);
      setLoading(false);
      setHasNext(false);
      setHasPrev(false);
      return;
    }
    try {
      const res = await getAllUsers(authToken, currentPage);
      const userList = res?.users ?? [];
      setUsers(userList);
      setHasNext(
        !!res?.has_next ||
          ((res?.users?.length ?? 0) > 0 &&
            res?.users?.length === (res?.per_page ?? 10))
      );
      setHasPrev(currentPage > 1);

      // Fetch colleges for each user, then fetch each college's abbreviation
      const collegeMapResult: CollegeMap = {};
      await Promise.all(
        userList.map(async (user: User) => {
          if (user.id != null) {
            try {
              const colleges = await getCollegesForUser(user.id, authToken);
              // colleges may be array of ids or objects with college_id
              let ids: number[] = [];
              if (Array.isArray(colleges)) {
                ids = colleges.map((c: any) =>
                  typeof c === "object" && c.college_id ? c.college_id : c
                );
              } else if (colleges?.data) {
                ids = colleges.data.map((c: any) =>
                  typeof c === "object" && c.college_id ? c.college_id : c
                );
              }
              // Fetch abbreviations for each id
              const abbrs: string[] = await Promise.all(
                ids
                  .filter((id) => typeof id === "number")
                  .map(async (id) => {
                    try {
                      const college = await getCollegeById(id, authToken);
                      return (
                        college?.abbreviation ||
                        college?.college?.abbreviation ||
                        String(id)
                      );
                    } catch {
                      return String(id);
                    }
                  })
              );
              collegeMapResult[user.id] = abbrs;
            } catch {
              collegeMapResult[user.id] = [];
            }
          }
        })
      );
      setCollegeMap(collegeMapResult);
    } catch (e) {
      setUsers([]);
      setHasNext(false);
      setHasPrev(false);
      setCollegeMap({});
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, page]);

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
      await fetchUsers(1);
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
      await fetchUsers(page);
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
    "colleges",
    "birth_date",
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
    colleges: "Colleges",
    role: "Role",
    birth_date: "Birthdate",
    updated_by: "Updated By",
    updated_at: "Updated At",
  };

  // Helper to format date string as 'YYYY-MM-DD | hh:mm:ss AM/PM'
  function formatDateTime(dt: string | undefined): string {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hh = String(hours).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} \n ${hh}:${minutes}:${seconds} ${ampm}`;
  }

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
            <th className="px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={user.id || idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 border-b text-sm">
                  {col === "colleges"
                    ? typeof user.id === "number" && collegeMap[user.id]
                      ? collegeMap[user.id].join(", ")
                      : "Loading..."
                    : col === "updated_at"
                    ? formatDateTime(user[col])
                    : Array.isArray(user[col])
                    ? user[col].join(", ")
                    : user[col] ?? ""}
                </td>
              ))}
              <td className="px-4 py-2 border-b text-sm font-medium">
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
