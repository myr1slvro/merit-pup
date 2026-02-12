import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { useAuth } from "../../auth/AuthProvider";
import useUserColleges from "../../faculty/useUserColleges";
import CollegeButtonsRow from "../../shared/CollegeButtonsRow";
import IMTableHeader from "../../shared/IMTableHeader";
import IMTable from "../../shared/IMTable";
import useUecIMs from "./useUecIMs";
import { useNavigate } from "react-router-dom";
import UtldoIncludedDepartmentFilter from "./UtldoIncludedDepartmentFilter";

export default function UtldoEvaluationDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (colleges?.length && !selectedCollege) setSelectedCollege(colleges[0]);
  }, [colleges, selectedCollege]);

  const effectiveSelectedCollege = selectedCollege || colleges?.[0] || null;

  const { loading, error, collegeFiltered, deptCounts } = useUecIMs(
    effectiveSelectedCollege,
    reloadTick
  );

  useEffect(() => {
    setSelectedDepartmentId(null);
  }, [selectedCollege?.id]);

  // Helper to apply status filtering (null or "all" means no filter)
  const applyStatus = useMemo(() => {
    return (rows: any[]) => {
      if (!activeStatus) return rows;
      const norm = activeStatus.trim().toLowerCase();
      if (!norm || norm === "all") return rows;
      return rows.filter((im: any) => {
        const st = (im.status || "").toString().toLowerCase();
        return st === norm;
      });
    };
  }, [activeStatus]);

  const universityRows = useMemo(
    () => collegeFiltered.filter((im: any) => im.im_type === "university"),
    [collegeFiltered]
  );
  const serviceRows = useMemo(
    () => collegeFiltered.filter((im: any) => im.im_type === "service"),
    [collegeFiltered]
  );

  const displayedServiceRows = useMemo(
    () => applyStatus(serviceRows),
    [serviceRows, applyStatus]
  );
  const allRows = collegeFiltered;

  const filteredUniversity = useMemo(() => {
    let rows = universityRows;
    if (selectedDepartmentId !== null) {
      rows = rows.filter(
        (im: any) => im.department_id === selectedDepartmentId
      );
    }
    return applyStatus(rows);
  }, [universityRows, selectedDepartmentId, applyStatus]);

  // Apply department filter to all IMs (exclude service IMs when department selected)
  const filteredAll = useMemo(() => {
    const base =
      selectedDepartmentId === null
        ? allRows
        : allRows.filter((im: any) => {
            const isService = (im.im_type || "").toLowerCase() === "service";
            if (isService) return false;
            return im.department_id === selectedDepartmentId;
          });
    return applyStatus(base);
  }, [allRows, selectedDepartmentId, applyStatus]);

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

  function renderTable(rows: any[]) {
    return (
      <IMTable
        type={activeIMType === "all" ? "all" : activeIMType}
        data={rows as any}
        loading={loading}
        error={error}
        actionsRole="UTLDO, Technical Admin"
        extraActions={(row: any) => {
          const allowed = ["UTLDO Admin", "Technical Admin"];
          const role = user?.role || "";
          if (!allowed.includes(role)) return null;
          if (row.status !== "For UTLDO Evaluation") return null;
          return (
            <button
              onClick={() =>
                navigate(`/utldo/approval/${row.id}`, {
                  state: { s3_link: row.s3_link },
                })
              }
              className="px-2 py-1 rounded text-xs bg-immsRed text-white hover:bg-immsDarkRed"
            >
              Approval
            </button>
          );
        }}
      />
    );
  }

  return (
    <div className="p-8 m-16 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-immsRed" /> UTLDO Evaluation
      </h2>

      <div className="flex flex-col gap-3 mb-4">
        <CollegeButtonsRow
          colleges={colleges}
          selectedCollege={selectedCollege}
          loading={collegesLoading}
          error={collegesError}
          onSelect={handleCollegeSelect}
        />

        <UtldoIncludedDepartmentFilter
          selectedDepartmentId={selectedDepartmentId}
          counts={deptCounts}
          filterCollegeId={effectiveSelectedCollege?.id || null}
          onSelect={handleDepartmentSelect}
        />
      </div>

      <div className="border-t border-gray-300 my-4" />

      {selectedCollege && (
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-immsRed">
            {selectedCollege.name}
          </h3>
          <div className="flex flex-col gap-2 mb-2">
            <IMTableHeader
              activeIMType={activeIMType}
              setActiveIMType={setActiveIMType}
              onRefresh={() => setReloadTick((n) => n + 1)}
              hideCreate
              activeStatus={activeStatus}
              setActiveStatus={setActiveStatus}
              statusList={[
                "All",
                "Assigned to Faculty",
                "For PIMEC Evaluation",
                "For UTLDO Evaluation",
                "For Certification",
                "Certified",
              ]}
            />
            <div>
              {loading ? (
                <div className="text-gray-500">Loading UEC IMs...</div>
              ) : error ? (
                <div className="text-immsRed">{error}</div>
              ) : activeIMType === "university" ? (
                renderTable(filteredUniversity as any)
              ) : activeIMType === "service" ? (
                renderTable(displayedServiceRows as any)
              ) : (
                renderTable(filteredAll as any)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
