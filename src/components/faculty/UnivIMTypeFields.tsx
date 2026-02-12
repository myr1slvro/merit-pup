import React, { useMemo, useState } from "react";
import { IMType } from "../../types/instructionalmats";

interface UnivIMTypeFieldsProps {
  imType: IMType;
  departments: any[];
  selectedDepartmentId: number | "";
  onDepartmentChange: (id: number | "") => void;
  yearLevel: number | "";
  onYearLevelChange: (value: number | "") => void;
}

export default function UnivIMTypeFields({
  imType,
  departments,
  selectedDepartmentId,
  onDepartmentChange,
  yearLevel,
  onYearLevelChange,
}: UnivIMTypeFieldsProps) {
  if (imType !== IMType.university) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-3" />;
  }
  const [deptQuery, setDeptQuery] = useState("");
  const filteredDepartments = useMemo(() => {
    const q = deptQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d: any) =>
      `${d.abbreviation || ""} ${d.name || ""}`.toLowerCase().includes(q)
    );
  }, [departments, deptQuery]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Department
        </label>
        <input
          type="text"
          value={deptQuery}
          onChange={(e) => setDeptQuery(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
          placeholder="Search departments..."
        />
        <select
          value={selectedDepartmentId || ""}
          onChange={(e) =>
            onDepartmentChange(e.target.value ? Number(e.target.value) : "")
          }
          className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
        >
          <option value="" disabled>
            Select department...
          </option>
          {filteredDepartments.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.abbreviation} - {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Year Level
        </label>
        <input
          type="number"
          min={1}
          max={6}
          value={yearLevel as number | ""}
          onChange={(e) =>
            onYearLevelChange(e.target.value ? Number(e.target.value) : "")
          }
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
          placeholder="e.g., 2"
        />
      </div>
    </div>
  );
}
