import React, { useState } from "react";

interface DepartmentDraft {
  abbreviation: string;
  name: string;
}

export interface CollegeCreationData {
  abbreviation: string;
  name: string;
  departments: DepartmentDraft[];
}

export default function CollegeCreationForm({
  onSubmit,
  onCancel,
  saving,
  existingAbbreviations = [],
}: {
  onSubmit: (data: CollegeCreationData) => void;
  onCancel: () => void;
  saving: boolean;
  existingAbbreviations?: string[];
}) {
  const [abbreviation, setAbbreviation] = useState("");
  const [name, setName] = useState("");
  const [departments, setDepartments] = useState<DepartmentDraft[]>([]);
  const [error, setError] = useState("");

  function addDepartmentRow() {
    setDepartments((d) => [...d, { abbreviation: "", name: "" }]);
  }

  function updateDepartment(
    idx: number,
    field: keyof DepartmentDraft,
    value: string
  ) {
    setDepartments((d) =>
      d.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  }

  function removeDepartment(idx: number) {
    setDepartments((d) => d.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!abbreviation.trim() || !name.trim()) {
      setError("College abbreviation and name are required.");
      return;
    }
    if (
      existingAbbreviations
        .map((a) => a.toLowerCase())
        .includes(abbreviation.trim().toLowerCase())
    ) {
      setError("College abbreviation already exists.");
      return;
    }
    const filteredDeps = departments
      .filter((d) => d.abbreviation.trim() && d.name.trim())
      .map((d) => ({
        abbreviation: d.abbreviation.trim(),
        name: d.name.trim(),
      }));
    const dupDepAbbr = new Set<string>();
    for (const dep of filteredDeps) {
      if (dupDepAbbr.has(dep.abbreviation.toLowerCase())) {
        setError("Duplicate department abbreviation: " + dep.abbreviation);
        return;
      }
      dupDepAbbr.add(dep.abbreviation.toLowerCase());
    }
    onSubmit({
      abbreviation: abbreviation.trim(),
      name: name.trim(),
      departments: filteredDeps,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-600">
            College Abbreviation
          </label>
          <input
            type="text"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            className="mt-1 w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-600">College Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded px-2 py-1"
            required
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-semibold">
            Departments (optional)
          </span>
          <button
            type="button"
            onClick={addDepartmentRow}
            className="text-xs px-2 py-1 bg-meritRed text-white rounded hover:bg-meritDarkRed"
          >
            + Add Department
          </button>
        </div>
        {departments.length === 0 && (
          <div className="text-xs text-gray-400">No departments added.</div>
        )}
        <div className="space-y-2">
          {departments.map((dep, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500">
                  Abbreviation
                </label>
                <input
                  type="text"
                  value={dep.abbreviation}
                  onChange={(e) =>
                    updateDepartment(idx, "abbreviation", e.target.value)
                  }
                  className="mt-0.5 w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500">Name</label>
                <input
                  type="text"
                  value={dep.name}
                  onChange={(e) =>
                    updateDepartment(idx, "name", e.target.value)
                  }
                  className="mt-0.5 w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeDepartment(idx)}
                className="text-xs bg-gray-300 hover:bg-gray-400 text-black rounded px-2 py-1 h-8"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-row-reverse gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold"
        >
          {saving ? "Creating..." : "Create College"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
