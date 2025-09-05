import React from "react";
import CollegeRow from "./CollegeRow";
import { College } from "../../../types/college";
import { Department } from "../../../types/department";

interface CollegeListTableProps {
  colleges: College[];
  expanded: Set<number>;
  editCollegeId: number | null;
  editCollegeDraft: { abbreviation: string; name: string };
  departments: Record<number, Department[]>;
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

export default function CollegeListTable({
  colleges,
  expanded,
  editCollegeId,
  editCollegeDraft,
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
}: CollegeListTableProps) {
  return (
    <table className="min-w-full border border-gray-300 bg-white rounded shadow text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-3 py-2 text-left">College</th>
          <th className="px-3 py-2 text-left">Abbreviation</th>
          <th className="px-3 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {colleges.map((col) => (
          <CollegeRow
            key={col.id}
            college={col}
            isExpanded={expanded.has(col.id)}
            isEditing={editCollegeId === col.id}
            editDraft={editCollegeDraft}
            departments={departments[col.id] || []}
            onExpand={onExpand}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            onDelete={onDelete}
            onStartEditDepartment={onStartEditDepartment}
            onAddDepartment={onAddDepartment}
            onUpdateDepartmentDraft={onUpdateDepartmentDraft}
            onSaveDepartment={onSaveDepartment}
            onDeleteDepartment={onDeleteDepartment}
            onSaveNewDepartment={onSaveNewDepartment}
            onFetchDepartments={onFetchDepartments}
          />
        ))}
      </tbody>
    </table>
  );
}
