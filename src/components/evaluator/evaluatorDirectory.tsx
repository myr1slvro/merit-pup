import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";
import useUserColleges from "../faculty/useUserColleges";
import CollegeButtonsRow from "../shared/CollegeButtonsRow";
import DepartmentFilter from "../shared/DepartmentFilter";
import IMTableHeader from "../shared/IMTableHeader";
import IMTable from "../shared/IMTable";
import useEvaluatorIMs from "./useEvaluatorIMs";
import { getDepartmentCacheEntry } from "../../api/department";

export default function EvaluatorDirectory() {
  const { authToken } = useAuth();
  const {
    colleges,
    loading: collegesLoading,
    error: collegesError,
  } = useUserColleges();
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [activeIMType, setActiveIMType] = useState<
    "university" | "service" | "all"
  >("university");
  const [reloadTick, setReloadTick] = useState(0);

  // Auto-select first college
  useEffect(() => {
    if (colleges?.length && !selectedCollege) setSelectedCollege(colleges[0]);
  }, [colleges, selectedCollege]);

  const { loading, error, departmentIds, collegeFiltered } = useEvaluatorIMs(
    selectedCollege,
    reloadTick
  );

  // Reset department when college changes
  useEffect(() => {
    setSelectedDepartmentId(null);
  }, [selectedCollege?.id]);

  // Separate by type (assuming im_type field present)
  const universityRows = useMemo(
    () => collegeFiltered.filter((im) => im.im_type === "University"),
    [collegeFiltered]
  );
  const serviceRows = useMemo(
    () => collegeFiltered.filter((im) => im.im_type === "Service"),
    [collegeFiltered]
  );
  const allRows = collegeFiltered; // already filtered by college

  // Department filtering applies only to university rows (service IMs have no department)
  const filteredUniversity = useMemo(() => {
    if (selectedDepartmentId == null) return universityRows;
    return universityRows.filter(
      (im) => im.department_id === selectedDepartmentId
    );
  }, [universityRows, selectedDepartmentId]);

  const getDeptLabel = (deptId: number) => {
    const cacheEntry = getDepartmentCacheEntry(deptId);
    if (cacheEntry) return cacheEntry.abbreviation || cacheEntry.name;
    return `Dept #${deptId}`;
  };

  return (
    <div className="mx-8 p-8 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-meritRed" /> Evaluator Colleges
      </h2>
      <CollegeButtonsRow
        colleges={colleges}
        selectedCollege={selectedCollege}
        loading={collegesLoading}
        error={collegesError}
        onSelect={setSelectedCollege}
      />
      {selectedCollege && (
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-meritRed">
            {selectedCollege.name}
          </h3>
          <DepartmentFilter
            departmentIds={departmentIds}
            selectedDepartmentId={selectedDepartmentId}
            onSelect={setSelectedDepartmentId}
            getLabel={getDeptLabel}
          />
          <div className="border-t border-gray-300 my-4" />
          <div className="flex flex-col gap-2 mb-2">
            <IMTableHeader
              activeIMType={activeIMType}
              setActiveIMType={setActiveIMType}
              onRefresh={() => setReloadTick((n) => n + 1)}
              hideCreate
            />
            <div>
              {loading ? (
                <div className="text-gray-500">Loading evaluator IMs...</div>
              ) : error ? (
                <div className="text-meritRed">{error}</div>
              ) : activeIMType === "university" ? (
                <IMTable
                  type="university"
                  data={filteredUniversity as any}
                  loading={loading}
                  error={error}
                  actionsRole="Evaluator"
                />
              ) : activeIMType === "service" ? (
                <IMTable
                  type="service"
                  data={serviceRows as any}
                  loading={loading}
                  error={error}
                  actionsRole="Evaluator"
                />
              ) : (
                <IMTable
                  type="all"
                  data={allRows as any}
                  loading={loading}
                  error={error}
                  actionsRole="Evaluator"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
