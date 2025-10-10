import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";
import useUserColleges from "../faculty/useUserColleges";
import CollegeButtonsRow from "../shared/CollegeButtonsRow";
import PIMECIMTableHeader from "./PIMECIMTableHeader";
import IMTable from "../shared/IMTable";
import useEvaluatorIMs from "./useEvaluatorIMs";
import { getDepartmentCacheEntry } from "../../api/department";
import useDepartmentLabels from "../shared/useDepartmentLabels";
import PimecIncludedDepartmentFilter from "./PimecIncludedDepartmentFilter";
import CreateIMForm from "./CreateIMForm"; // PIMEC creates initial IM (authors + optional initial upload)

export default function PimecDirectory() {
  const { authToken } = useAuth();
  const { colleges } = useUserColleges();
  const [derivedCollegeIds, setDerivedCollegeIds] = useState<number[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [activeIMType, setActiveIMType] = useState<
    "university" | "service" | "all"
  >("all");
  const [reloadTick, setReloadTick] = useState(0);
  const [needsOnly, setNeedsOnly] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Auto-select first college (hidden in UI, but needed for hook)
  useEffect(() => {
    if (colleges?.length && !selectedCollege) setSelectedCollege(colleges[0]);
  }, [colleges, selectedCollege]);

  // When derived college ids become available, ensure selection constrained to them
  useEffect(() => {
    if (!derivedCollegeIds.length) return;
    if (!selectedCollege || !derivedCollegeIds.includes(selectedCollege.id)) {
      const first = colleges?.find((c: any) =>
        derivedCollegeIds.includes(c.id)
      );
      if (first) setSelectedCollege(first);
    }
  }, [derivedCollegeIds, selectedCollege, colleges]);

  const { loading, error, departmentIds, collegeFiltered, deptCounts } =
    useEvaluatorIMs(
      selectedCollege,
      reloadTick,
      null, // do not server-prefilter by department; use client-side fast filter
      needsOnly
    );

  // Split rows by IM type
  const universityRows = useMemo(
    () =>
      collegeFiltered.filter(
        (im) => (im.im_type || "").toLowerCase() === "university"
      ),
    [collegeFiltered]
  );

  const serviceRows = useMemo(
    () =>
      collegeFiltered.filter(
        (im) => (im.im_type || "").toLowerCase() === "service"
      ),
    [collegeFiltered]
  );

  // Apply department filter to university IMs
  const filteredUniversity = useMemo(() => {
    if (selectedDepartmentId == null) return universityRows;
    return universityRows.filter(
      (im) => im.department_id === selectedDepartmentId
    );
  }, [universityRows, selectedDepartmentId]);

  // Apply department filter to all IMs (exclude Service IMs when department is selected)
  const filteredAll = useMemo(() => {
    if (selectedDepartmentId == null) return collegeFiltered;
    return collegeFiltered.filter((im) => {
      const isService = (im.im_type || "").toLowerCase() === "service";
      if (isService) return false; // Service IMs have no department
      return im.department_id === selectedDepartmentId;
    });
  }, [collegeFiltered, selectedDepartmentId]);

  return (
    <div className="mx-8 p-8 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <FaUniversity className="text-meritRed" /> PIMEC Evaluation
      </h2>
      {selectedCollege && (
        <div className="flex flex-col">
          <div className="flex flex-col gap-3 mb-4">
            <CollegeButtonsRow
              colleges={colleges?.filter((c: any) =>
                derivedCollegeIds.includes(c.id)
              )}
              selectedCollege={selectedCollege}
              loading={false}
              error={""}
              onSelect={(c: any) => {
                setSelectedCollege(c);
                setSelectedDepartmentId(null);
                setReloadTick((n) => n + 1);
              }}
            />
            <PimecIncludedDepartmentFilter
              selectedDepartmentId={selectedDepartmentId}
              counts={deptCounts}
              filterCollegeId={selectedCollege?.id || null}
              onDepartmentsLoaded={(assocs) => {
                const uniq = new Set<number>();
                assocs.forEach((a: any) => {
                  const entry = getDepartmentCacheEntry(a.department_id) as any;
                  if (entry?.college_id) uniq.add(entry.college_id);
                });
                const arr = Array.from(uniq);
                setDerivedCollegeIds(arr);
                if (!selectedCollege && arr.length) {
                  const first = colleges?.find((c: any) => arr.includes(c.id));
                  if (first) setSelectedCollege(first);
                }
              }}
              onSelect={(deptId, collegeId) => {
                setSelectedDepartmentId(deptId);
                if (
                  collegeId &&
                  (!selectedCollege || selectedCollege.id !== collegeId)
                ) {
                  const found = colleges?.find((c: any) => c.id === collegeId);
                  if (found) setSelectedCollege(found);
                }
              }}
            />
          </div>
          <div className="border-t border-gray-300 my-4" />
          <div className="flex flex-col gap-2 mb-2">
            <PIMECIMTableHeader
              activeIMType={activeIMType}
              setActiveIMType={setActiveIMType}
              onCreate={() => setShowCreateModal(true)}
              onRefresh={() => setReloadTick((n) => n + 1)}
            />
            <div>
              {loading ? (
                <div className="text-gray-500">Loading evaluator IMs...</div>
              ) : error ? (
                <div className="text-meritRed">{error}</div>
              ) : activeIMType === "university" ? (
                <>
                  <IMTable
                    type="university"
                    data={
                      (selectedDepartmentId == null
                        ? filteredUniversity
                        : filteredUniversity.filter(
                            (im) => im.department_id === selectedDepartmentId
                          )) as any
                    }
                    loading={loading}
                    error={error}
                    actionsRole="PIMEC"
                  />
                  {!loading &&
                    !error &&
                    selectedDepartmentId != null &&
                    filteredUniversity.filter(
                      (im) => im.department_id === selectedDepartmentId
                    ).length === 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        No IMs for this department. Switch to All Departments or
                        refresh.
                      </div>
                    )}
                </>
              ) : activeIMType === "service" ? (
                <IMTable
                  type="service"
                  data={serviceRows as any}
                  loading={loading}
                  error={error}
                  actionsRole="PIMEC"
                />
              ) : (
                <>
                  <IMTable
                    type="all"
                    data={filteredAll as any}
                    loading={loading}
                    error={error}
                    actionsRole="PIMEC"
                  />
                  {!loading &&
                    !error &&
                    selectedDepartmentId != null &&
                    filteredAll.length === 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        No IMs for this department. Switch to All Departments or
                        refresh.
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative bg-white rounded-lg shadow-lg p-6 min-w-1/2 max-w-9/10 z-10">
                <button
                  className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                  type="button"
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-4">
                  Upload Instructional Material
                </h2>
                <CreateIMForm
                  selectedCollege={selectedCollege}
                  onCancel={() => setShowCreateModal(false)}
                  onCreated={() => {
                    setReloadTick((n) => n + 1);
                    setShowCreateModal(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
