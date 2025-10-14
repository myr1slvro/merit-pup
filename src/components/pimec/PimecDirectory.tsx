import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import useUserColleges from "../faculty/useUserColleges";
import CollegeButtonsRow from "../shared/CollegeButtonsRow";
import PIMECIMTableHeader from "./PIMECIMTableHeader";
import IMTable from "../shared/IMTable";
import useEvaluatorIMs from "./useEvaluatorIMs";
import PimecIncludedDepartmentFilter from "./PimecIncludedDepartmentFilter";
import CreateIMForm from "./CreateIMForm";

type IMType = "university" | "service" | "all";

export default function PimecDirectory() {
  const { colleges } = useUserColleges();
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [activeIMType, setActiveIMType] = useState<IMType>("all");
  const [reloadTick, setReloadTick] = useState(0);
  const [needsOnly, setNeedsOnly] = useState(true); // Show only "For PIMEC Evaluation" IMs
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Auto-select first college
  useEffect(() => {
    if (!selectedCollege && colleges?.length) {
      setSelectedCollege(colleges[0]);
    }
  }, [colleges, selectedCollege]);

  const effectiveSelectedCollege = selectedCollege || colleges?.[0] || null;

  const { loading, error, collegeFiltered, deptCounts } = useEvaluatorIMs(
    effectiveSelectedCollege,
    reloadTick,
    null,
    needsOnly
  );

  // Filter by IM type
  const universityRows = useMemo(
    () =>
      (collegeFiltered || []).filter(
        (im: any) => (im.im_type || "").toLowerCase() === "university"
      ),
    [collegeFiltered]
  );

  const serviceRows = useMemo(
    () =>
      (collegeFiltered || []).filter(
        (im: any) => (im.im_type || "").toLowerCase() === "service"
      ),
    [collegeFiltered]
  );

  // Apply department filter to university IMs
  const filteredUniversity = useMemo(() => {
    if (selectedDepartmentId === null) return universityRows;
    return universityRows.filter(
      (im: any) => im.department_id === selectedDepartmentId
    );
  }, [universityRows, selectedDepartmentId]);

  // Apply department filter to all IMs (exclude service IMs when department selected)
  const filteredAll = useMemo(() => {
    if (selectedDepartmentId === null) return collegeFiltered || [];
    return (collegeFiltered || []).filter((im: any) => {
      const isService = (im.im_type || "").toLowerCase() === "service";
      if (isService) return false;
      return im.department_id === selectedDepartmentId;
    });
  }, [collegeFiltered, selectedDepartmentId]);

  function handleCollegeSelect(c: any) {
    setSelectedCollege(c);
    setSelectedDepartmentId(null);
    setReloadTick((n) => n + 1);
  }

  function handleDepartmentSelect(
    deptId: number | null,
    collegeId?: number | null
  ) {
    setSelectedDepartmentId(deptId);
    if (collegeId && (!selectedCollege || selectedCollege.id !== collegeId)) {
      const found = colleges?.find((c: any) => c.id === collegeId);
      if (found) setSelectedCollege(found);
    }
  }

  function handleCreateModalClose() {
    setReloadTick((n) => n + 1);
    setShowCreateModal(false);
  }

  return (
    <div className="mx-8 p-8 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <FaUniversity className="text-meritRed" /> PIMEC Evaluation
      </h2>

      <div className="flex flex-col">
        <div className="flex flex-col gap-3 mb-4">
          <CollegeButtonsRow
            colleges={colleges}
            selectedCollege={selectedCollege}
            loading={false}
            error=""
            onSelect={handleCollegeSelect}
          />

          <PimecIncludedDepartmentFilter
            selectedDepartmentId={selectedDepartmentId}
            counts={deptCounts}
            filterCollegeId={effectiveSelectedCollege?.id || null}
            onSelect={handleDepartmentSelect}
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
                  data={filteredUniversity as any}
                  loading={loading}
                  error={error}
                  actionsRole="PIMEC"
                  showEvaluate={true}
                />
                {!loading &&
                  !error &&
                  selectedDepartmentId !== null &&
                  filteredUniversity.length === 0 && (
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
                showEvaluate={true}
              />
            ) : (
              <>
                <IMTable
                  type="all"
                  data={filteredAll as any}
                  loading={loading}
                  error={error}
                  actionsRole="PIMEC"
                  showEvaluate={true}
                />
                {!loading &&
                  !error &&
                  selectedDepartmentId !== null &&
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
                Assign Instructional Material
              </h2>
              <CreateIMForm
                selectedCollege={selectedCollege}
                onCancel={() => setShowCreateModal(false)}
                onCreated={handleCreateModalClose}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
