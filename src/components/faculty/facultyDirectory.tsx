import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { FaUniversity } from "react-icons/fa";
import CollegeButtonsRow from "./CollegeButtonsRow";
import DepartmentFilter from "./DepartmentFilter";
import IMColumns from "./IMColumns";
import { useState as useReactState } from "react";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getServiceIMsByCollege } from "../../api/serviceim";

import useUserColleges from "./useUserColleges";
import {
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
  getDepartmentIdFromIM,
  getDepartmentsByCollegeId,
} from "../../api/department";

import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";

const { authToken } = useAuth();
const { colleges, loading, error } = useUserColleges();
const [selectedCollege, setSelectedCollege] = useReactState<any>(null);
const [universityIMs, setUniversityIMs] = useReactState<UniversityIM[]>([]);
const [serviceIMs, setServiceIMs] = useReactState<ServiceIM[]>([]);
const [imsLoading, setIMsLoading] = useReactState(false);
const [imsError, setIMsError] = useReactState<string | null>(null);
const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(
  null
);

// Fetch IMs per college and reset department filter
useEffect(() => {
  setSelectedDepartmentId(null);
  if (!selectedCollege || !authToken) {
    setUniversityIMs([]);
    setServiceIMs([]);
    return;
  }
  setIMsLoading(true);
  setIMsError(null);
  Promise.all([
    getUniversityIMsByCollege(selectedCollege.id, authToken),
    getServiceIMsByCollege(selectedCollege.id, authToken),
  ])
    .then(([univ, serv]) => {
      setUniversityIMs(Array.isArray(univ) ? univ : univ?.universityims || []);
      setServiceIMs(Array.isArray(serv) ? serv : serv?.serviceims || []);
    })
    .catch((e) => {
      setIMsError("Failed to load IMs for this college.");
      setUniversityIMs([]);
      setServiceIMs([]);
    })
    .finally(() => setIMsLoading(false));
}, [selectedCollege?.id, authToken]);

// IMs are now fetched per college, so no need to filter
const filteredUniversityIMs = universityIMs;
const filteredServiceIMs = serviceIMs;

// Department options fetched from API for selected college
const [departmentOptions, setDepartmentOptions] = useState<number[]>([]);
useEffect(() => {
  if (selectedCollege && authToken) {
    getDepartmentsByCollegeId(selectedCollege.id, authToken)
      .then((departments) => {
        // departments is expected to be an array of department objects
        setDepartmentOptions(
          Array.isArray(departments)
            ? departments
                .map((d: any) => d.id)
                .filter((id: any) => typeof id === "number")
            : []
        );
      })
      .catch(() => setDepartmentOptions([]));
  } else {
    setDepartmentOptions([]);
  }
}, [selectedCollege?.id, authToken]);

// Fetch department details for pills if missing
useEffect(() => {
  if (departmentOptions.length && authToken) {
    getDepartmentsByIdsCached(departmentOptions, authToken);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [departmentOptions, authToken]);

const filteredUniversityIMsByDept = useMemo(() => {
  if (!selectedCollege) return [] as UniversityIM[];
  if (selectedDepartmentId == null) return filteredUniversityIMs;
  return filteredUniversityIMs.filter(
    (im) => getDepartmentIdFromIM(im) === selectedDepartmentId
  );
}, [selectedCollege?.id, selectedDepartmentId, filteredUniversityIMs]);

export default function FacultyDirectory() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-meritRed" /> My Colleges
      </h2>
      <CollegeButtonsRow
        colleges={colleges}
        selectedCollege={selectedCollege}
        loading={loading}
        error={error}
        onSelect={setSelectedCollege}
      />
      {selectedCollege && (
        <div className="flex flex-col mt-6">
          <h3 className="text-lg font-semibold mb-2 text-meritRed">
            {selectedCollege.name} IMs
          </h3>
          {/* Department filter (only after a college is selected) */}
          <DepartmentFilter
            departmentIds={departmentOptions}
            selectedDepartmentId={selectedDepartmentId}
            onSelect={setSelectedDepartmentId}
            getLabel={(deptId) => {
              const cacheEntry = getDepartmentCacheEntry(deptId);
              const cached = cacheEntry?.abbreviation || cacheEntry?.name;
              if (cached) return cached;
              const sample = universityIMs.find(
                (im) => getDepartmentIdFromIM(im) === deptId
              );
              return (
                (sample as any)?.department?.abbreviation ||
                (sample as any)?.department?.name ||
                `Department #${deptId}`
              );
            }}
          />
          {imsLoading ? (
            <div className="text-gray-500">Loading IMs...</div>
          ) : imsError ? (
            <div className="text-meritRed">{imsError}</div>
          ) : (
            <IMColumns
              universityIMs={filteredUniversityIMsByDept}
              serviceIMs={filteredServiceIMs}
            />
          )}
        </div>
      )}
    </div>
  );
}
