import React, { useEffect, useState } from "react";
import { getAllUsersForIM, createAuthor, deleteAuthor } from "../../api/author";
import { getUsersForDepartment } from "../../api/departmentsincluded";
import { getUserById } from "../../api/users";
import { useAuth } from "../auth/AuthProvider";

interface UserLike {
  id: number;
  staff_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
}

export interface EditAuthorsModalProps {
  imId: number;
  departmentId?: number | null;
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

const EditAuthorsModal: React.FC<EditAuthorsModalProps> = ({
  imId,
  departmentId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<UserLike[]>([]);
  const [authorIds, setAuthorIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Load current authors + department users
  useEffect(() => {
    if (!isOpen || !authToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const existingIds = await getAllUsersForIM(imId, authToken);
        if (!cancelled) setAuthorIds(existingIds);
        // Pull department users
        if (departmentId) {
          const resp: any = await getUsersForDepartment(
            departmentId,
            authToken
          );
          const list = Array.isArray(resp)
            ? resp
            : resp?.data || resp?.users || [];
          // Each item may have user or user_id
          const users: UserLike[] = [];
          const toFetch: number[] = [];
          for (const item of list) {
            if (item?.user) {
              const u = item.user;
              const id = Number(u.id ?? u.user_id);
              if (Number.isFinite(id)) users.push({ ...u, id });
            } else if (item?.user_id != null) {
              const id = Number(item.user_id);
              if (Number.isFinite(id)) toFetch.push(id);
            }
          }
          if (toFetch.length) {
            const fetched = await Promise.all(
              toFetch.map((id) =>
                getUserById(id, authToken)
                  .then((u) =>
                    u?.user
                      ? { ...u.user, id: Number(u.user.id) }
                      : { ...u, id: Number(u.id) }
                  )
                  .catch(() => null)
              )
            );
            for (const f of fetched) {
              if (f && typeof f.id === "number") users.push(f as any);
            }
          }
          // Deduplicate by id
          const dedupMap = new Map<number, UserLike>();
          for (const u of users) {
            if (u.id != null && !dedupMap.has(u.id)) dedupMap.set(u.id, u);
          }
          if (!cancelled)
            setAllUsers(
              Array.from(dedupMap.values()).sort((a, b) =>
                formatUser(a).localeCompare(formatUser(b))
              )
            );
        } else {
          // If departmentId missing, just show existing authors
          const users: UserLike[] = [];
          for (const id of existingIds) {
            try {
              const u = await getUserById(id, authToken);
              const raw = u?.user || u;
              if (raw) users.push({ ...raw, id: Number(raw.id) });
            } catch {
              /* ignore */
            }
          }
          if (!cancelled) setAllUsers(users);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed loading authors");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authToken, imId, departmentId]);

  function toggleAuthor(id: number) {
    setAuthorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filtered = query.trim()
    ? allUsers.filter((u) =>
        formatUser(u).toLowerCase().includes(query.trim().toLowerCase())
      )
    : allUsers;

  async function handleSave() {
    if (!authToken) return;
    setSaving(true);
    try {
      const existing = await getAllUsersForIM(imId, authToken);
      const toAdd = authorIds.filter((id) => !existing.includes(id));
      const toRemove = existing.filter((id: number) => !authorIds.includes(id));
      for (const add of toAdd) {
        try {
          await createAuthor(imId, add, authToken);
        } catch {
          /* ignore individual */
        }
      }
      for (const rem of toRemove) {
        try {
          await deleteAuthor(imId, rem, authToken);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !saving && onClose()}
      />
      <div className="relative bg-white rounded shadow-lg p-6 w-full max-w-xl z-10 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Edit Authors</h3>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input
          type="text"
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading || saving}
        />
        <div className="max-h-64 overflow-auto border rounded p-2 space-y-1 text-sm">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500">No users found for department.</div>
          ) : (
            filtered.map((u) => {
              const checked = authorIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAuthor(u.id)}
                    disabled={saving}
                  />
                  <span>{formatUser(u)}</span>
                </label>
              );
            })
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAuthorsModal;
