import { useEffect, useState } from "react";
import { getAllUserDetails } from "../../api/users";
import { User } from "../../types/user";

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const data = await getAllUserDetails();
      setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (!users.length) {
    return <div className="p-4">No users found.</div>;
  }

  // Get all unique keys from users for columns
  const columns = Array.from(
    new Set(users.flatMap((user) => Object.keys(user)))
  );

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
    roles: "Roles",
    birthdate: "Birthdate",
    created_by: "Created By",
    created_at: "Created At",
    updated_by: "Updated By",
    updated_at: "Updated At",
    is_deleted: "Is Deleted",
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
