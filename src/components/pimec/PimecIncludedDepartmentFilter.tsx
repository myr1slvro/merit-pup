import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getDepartmentsForUser } from "../../api/departmentsincluded";
import {
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
} from "../../api/department";

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
  filterCollegeId?: number | null; // optional college filter
  onDepartmentsLoaded?: (assocs: DeptAssoc[], deptIds: number[]) => void;
}

export default function PimecIncludedDepartmentFilter({
  selectedDepartmentId,
  onSelect,
  className = "",
  counts = {},
  filterCollegeId = null,
  onDepartmentsLoaded,
}: Props) {
  const { authToken, user } = useAuth();
  const [assocs, setAssocs] = useState<DeptAssoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken || !user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDepartmentsForUser(user.id as number, authToken);
        // Backend variants: {departments: [...]}, {data: [...]}, raw array, or nested .departmentsincluded
        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.departments)) list = res.departments;
        else if (Array.isArray(res?.departmentsincluded))
          list = res.departmentsincluded;
        else if (res && typeof res === "object") {
          // Attempt to extract any array-ish property
          const firstArrKey = Object.keys(res).find((k) =>
            Array.isArray((res as any)[k])
          );
          if (firstArrKey) list = (res as any)[firstArrKey];
        }
        let cleaned: any[] = [];
        if (!cancelled) {
          cleaned = list.filter(
            (a: any) => typeof a?.department_id === "number"
          );
          setAssocs(cleaned);
          if (onDepartmentsLoaded) {
            onDepartmentsLoaded(
              cleaned as any,
              cleaned.map((c: any) => c.department_id)
            );
          }
        }
        // Prefetch department details for labels
        const ids = list
          .map((a: any) => a?.department_id)
          .filter((n: any) => Number.isFinite(n));
        if (ids.length) {
          await getDepartmentsByIdsCached(ids, authToken);
          if (!cancelled && onDepartmentsLoaded && cleaned.length) {
            onDepartmentsLoaded(
              cleaned as any,
              cleaned.map((c: any) => c.department_id)
            );
          }
        }
      } catch (e: any) {
        if (!cancelled) setError("Failed to load your departments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, user?.id]);

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
    return <div className={className + " text-sm text-meritRed"}>{error}</div>;
  }
  if (!assocs.length) {
    return (
      <div className={className + " text-sm text-gray-500"}>
        No departments assigned.
      </div>
    );
  }

  const visibleAssocs = filterCollegeId
    ? assocs.filter(
        (a) =>
          (getDepartmentCacheEntry(a.department_id) as any)?.college_id ===
          filterCollegeId
      )
    : assocs;

  return (
    <div className={"flex flex-wrap gap-2 " + className}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
          selectedDepartmentId == null
            ? "bg-meritRed text-white border-meritRed"
            : "bg-white text-gray-700 border-gray-300 hover:border-meritRed"
        }`}
      >
        All Departments
      </button>
      {visibleAssocs.map((a) => (
        <button
          key={a.department_id}
          type="button"
          onClick={() =>
            onSelect(a.department_id, collegeIdFor(a.department_id))
          }
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            selectedDepartmentId === a.department_id
              ? "bg-meritRed text-white border-meritRed"
              : "bg-white text-gray-700 border-gray-300 hover:border-meritRed"
          }`}
        >
          {labelFor(a.department_id)}
          {typeof counts[a.department_id] === "number" && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] px-1 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold">
              {counts[a.department_id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
