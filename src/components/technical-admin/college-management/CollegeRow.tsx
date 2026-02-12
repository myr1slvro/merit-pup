import React from "react";
import { College } from "../../../types/college";
import { Department } from "../../../types/department";
import DepartmentAccordion from "./DepartmentAccordion";

interface CollegeRowProps {
  college: College;
  isExpanded: boolean;
  isEditing: boolean;
  editDraft: { abbreviation: string; name: string };
  departments: Department[];
  onExpand: (id: number) => void;
  onEdit: (college: College) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
  onDelete: (id: number) => void;
  onStartEditDepartment: (collegeId: number, dep: Department) => void;
  onAddDepartment: (collegeId: number) => void;
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

export default function CollegeRow({
  college,
  isExpanded,
  isEditing,
  editDraft,
  departments,
  onExpand,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onStartEditDepartment,
  onAddDepartment,
  onUpdateDepartmentDraft,
  onSaveDepartment,
  onDeleteDepartment,
  onSaveNewDepartment,
  onFetchDepartments,
}: CollegeRowProps) {
  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExpand(college.id)}
              className="mr-2 text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              {isExpanded ? "-" : "+"}
            </button>
            {isEditing ? (
              <input
                value={editDraft.name}
                onChange={(e) => onEdit({ ...college, name: e.target.value })}
                className="text-sm px-2 py-1 border border-gray-300 rounded bg-white"
                style={{ maxWidth: "350px", minWidth: "120px" }}
              />
            ) : (
              <span>{college.name}</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          {isEditing ? (
            <input
              value={editDraft.abbreviation}
              onChange={(e) =>
                onEdit({ ...college, abbreviation: e.target.value })
              }
              className="text-sm px-2 py-1 border border-gray-300 rounded bg-white"
              style={{ maxWidth: "120px", minWidth: "60px" }}
            />
          ) : (
            <span>{college.abbreviation}</span>
          )}
        </td>
        <td className="px-3 py-2 space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave(college.id)}
                className="text-xs px-2 py-1 bg-immsRed text-white rounded"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                className="text-xs px-2 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(college)}
                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(college.id)}
                className="text-xs px-2 py-1 bg-immsYellow rounded hover:bg-yellow-400"
              >
                Delete
              </button>
            </>
          )}
        </td>
      </tr>
      {isExpanded && (
        <DepartmentAccordion
          collegeId={college.id}
          departments={departments}
          onStartEditDepartment={onStartEditDepartment}
          onAddDepartment={onAddDepartment}
          onUpdateDepartmentDraft={onUpdateDepartmentDraft}
          onSaveDepartment={onSaveDepartment}
          onDeleteDepartment={onDeleteDepartment}
          onSaveNewDepartment={onSaveNewDepartment}
          onFetchDepartments={onFetchDepartments}
        />
      )}
    </>
  );
}
