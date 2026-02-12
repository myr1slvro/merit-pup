import React from "react";

type Props = {
  departmentIds: number[];
  selectedDepartmentId: number | null;
  onSelect: (id: number | null) => void;
  getLabel: (id: number) => string;
};

export default function DepartmentFilter({
  departmentIds,
  selectedDepartmentId,
  onSelect,
  getLabel,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        type="button"
        className={`px-3 py-1 rounded-full border text-sm ${
          selectedDepartmentId == null
            ? "bg-immsRed text-white border-immsRed"
            : "bg-white text-immsRed border-immsRed/40 hover:bg-immsRed/10"
        }`}
        onClick={() => onSelect(null)}
      >
        All Departments
      </button>
      {departmentIds.map((deptId) => {
        const label = getLabel(deptId);
        const active = selectedDepartmentId === deptId;
        return (
          <button
            key={deptId}
            type="button"
            className={`px-3 py-1 rounded-full border text-sm ${
              active
                ? "bg-immsRed text-white border-immsRed"
                : "bg-white text-immsRed border-immsRed/40 hover:bg-immsRed/10"
            }`}
            onClick={() => onSelect(deptId)}
            title={label}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
