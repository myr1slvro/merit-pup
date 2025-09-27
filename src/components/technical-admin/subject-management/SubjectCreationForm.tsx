import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { createSubject } from "../../../api/subject";
import {
  getAllDepartments,
  getDepartmentsByCollegeId,
} from "../../../api/department";
import { getAllColleges } from "../../../api/college";
import {
  createSubjectDepartment,
} from "../../../api/subject_department";

type Props = {
  onCreated: () => void;
  onCancel: () => void;
  initialCollegeFilterId?: number;
};

export default function SubjectCreationForm({ onCreated, onCancel, initialCollegeFilterId }: Props) {
  const { authToken, user } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deptCollegeFilter, setDeptCollegeFilter] = useState<number | "">(
    typeof initialCollegeFilterId === "number" ? initialCollegeFilterId : ""
  );
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [linking, setLinking] = useState(false);

  // Load colleges
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function loadColleges() {
      setCollegesLoading(true);
      try {
        const res = await getAllColleges(authToken as string);
        const list = Array.isArray(res) ? res : res?.colleges || res?.data || [];
        if (!cancelled) setColleges(list);
      } finally {
        if (!cancelled) setCollegesLoading(false);
      }
    }
    loadColleges();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Load departments for current college filter
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function loadDeps() {
      setDepartmentsLoading(true);
      try {
        let res: any;
        if (deptCollegeFilter !== "") {
          res = await getDepartmentsByCollegeId(deptCollegeFilter as number, authToken as string);
          res = Array.isArray(res) ? res : res?.departments || res?.data || [];
        } else {
          res = await getAllDepartments(authToken as string);
          res = Array.isArray(res) ? res : res?.departments || res?.data || [];
        }
        if (!cancelled) setDepartments(res);
      } catch {
        if (!cancelled) setDepartments([]);
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    }
    loadDeps();
    return () => { cancelled = true; };
  }, [authToken, deptCollegeFilter]);

  function toggleDept(id: number) {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

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
      const created = await createSubject(payload, authToken);
      if (created?.error || created?.message?.toLowerCase?.().includes("exists")) {
        throw new Error(created.error || created.message);
      }
      const newSubjectId =
        created?.id ||
        created?.subject?.id ||
        created?.data?.id ||
        created?.subject_id;
      if (newSubjectId && selectedDeptIds.length) {
        setLinking(true);
        try {
          await Promise.all(
            selectedDeptIds.map((depId) =>
              createSubjectDepartment(newSubjectId, depId, authToken)
            )
          );
        } catch {
        } finally {
          setLinking(false);
        }
      }
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Failed to create subject");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject core fields */}
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

      {/* Department linking section */}
      <div className="border rounded p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            Optional: Link Departments Now
          </h3>
          <button
            type="button"
            className="text-xs text-gray-500 underline"
            onClick={() => {
              setSelectedDeptIds([]);
            }}
            disabled={departmentsLoading || !selectedDeptIds.length}
          >
            Clear selection
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-600">
            College filter
          </label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={deptCollegeFilter as any}
            onChange={(e) =>
              setDeptCollegeFilter(e.target.value ? Number(e.target.value) : "")
            }
            disabled={collegesLoading}
          >
            {collegesLoading ? (
              <option value="" disabled>
                Loading colleges...
              </option>
            ) : (
              <option value="">All colleges</option>
            )}
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.abbreviation ? `${c.abbreviation} — ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Select one or more departments to immediately associate with the new subject.
          </p>
          {departmentsLoading ? (
            <div className="text-xs text-gray-500">Loading departments...</div>
          ) : departments.length ? (
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
              {departments.map((d: any) => {
                const checked = selectedDeptIds.includes(d.id);
                return (
                  <label
                    key={d.id}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      onChange={() => toggleDept(d.id)}
                      disabled={saving}
                    />
                    <span>
                      <span className="font-mono mr-1">
                        {d.abbreviation || d.code || d.id}
                      </span>
                      {d.name}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              No departments available for this filter.
            </div>
          )}
          {selectedDeptIds.length > 0 && (
            <div className="text-xs text-green-600 mt-1">
              {selectedDeptIds.length} department
              {selectedDeptIds.length > 1 ? "s" : ""} selected
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-meritRed text-sm">{error}</div>}
      <div className="flex gap-2 justify-end items-center">
        {linking && (
          <span className="text-xs text-gray-500">
            Linking departments...
          </span>
        )}
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
          className="px-3 py-1 bg-meritRed text-white rounded disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Creating..." : "Create Subject"}
        </button>
      </div>
    </form>
  );
}
