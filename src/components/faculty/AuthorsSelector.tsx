import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getUsersForCollege } from "../../api/collegeincluded";
import { getAllUsersNoPagination, getUserById } from "../../api/users";

export type AuthorUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  staff_id?: string;
  role?: string;
  email?: string;
};

interface AuthorsSelectorProps {
  collegeId?: number | "";
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export default function AuthorsSelector({
  collegeId,
  selectedIds,
  onChange,
  disabled,
}: AuthorsSelectorProps) {
  const { authToken } = useAuth();
  const [options, setOptions] = useState<AuthorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<
    "All" | "Faculty" | "Evaluator" | "UTLDO Admin" | "Technical Admin"
  >("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authToken) return;
      setLoading(true);
      try {
        if (collegeId) {
          const res = await getUsersForCollege(collegeId as number, authToken);
          const list = Array.isArray(res) ? res : res?.data || res?.users || [];
          const users: any[] = [];
          const pending: Promise<any>[] = [];
          for (const item of list) {
            if (item?.user) users.push(item.user);
            else if (typeof item?.user_id === "number")
              pending.push(
                getUserById(item.user_id, authToken).then((u) => u?.user || u)
              );
            else if (typeof item?.id === "number" && item?.email)
              users.push(item);
          }
          if (pending.length) {
            const fetched = await Promise.all(pending);
            fetched.forEach((u) => u && users.push(u));
          }
          if (!cancelled) setOptions(users);
        } else {
          // All colleges mode: use non-paginated endpoint
          const list: any[] = await getAllUsersNoPagination(
            authToken,
            "last_name",
            "asc"
          );
          if (!cancelled) setOptions(list);
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, collegeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byRole =
      role === "All" ? options : options.filter((u) => u.role === role);
    if (!q) return byRole;
    return byRole.filter((u) => {
      const full = `${u.last_name || ""}, ${u.first_name || ""} ${
        u.staff_id || ""
      } ${u.email || ""} ${u.role || ""}`.toLowerCase();
      return full.includes(q);
    });
  }, [options, query, role]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: number) {
    if (selectedSet.has(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-meritRed focus:ring-1 focus:ring-meritRed/30"
          disabled={disabled}
        >
          <option value="All">All Roles</option>
          <option value="Faculty">Faculty</option>
          <option value="Evaluator">Evaluator</option>
          <option value="UTLDO Admin">UTLDO Admin</option>
          <option value="Technical Admin">Technical Admin</option>
        </select>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search authors by name, staff id, email..."
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-meritRed focus:ring-1 focus:ring-meritRed/30"
        disabled={disabled}
      />
      {/* Selected chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds
            .map((id) => options.find((o) => o.id === id))
            .filter(Boolean)
            .map((u) => (
              <span
                key={u!.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs border border-gray-300"
              >
                {u!.last_name}, {u!.first_name} ({u!.staff_id})
                <button
                  type="button"
                  className="ml-1 text-gray-600 hover:text-gray-900"
                  onClick={() =>
                    onChange(selectedIds.filter((x) => x !== u!.id))
                  }
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
      {/* Options list with checkboxes */}
      <div className="border border-gray-300 rounded-md max-h-48 overflow-auto shadow-sm bg-white">
        {filtered.length === 0 ? (
          <div className="text-xs text-gray-500 px-3 py-2">
            {loading ? "Loading..." : "No matches"}
          </div>
        ) : (
          <ul className="text-sm">
            {filtered.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(u.id)}
                  onChange={() => toggle(u.id)}
                  disabled={disabled}
                />
                <span className="text-gray-800">
                  {u.last_name}, {u.first_name} ({u.staff_id}) • {u.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
