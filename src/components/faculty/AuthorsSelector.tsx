import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  getCollegesForUserDetailed,
  getUsersForCollege,
} from "../../api/collegeincluded";
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
  const { authToken, user } = useAuth();
  const [options, setOptions] = useState<AuthorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<
    "All" | "Faculty" | "PIMEC" | "UTLDO Admin" | "Technical Admin"
  >("All");
  const [query, setQuery] = useState("");
  const reqSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const myReq = ++reqSeq.current;
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
          if (!cancelled && reqSeq.current === myReq) setOptions(users);
        } else {
          // All colleges mode: aggregate users across user's colleges
          if (!user?.id) {
            if (!cancelled && reqSeq.current === myReq) setOptions([]);
          } else {
            const ciRes: any = await getCollegesForUserDetailed(
              user.id as number,
              authToken
            );
            const assocList: any[] = Array.isArray(ciRes)
              ? ciRes
              : ciRes?.data || ciRes?.colleges || [];
            const collegeIds: number[] = assocList
              .map((a: any) =>
                typeof a?.id === "string" ? parseInt(a.id, 10) : a?.id
              )
              .filter((id: any) => Number.isFinite(id));
            // fetch all colleges in parallel
            const collegeResults = await Promise.all(
              collegeIds.map(async (cid) => {
                try {
                  const res = await getUsersForCollege(cid, authToken);
                  return Array.isArray(res)
                    ? res
                    : res?.data || res?.users || [];
                } catch {
                  return [];
                }
              })
            );
            // flatten and extract unique users
            const seenUser = new Set<number>();
            const users: any[] = [];
            const toFetch = new Set<number>();
            for (const list of collegeResults) {
              for (const item of list as any[]) {
                if (item?.user && item.user?.id != null) {
                  const id =
                    typeof item.user.id === "string"
                      ? parseInt(item.user.id, 10)
                      : item.user.id;
                  if (Number.isFinite(id) && !seenUser.has(id)) {
                    seenUser.add(id);
                    users.push({ ...item.user, id });
                  }
                } else if (item?.user_id != null) {
                  const id =
                    typeof item.user_id === "string"
                      ? parseInt(item.user_id, 10)
                      : item.user_id;
                  if (Number.isFinite(id) && !seenUser.has(id)) {
                    seenUser.add(id);
                    toFetch.add(id);
                  }
                } else if (item?.id != null && item?.email) {
                  const id =
                    typeof item.id === "string"
                      ? parseInt(item.id, 10)
                      : item.id;
                  if (Number.isFinite(id) && !seenUser.has(id)) {
                    seenUser.add(id);
                    users.push({ ...item, id });
                  }
                }
              }
            }
            if (toFetch.size) {
              try {
                const fetched = await Promise.all(
                  Array.from(toFetch).map((id) =>
                    getUserById(id, authToken)
                      .then((u) => u?.user || u)
                      .catch(() => null)
                  )
                );
                for (const u of fetched) {
                  if (!u) continue;
                  const id =
                    typeof u.id === "string" ? parseInt(u.id, 10) : u.id;
                  if (Number.isFinite(id) && !users.some((x) => x.id === id)) {
                    users.push({ ...u, id });
                  }
                }
              } catch {
                // ignore fetch failures
              }
            }
            if (!cancelled && reqSeq.current === myReq) {
              if (users.length === 0) {
                try {
                  const all = await getAllUsersNoPagination(
                    authToken,
                    "last_name",
                    "asc"
                  );
                  const list = Array.isArray(all)
                    ? all
                    : all?.data || all?.users || [];
                  const normalized = list
                    .map((u: any) => ({
                      ...u,
                      id:
                        typeof u?.id === "string" ? parseInt(u.id, 10) : u?.id,
                    }))
                    .filter((u: any) => Number.isFinite(u.id));
                  if (reqSeq.current === myReq) setOptions(normalized);
                } catch {
                  if (reqSeq.current === myReq) setOptions([]);
                }
              } else {
                if (reqSeq.current === myReq) setOptions(users);
              }
            }
          }
        }
      } catch {
        if (!cancelled && reqSeq.current === myReq) setOptions([]);
      } finally {
        if (!cancelled && reqSeq.current === myReq) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, collegeId, user?.id]);

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
          className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
          disabled={disabled}
        >
          <option value="All">All Roles</option>
          <option value="Faculty">Faculty</option>
          <option value="PIMEC">PIMEC</option>
          <option value="UTLDO Admin">UTLDO Admin</option>
          <option value="Technical Admin">Technical Admin</option>
        </select>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search authors by name, staff id, email..."
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
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
