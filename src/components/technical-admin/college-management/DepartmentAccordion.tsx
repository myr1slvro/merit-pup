import React from "react";
import DepartmentRow from "./DepartmentRow";
import { Department } from "../../../types/department";

interface DepartmentAccordionProps {
  collegeId: number;
  departments: Department[];
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

export default function DepartmentAccordion({
  collegeId,
  departments,
  onStartEditDepartment,
  onAddDepartment,
  onUpdateDepartmentDraft,
  onSaveDepartment,
  onDeleteDepartment,
  onSaveNewDepartment,
  onFetchDepartments,
}: DepartmentAccordionProps) {
  return (
    <tr className="bg-gray-50">
      <td colSpan={3} className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-sm">Departments</h3>
          <div className="flex items-center gap-2">
            <a
              href={`#/technical-admin?view=subject&college=${collegeId}`}
              className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              title="Manage subjects for this college"
            >
              Manage Subjects
            </a>
            <button
              onClick={() => onAddDepartment(collegeId)}
              className="text-xs px-2 py-1 bg-meritRed text-white rounded hover:bg-meritDarkRed"
            >
              + Add Department
            </button>
          </div>
        </div>
        <table className="w-full text-xs border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Abbreviation</th>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-2 py-2 text-center text-gray-400">
                  No departments.
                </td>
              </tr>
            ) : (
              departments.map((dep) => (
                <DepartmentRow
                  key={dep.id}
                  collegeId={collegeId}
                  department={dep}
                  onStartEditDepartment={onStartEditDepartment}
                  onUpdateDepartmentDraft={onUpdateDepartmentDraft}
                  onSaveDepartment={onSaveDepartment}
                  onDeleteDepartment={onDeleteDepartment}
                  onSaveNewDepartment={onSaveNewDepartment}
                  onFetchDepartments={onFetchDepartments}
                />
              ))
            )}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
