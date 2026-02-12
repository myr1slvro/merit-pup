import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
  getDepartmentsByCollegeId,
} from "../../../api/department";

interface DeptAssoc {
  department_id: number;
  user_id: number;
}

interface DepartmentCountMap {
  [deptId: number]: number;
}

interface Props {
  selectedDepartmentId: number | null;
  onSelect: (deptId: number | null, collegeId?: number) => void;
  className?: string;
  counts?: DepartmentCountMap; // pending IM counts per department
  filterCollegeId?: number | null; // Single college ID to fetch departments for
  onDepartmentsLoaded?: (assocs: DeptAssoc[], deptIds: number[]) => void;
}

export default function UtldoIncludedDepartmentFilter({
  selectedDepartmentId,
  onSelect,
  className = "",
  counts = {},
  filterCollegeId = null,
  onDepartmentsLoaded,
}: Props) {
  const { authToken } = useAuth();
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments for selected college
  // UTLDO needs to see all departments in the selected college to approve IMs
  useEffect(() => {
    if (!authToken || !filterCollegeId) {
      setDepartmentIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDepartmentsByCollegeId(filterCollegeId, authToken);
        const list = Array.isArray(res) ? res : res?.departments || [];
        const ids = list
          .map((d: any) => d.id)
          .filter((id: any) => typeof id === "number");

        if (!cancelled) {
          setDepartmentIds(ids);

          // Prefetch department details for labels
          if (ids.length) {
            await getDepartmentsByIdsCached(ids, authToken);

            // Notify parent with department IDs after cache is loaded
            if (onDepartmentsLoaded) {
              const assocs = ids.map((id: number) => ({
                department_id: id,
                user_id: 0, // dummy value since we're not using user associations
              }));
              onDepartmentsLoaded(assocs, ids);
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError("Failed to load departments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, filterCollegeId, onDepartmentsLoaded]);

  function labelFor(deptId: number) {
    const entry = getDepartmentCacheEntry(deptId);
    if (!entry) return `Dept #${deptId}`;
    return entry.abbreviation || entry.name || `Dept #${deptId}`;
  }

  function collegeIdFor(deptId: number): number | undefined {
    const entry = getDepartmentCacheEntry(deptId) as any;
    return entry?.college_id;
  }

  if (loading) {
    return (
      <div className={className + " text-sm text-gray-500"}>
        Loading departments…
      </div>
    );
  }
  if (error) {
    return <div className={className + " text-sm text-immsRed"}>{error}</div>;
  }
  if (!departmentIds.length) {
    return (
      <div className={className + " text-sm text-gray-500"}>
        No departments found for your colleges.
      </div>
    );
  }

  return (
    <div className={"flex flex-wrap gap-2 " + className}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
          selectedDepartmentId == null
            ? "bg-immsRed text-white border-immsRed"
            : "bg-white text-gray-700 border-gray-300 hover:border-immsRed"
        }`}
      >
        All Departments
      </button>
      {departmentIds.map((deptId) => (
        <button
          key={deptId}
          type="button"
          onClick={() => onSelect(deptId, collegeIdFor(deptId))}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            selectedDepartmentId === deptId
              ? "bg-immsRed text-white border-immsRed"
              : "bg-white text-gray-700 border-gray-300 hover:border-immsRed"
          }`}
        >
          {labelFor(deptId)}
          {typeof counts[deptId] === "number" && counts[deptId] > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] px-1 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold">
              {counts[deptId]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
