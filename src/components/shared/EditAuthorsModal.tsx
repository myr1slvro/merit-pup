import React, { useEffect, useState } from "react";
import { getAllUsersForIM, createAuthor, deleteAuthor } from "../../api/author";
import { getUserById, getAllUsersNoPagination } from "../../api/users";
import { getUsersForCollege } from "../../api/collegesincluded";
import { useAuth } from "../auth/AuthProvider";

interface UserLike {
  id: number;
  staff_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  rank?: string | null;
}

export interface EditAuthorsModalProps {
  imId: number;
  departmentId?: number | null;
  collegeId?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function formatUser(u: UserLike) {
  const staff = u.staff_id || "NO-ID";
  const last = u.last_name || "";
  const first = u.first_name || "";
  const mid = (u.middle_name || "").trim();
  const midPart = mid ? ` ${mid}` : "";
  return `${staff} - ${last}, ${first}${midPart}`.trim();
}

const ROLE_COLORS: Record<string, string> = {
  Faculty: "bg-blue-100 text-blue-700",
  PIMEC: "bg-purple-100 text-purple-700",
  "UTLDO Admin": "bg-green-100 text-green-700",
  "Technical Admin": "bg-orange-100 text-orange-700",
};

const EditAuthorsModal: React.FC<EditAuthorsModalProps> = ({
  imId,
  collegeId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<UserLike[]>([]);
  const [authorIds, setAuthorIds] = useState<number[]>([]);
  const [initialAuthorIds, setInitialAuthorIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [isScopedToCollege, setIsScopedToCollege] = useState(false);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || !authToken) return;
    let cancelled = false;
    setQuery("");
    setRoleFilter("All");

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get current authors
        const existingIds: number[] = await getAllUsersForIM(imId, authToken);
        if (!cancelled) {
          setAuthorIds(existingIds);
          setInitialAuthorIds(existingIds);
        }

        let rawUsers: UserLike[] = [];
        let scoped = false;

        if (collegeId) {
          // 2a. Load college-scoped users
          const collegeResp: any = await getUsersForCollege(
            collegeId,
            authToken,
          );
          const associations: any[] = Array.isArray(collegeResp)
            ? collegeResp
            : collegeResp?.data || [];
          const userIds: number[] = associations
            .map((a: any) => Number(a.user_id))
            .filter((id) => Number.isFinite(id));

          const fetched = await Promise.all(
            userIds.map((id) =>
              getUserById(id, authToken)
                .then((u) => {
                  const raw = u?.user || u;
                  return raw ? { ...raw, id: Number(raw.id) } : null;
                })
                .catch(() => null),
            ),
          );
          rawUsers = fetched.filter(Boolean) as UserLike[];
          scoped = true;
        } else {
          // 2b. Fallback: all users
          const allResp: any = await getAllUsersNoPagination(authToken);
          const list = Array.isArray(allResp)
            ? allResp
            : allResp?.users || allResp?.data || [];
          rawUsers = list
            .filter((u: any) => u && u.id != null)
            .map((u: any) => ({ ...u, id: Number(u.id) }));
        }

        // 3. Make sure existing authors are always in the list
        const presentIds = new Set(rawUsers.map((u) => u.id));
        const missingIds = existingIds.filter((id) => !presentIds.has(id));
        if (missingIds.length) {
          const extra = await Promise.all(
            missingIds.map((id) =>
              getUserById(id, authToken)
                .then((u) => {
                  const raw = u?.user || u;
                  return raw ? { ...raw, id: Number(raw.id) } : null;
                })
                .catch(() => null),
            ),
          );
          for (const f of extra) {
            if (f && typeof f.id === "number") rawUsers.push(f as UserLike);
          }
        }

        // 4. Deduplicate and sort
        const dedupMap = new Map<number, UserLike>();
        for (const u of rawUsers) {
          if (u.id != null && !dedupMap.has(u.id)) dedupMap.set(u.id, u);
        }
        const sorted = Array.from(dedupMap.values()).sort((a, b) =>
          formatUser(a).localeCompare(formatUser(b)),
        );

        if (!cancelled) {
          setAllUsers(sorted);
          setIsScopedToCollege(scoped);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed loading users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authToken, imId, collegeId]);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isOpen]);

  function toggleAuthor(id: number) {
    setAuthorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Current authors first, then rest sorted
  const orderedUsers = React.useMemo(() => {
    const byId = new Map<number, UserLike>();
    for (const u of allUsers) if (u.id != null) byId.set(u.id, u);
    const top: UserLike[] = [];
    for (const id of authorIds) {
      const u = byId.get(id);
      if (u) {
        top.push(u);
        byId.delete(id);
      }
    }
    const rest = Array.from(byId.values()).sort((a, b) =>
      formatUser(a).localeCompare(formatUser(b)),
    );
    return [...top, ...rest];
  }, [allUsers, authorIds]);

  const availableRoles = React.useMemo(() => {
    const roles = new Set(orderedUsers.map((u) => u.role).filter(Boolean));
    return ["All", ...Array.from(roles).sort()];
  }, [orderedUsers]);

  const filtered = React.useMemo(() => {
    return orderedUsers.filter((u) => {
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesQuery =
        !query.trim() ||
        formatUser(u).toLowerCase().includes(query.trim().toLowerCase()) ||
        (u.email || "").toLowerCase().includes(query.trim().toLowerCase()) ||
        (u.rank || "").toLowerCase().includes(query.trim().toLowerCase());
      return matchesRole && matchesQuery;
    });
  }, [orderedUsers, query, roleFilter]);

  async function handleSave() {
    if (!authToken) return;
    setSaving(true);
    try {
      const existing: number[] = await getAllUsersForIM(imId, authToken);
      const toAdd = authorIds.filter((id) => !existing.includes(id));
      const toRemove = existing.filter((id) => !authorIds.includes(id));
      for (const id of toAdd) {
        try {
          await createAuthor(imId, id, authToken);
        } catch {
          /* ignore */
        }
      }
      for (const id of toRemove) {
        try {
          await deleteAuthor(imId, id, authToken);
        } catch {
          /* ignore */
        }
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const hasChanged = () => {
    if (initialAuthorIds.length !== authorIds.length) return true;
    const setA = new Set(initialAuthorIds);
    return authorIds.some((id) => !setA.has(id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !saving && onClose()}
      />
      <div className="relative bg-white rounded-lg shadow-xl p-5 w-full max-w-lg z-10 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Edit Authors</h3>
            {isScopedToCollege ? (
              <p className="text-xs text-gray-500">
                Showing users within this college
              </p>
            ) : (
              <p className="text-xs text-yellow-600">
                ⚠ Showing all users (no college scope)
              </p>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">{authorIds.length}</span>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          <input
            ref={searchRef}
            type="text"
            className="flex-1 rounded border px-3 py-1.5 text-sm"
            placeholder="Search by name, email, rank…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || saving}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            disabled={loading || saving}
            className="rounded border px-2 py-1.5 text-sm bg-white"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* User list */}
        <div className="max-h-72 overflow-auto border rounded divide-y text-sm">
          {loading ? (
            <div className="p-3 text-gray-500 text-sm">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm italic">
              No users found.
            </div>
          ) : (
            filtered.map((u) => {
              const checked = authorIds.includes(u.id);
              const roleClass =
                ROLE_COLORS[u.role || ""] || "bg-gray-100 text-gray-600";
              return (
                <label
                  key={u.id}
                  className={`flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    checked ? "bg-blue-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAuthor(u.id)}
                    disabled={saving}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">
                        {formatUser(u)}
                      </span>
                      {u.role && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleClass}`}
                        >
                          {u.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {u.rank ? (
                        <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {u.rank}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 italic">
                          No rank
                        </span>
                      )}
                      {u.email && (
                        <span className="text-xs text-gray-500 truncate">
                          {u.email}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-gray-400">
            {filtered.length} of {allUsers.length} shown
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !hasChanged()}
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-immsRed to-immsDarkRed text-white rounded disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAuthorsModal;
