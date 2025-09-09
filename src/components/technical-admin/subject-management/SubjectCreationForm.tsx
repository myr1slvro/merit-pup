import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { createSubject } from "../../../api/subject";

type Props = {
  onCreated: () => void;
  onCancel: () => void;
};

export default function SubjectCreationForm({ onCreated, onCancel }: Props) {
  const { authToken, user } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    if (!code.trim() || !name.trim()) {
      setError("Code and name are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        created_by: user?.staff_id || "",
        updated_by: user?.staff_id || "",
      };
      const res = await createSubject(payload, authToken);
      if (res?.error || res?.message?.toLowerCase?.().includes("exists")) {
        throw new Error(res.error || res.message);
      }
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Failed to create subject");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Code</label>
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., CS101"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject full name"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Minimum 10 characters (backend validation)
          </p>
        </div>
      </div>
      {error && <div className="text-meritRed text-sm">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className="px-3 py-1 bg-gray-200 rounded"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 bg-meritRed text-white rounded"
          disabled={saving}
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
