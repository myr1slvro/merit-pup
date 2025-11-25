import { useEffect, useState } from "react";
import { getAllColleges } from "../../../api/college";
import { getDepartmentsByCollegeId } from "../../../api/department";
import type { College } from "../../../types/college";
import type { Department } from "../../../types/department";
import type { AnalyticsFilters as FiltersType } from "../../../api/analytics";

interface AnalyticsFiltersProps {
  authToken: string;
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export default function AnalyticsFilters({
  authToken,
  filters,
  onFiltersChange,
}: AnalyticsFiltersProps) {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Load colleges on mount
  useEffect(() => {
    async function loadColleges() {
      try {
        const response = await getAllColleges(authToken);
        // API returns { colleges: [...] }
        setColleges(response.colleges || []);
      } catch (e) {
        console.error("Failed to load colleges:", e);
      } finally {
        setLoadingColleges(false);
      }
    }
    loadColleges();
  }, [authToken]);

  // Load departments when college changes
  useEffect(() => {
    async function loadDepartments() {
      if (!filters.college_id) {
        setDepartments([]);
        return;
      }

      setLoadingDepartments(true);
      try {
        const data = await getDepartmentsByCollegeId(
          filters.college_id,
          authToken
        );
        setDepartments(data);
      } catch (e) {
        console.error("Failed to load departments:", e);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    }
    loadDepartments();
  }, [authToken, filters.college_id]);

  const handleCollegeChange = (collegeId: number | undefined) => {
    // Reset department when college changes
    onFiltersChange({
      college_id: collegeId,
      department_id: undefined,
    });
  };

  const handleDepartmentChange = (departmentId: number | undefined) => {
    onFiltersChange({
      ...filters,
      department_id: departmentId,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      college_id: undefined,
      department_id: undefined,
    });
  };

  const hasFilters = filters.college_id || filters.department_id;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Filter by:
          </label>
        </div>

        {/* College Filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="college-filter"
            className="text-sm text-gray-600 whitespace-nowrap"
          >
            College:
          </label>
          <select
            id="college-filter"
            value={filters.college_id || ""}
            onChange={(e) =>
              handleCollegeChange(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            disabled={loadingColleges}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-meritRed focus:border-meritRed min-w-[200px]"
          >
            <option value="">All Colleges</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter - Only shown when a college is selected */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="department-filter"
            className="text-sm text-gray-600 whitespace-nowrap"
          >
            Department:
          </label>
          <select
            id="department-filter"
            value={filters.department_id || ""}
            onChange={(e) =>
              handleDepartmentChange(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            disabled={!filters.college_id || loadingDepartments}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-meritRed focus:border-meritRed min-w-[200px] disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {!filters.college_id
                ? "Select a college first"
                : "All Departments"}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm text-meritRed hover:text-meritDarkRed hover:bg-red-50 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {filters.college_id && (
            <span className="px-2 py-1 bg-meritRed/10 text-meritRed rounded-full text-xs font-medium">
              {colleges.find((c) => c.id === filters.college_id)?.name ||
                "College"}
            </span>
          )}
          {filters.department_id && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {departments.find((d) => d.id === filters.department_id)?.name ||
                "Department"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
