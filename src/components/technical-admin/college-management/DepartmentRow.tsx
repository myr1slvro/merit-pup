import React from "react";
import { Department } from "../../../types/department";

interface DepartmentRowProps {
  collegeId: number;
  department: Department;
  onStartEditDepartment: (collegeId: number, dep: Department) => void;
  onUpdateDepartmentDraft: (
    collegeId: number,
    depId: number,
    field: string,
    value: string
  ) => void;
  onSaveDepartment: (collegeId: number, dep: any) => void;
  onDeleteDepartment: (collegeId: number, depId: number) => void;
  onSaveNewDepartment: (collegeId: number, dep: any) => void;
  onFetchDepartments: (collegeId: number) => void;
}

export default function DepartmentRow({
  collegeId,
  department,
  onStartEditDepartment,
  onUpdateDepartmentDraft,
  onSaveDepartment,
  onDeleteDepartment,
  onSaveNewDepartment,
  onFetchDepartments,
}: DepartmentRowProps) {
  const editingDep = (department as any).__editing;
  const isNew = (department as any).__new;
  return (
    <tr className="border-b">
      <td className="px-2 py-1">
        {editingDep || isNew ? (
          <input
            value={department.abbreviation}
            onChange={(e) =>
              onUpdateDepartmentDraft(
                collegeId,
                department.id,
                "abbreviation",
                e.target.value
              )
            }
            className="border rounded px-1 py-0.5 w-full"
          />
        ) : (
          department.abbreviation
        )}
      </td>
      <td className="px-2 py-1">
        {editingDep || isNew ? (
          <input
            value={department.name}
            onChange={(e) =>
              onUpdateDepartmentDraft(
                collegeId,
                department.id,
                "name",
                e.target.value
              )
            }
            className="border rounded px-1 py-0.5 w-full"
          />
        ) : (
          department.name
        )}
      </td>
      <td className="px-2 py-1 space-x-1">
        {isNew ? (
          <>
            <button
              onClick={() => onSaveNewDepartment(collegeId, department)}
              className="text-[10px] px-2 py-0.5 bg-meritRed text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => onFetchDepartments(collegeId)}
              className="text-[10px] px-2 py-0.5 bg-gray-300 rounded"
            >
              Cancel
            </button>
          </>
        ) : editingDep ? (
          <>
            <button
              onClick={() => onSaveDepartment(collegeId, department)}
              className="text-[10px] px-2 py-0.5 bg-meritRed text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => onFetchDepartments(collegeId)}
              className="text-[10px] px-2 py-0.5 bg-gray-300 rounded"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onStartEditDepartment(collegeId, department)}
              className="text-[10px] px-2 py-0.5 bg-gray-200 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteDepartment(collegeId, department.id)}
              className="text-[10px] px-2 py-0.5 bg-meritYellow rounded"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
