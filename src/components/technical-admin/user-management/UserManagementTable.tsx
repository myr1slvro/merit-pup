import { useEffect, useState, useCallback, useMemo } from "react";
import { getAllUsers, updateUser, deleteUser } from "../../../api/users";
import {
  getCollegesForUser,
  createAssociation,
  deleteAssociation,
} from "../../../api/collegeincluded";
import { getCollegeById } from "../../../api/college";
import { User } from "../../../types/user";
import EditButton from "./UserEditButton";
import EditModal from "./UserEditModal";
import { useAuth } from "../../auth/AuthProvider";

interface UserManagementTableProps {
  page: number;
  setPage: (page: number) => void; // (retained for future use)
  setHasNext: (hasNext: boolean) => void;
  setHasPrev: (hasPrev: boolean) => void;
}

type CollegeMap = Record<number, string[]>;

// Role ordering used for sorting
const roleOrder = ["Technical Admin", "UTLDO Admin", "PIMEC", "Faculty"];

const sortableColumns = [
  "last_name",
  "colleges",
  "role",
  "birth_date",
  "updated_at",
];

const columnOrder: string[] = [
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

function formatDateTime(dt?: string): string {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt; // fallback to raw value
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

export default function UserManagementTable({
  page,
  setPage, // retained for possible pagination UI outside this component
  setHasNext,
  setHasPrev,
}: UserManagementTableProps) {
  const { authToken } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [collegeMap, setCollegeMap] = useState<CollegeMap>({});
  const [collegeLoading, setCollegeLoading] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<User> & { colleges?: number[] }
  >({});
  const [saving, setSaving] = useState(false);

  // Derive string of colleges for a user (memoized per user id map)
  const getCollegesString = useCallback(
    (user: User) => {
      if (typeof user.id === "number") {
        if (collegeLoading[user.id]) return "Loading...";
        if (collegeMap[user.id]) return collegeMap[user.id].join(", ");
      }
      return "";
    },
    [collegeMap, collegeLoading]
  );

  // Server-side sorted list already comes sorted; just pass through
  const sortedUsers = users;

  function handleSort(key: string) {
    if (!sortableColumns.includes(key)) return;
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        fetchUsers(page, key, nextDir); // refetch with new direction
        return { key, direction: nextDir };
      }
      fetchUsers(page, key, "asc");
      return { key, direction: "asc" };
    });
  }

  // Fetch users + their colleges
  const fetchUsers = useCallback(
    async (
      currentPage = page,
      sortKey?: string,
      sortDir: "asc" | "desc" = "asc"
    ) => {
      setLoading(true);
      if (!authToken) {
        setUsers([]);
        setCollegeMap({});
        setHasNext(false);
        setHasPrev(false);
        setLoading(false);
        return;
      }
      try {
        const res = await getAllUsers(
          authToken,
          currentPage,
          sortKey || sortConfig?.key,
          sortKey ? sortDir : sortConfig?.direction || "asc"
        );
        const userList: User[] = res?.users ?? [];
        setUsers(userList);
        setHasNext(
          !!res?.has_next ||
            ((res?.users?.length ?? 0) > 0 &&
              res?.users?.length === (res?.per_page ?? 10))
        );
        setHasPrev(currentPage > 1);
        setLoading(false);

        // Load colleges in background
        const map: CollegeMap = {};
        const loadingMap: Record<number, boolean> = {};
        userList.forEach(u => {
          if (u.id != null) loadingMap[u.id] = true;
        });
        setCollegeLoading(loadingMap);
        
        Promise.all(
          userList.map(async (u) => {
            if (u.id == null) return;
            try {
              const colleges = await getCollegesForUser(u.id, authToken);
              let ids: number[] = [];
              if (Array.isArray(colleges)) {
                ids = colleges.map((c: any) =>
                  typeof c === "object" && c.college_id ? c.college_id : c
                );
              } else if ((colleges as any)?.data) {
                ids = (colleges as any).data.map((c: any) =>
                  typeof c === "object" && c.college_id ? c.college_id : c
                );
              }
              const abbrs = await Promise.all(
                ids
                  .filter((id) => typeof id === "number")
                  .map(async (id) => {
                    try {
                      const college = await getCollegeById(id, authToken);
                      return (
                        (college as any)?.abbreviation ||
                        (college as any)?.college?.abbreviation ||
                        String(id)
                      );
                    } catch {
                      return String(id);
                    }
                  })
              );
              map[u.id] = abbrs;
            } catch {
              map[u.id] = [];
            }
          })
        ).then(() => {
          setCollegeMap(map);
          setCollegeLoading({});
        });
      } catch {
        setUsers([]);
        setCollegeMap({});
        setHasNext(false);
        setHasPrev(false);
        setLoading(false);
      }
    },
    [
      authToken,
      page,
      sortConfig?.key,
      sortConfig?.direction,
      setHasNext,
      setHasPrev,
    ]
  );

  useEffect(() => {
    fetchUsers(page, sortConfig?.key, sortConfig?.direction || "asc");
  }, [fetchUsers, page]);

  async function handleEditClick(user: User) {
    setEditingUser(user);
    if (!authToken || !user.id) {
      setEditForm({ ...user, colleges: [] });
      return;
    }
    let userColleges: number[] = [];
    try {
      const colleges = await getCollegesForUser(user.id, authToken);
      if (Array.isArray(colleges)) {
        userColleges = colleges.map((c: any) =>
          typeof c === "object" && c.college_id ? c.college_id : c
        );
      } else if ((colleges as any)?.data) {
        userColleges = (colleges as any).data.map((c: any) =>
          typeof c === "object" && c.college_id ? c.college_id : c
        );
      }
    } catch {
      /* ignore */
    }
    setEditForm({ ...user, colleges: userColleges });
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSave() {
    if (!editingUser || !authToken) return;
    setSaving(true);
    const payload: Partial<User> = {};
    if (editForm.email && editForm.email !== editingUser.email)
      payload.email = editForm.email;
    if (editForm.staff_id && editForm.staff_id !== editingUser.staff_id)
      payload.staff_id = editForm.staff_id;
    if (editForm.role && editForm.role !== editingUser.role)
      payload.role = editForm.role;
    if (editForm.password && editForm.password !== editingUser.password)
      payload.password = editForm.password;
    try {
      if (Object.keys(payload).length && editingUser.id != null) {
        await updateUser(editingUser.id, payload, authToken);
      }
      if (editingUser.id != null) {
        let currentColleges: number[] = [];
        try {
          const colleges = await getCollegesForUser(editingUser.id, authToken);
          if (Array.isArray(colleges)) {
            currentColleges = colleges.map((c: any) =>
              typeof c === "object" && c.college_id ? c.college_id : c
            );
          } else if ((colleges as any)?.data) {
            currentColleges = (colleges as any).data.map((c: any) =>
              typeof c === "object" && c.college_id ? c.college_id : c
            );
          }
        } catch {
          /* ignore */
        }
        const selectedColleges = Array.isArray(editForm.colleges)
          ? editForm.colleges
          : [];
        const toAdd = selectedColleges.filter(
          (id) => !currentColleges.includes(id)
        );
        const toRemove = currentColleges.filter(
          (id) => !selectedColleges.includes(id)
        );
        for (const collegeId of toAdd) {
          try {
            await createAssociation(
              { college_id: collegeId, user_id: editingUser.id },
              authToken
            );
          } catch {
            /* ignore */
          }
        }
        for (const collegeId of toRemove) {
          try {
            await deleteAssociation(collegeId, editingUser.id, authToken);
          } catch {
            /* ignore */
          }
        }
      }
      await fetchUsers(page, sortConfig?.key, sortConfig?.direction || "asc");
    } finally {
      setEditingUser(null);
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!editingUser || !authToken || editingUser.id == null) return;
    setSaving(true);
    try {
      await deleteUser(editingUser.id, authToken);
      await fetchUsers(page, sortConfig?.key, sortConfig?.direction || "asc");
    } finally {
      setEditingUser(null);
      setSaving(false);
    }
  }

  function handleEditCancel() {
    setEditingUser(null);
    setEditForm({});
  }

  if (loading) return <div className="p-4">Loading users...</div>;
  if (!users.length) return <div className="p-4">No users found.</div>;

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full border border-gray-300 bg-white rounded shadow">
        <thead>
          <tr>
            {columnOrder.map((col) => {
              const sortable = sortableColumns.includes(col);
              const active = sortConfig?.key === col;
              return (
                <th
                  key={col}
                  className={
                    "px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold" +
                    (sortable ? " cursor-pointer select-none" : "")
                  }
                  onClick={() => (sortable ? handleSort(col) : undefined)}
                >
                  <span className="flex items-center">
                    {columnLabels[col] || col}
                    {sortable && (
                      <span className="ml-1 text-gray-400">
                        {active
                          ? sortConfig!.direction === "asc"
                            ? "▲"
                            : "▼"
                          : "⇅"}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
            <th className="px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, idx) => (
            <tr key={user.id ?? idx} className="hover:bg-gray-50">
              {columnOrder.map((col) => {
                let content: any = (user as any)[col];
                if (col === "colleges") content = getCollegesString(user) || "";
                else if (col === "updated_at")
                  content = formatDateTime(content);
                else if (Array.isArray(content)) content = content.join(", ");
                return (
                  <td
                    key={col}
                    className="px-4 py-2 border-b text-sm whitespace-pre-line"
                  >
                    {content ?? ""}
                  </td>
                );
              })}
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
