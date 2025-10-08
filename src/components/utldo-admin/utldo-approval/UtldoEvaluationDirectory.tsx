import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { useAuth } from "../../auth/AuthProvider";
import useUserColleges from "../../faculty/useUserColleges";
import CollegeButtonsRow from "../../shared/CollegeButtonsRow";
import DepartmentFilter from "../../shared/DepartmentFilter";
import IMTableHeader from "../../shared/IMTableHeader";
import IMTable from "../../shared/IMTable";
import useUecIMs from "./useUecIMs";
import { useNavigate } from "react-router-dom";
import useDepartmentLabels from "../../shared/useDepartmentLabels";
import {
  getDepartmentCacheEntry,
  getDepartmentsByIdsCached,
} from "../../../api/department";

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
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (colleges?.length && !selectedCollege) setSelectedCollege(colleges[0]);
  }, [colleges, selectedCollege]);

  const { loading, error, departmentIds, collegeFiltered } = useUecIMs(
    selectedCollege,
    reloadTick
  );
  const { labels: deptLabels } = useDepartmentLabels(departmentIds);

  useEffect(() => {
    setSelectedDepartmentId(null);
  }, [selectedCollege?.id]);

  const universityRows = useMemo(
    () => collegeFiltered.filter((im: any) => im.im_type === "university"),
    [collegeFiltered]
  );
  const serviceRows = useMemo(
    () => collegeFiltered.filter((im: any) => im.im_type === "service"),
    [collegeFiltered]
  );
  const allRows = collegeFiltered;

  const filteredUniversity = useMemo(() => {
    if (selectedDepartmentId == null) return universityRows;
    return universityRows.filter(
      (im: any) => im.department_id === selectedDepartmentId
    );
  }, [universityRows, selectedDepartmentId]);

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
              className="px-2 py-1 rounded text-xs bg-meritRed text-white hover:bg-meritDarkRed"
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
        <FaUniversity className="text-meritRed" /> UTLDO Evaluation
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
            getLabel={(id) => {
              const entry = getDepartmentCacheEntry(id);
              if (entry)
                return entry.abbreviation || entry.name || `Dept #${id}`;
              // Fallback until cache filled
              return `Dept #${id}`;
            }}
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
                <div className="text-gray-500">Loading UEC IMs...</div>
              ) : error ? (
                <div className="text-meritRed">{error}</div>
              ) : activeIMType === "university" ? (
                renderTable(filteredUniversity as any)
              ) : activeIMType === "service" ? (
                renderTable(serviceRows as any)
              ) : (
                renderTable(allRows as any)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
