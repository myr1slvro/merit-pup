import { useState } from "react";
import { Subject } from "../../../types/subject";
import { useAuth } from "../../auth/AuthProvider";
import { updateSubject, deleteSubject } from "../../../api/subject";
import SubjectDepartmentsModal from "./SubjectDepartmentsModal";

type Props = {
  subject: Subject & { __editing?: boolean };
  onRefresh: () => void;
  collegeFilterId?: number;
};

export default function SubjectRow({
  subject,
  onRefresh,
  collegeFilterId,
}: Props) {
  const { authToken, user } = useAuth();
  const [draft, setDraft] = useState({
    code: subject.code,
    name: subject.name,
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeps, setShowDeps] = useState(false);

  async function save() {
    if (!authToken) return;
    setSaving(true);
    setError("");
    try {
      await updateSubject(
        subject.id,
        { ...draft, updated_by: user?.staff_id || "" },
        authToken
      );
      setEditing(false);
      onRefresh();
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!authToken) return;
    setSaving(true);
    try {
      await deleteSubject(subject.id, authToken);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b">
      <td className="p-2 w-32">
        {editing ? (
          <input
            className="w-full border rounded px-2 py-1"
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value })}
          />
        ) : (
          <span className="font-mono">{subject.code}</span>
        )}
      </td>
      <td className="p-2">
        {editing ? (
          <input
            className="w-full border rounded px-2 py-1"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        ) : (
          <span>{subject.name}</span>
        )}
      </td>
      <td className="p-2 text-right whitespace-nowrap">
        {editing ? (
          <>
            <button
              className="px-2 py-1 text-xs bg-gray-200 rounded mr-2"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-2 py-1 text-xs bg-meritRed text-white rounded"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <>
            <button
              className="px-2 py-1 text-xs bg-gray-200 rounded mr-2"
              onClick={() => setShowDeps(true)}
            >
              Manage Departments
            </button>
            <button
              className="px-2 py-1 text-xs bg-gray-200 rounded mr-2"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded"
              onClick={remove}
              disabled={saving}
            >
              Delete
            </button>
          </>
        )}
        {showDeps && (
          <SubjectDepartmentsModal
            subject={subject}
            collegeId={collegeFilterId}
            onClose={() => setShowDeps(false)}
            onChanged={onRefresh}
          />
        )}
      </td>
    </tr>
  );
}
