import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { FaUniversity } from "react-icons/fa";
import CollegeButtonsRow from "./CollegeButtonsRow";
import DepartmentFilter from "./DepartmentFilter";
import IMColumns from "./IMColumns";
import useCollegeIMs from "./useCollegeIMs";

import useUserColleges from "./useUserColleges";
import {
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
} from "../../api/department";

import type { UniversityIM } from "../../types/universityim";

export default function FacultyDirectory() {
  const { user, authToken } = useAuth();
  const { colleges, loading, error } = useUserColleges();
  const {
    selectedCollege,
    serviceIMs,
    universityIMs,
    imsLoading,
    imsError,
    selectCollege,
  } = useCollegeIMs();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);

  // Reset department filter when college changes
  useEffect(() => {
    setSelectedDepartmentId(null);
  }, [selectedCollege?.id]);

  // Helpers to support both FK id fields and nested objects
  const parseId = (raw: unknown): number | undefined => {
    if (raw == null) return undefined;
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };
  const getCollegeIdFromUIM = (im: UniversityIM) =>
    parseId((im as any).college_id ?? (im as any).college?.id);
  const getDepartmentIdFromUIM = (im: UniversityIM) =>
    parseId((im as any).department_id ?? (im as any).department?.id);

  // Helper to extract college id from an IM that may have either `college?.id` or `college_id`
  const getCollegeIdFromIM = (im: any): number | undefined => {
    const raw = im?.college?.id ?? im?.college_id;
    if (raw == null) return undefined;
    const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
    return Number.isFinite(n) ? (n as number) : undefined;
  };

  const filteredUniversityIMs = selectedCollege
    ? universityIMs.filter(
        (im) => getCollegeIdFromIM(im) === selectedCollege.id
      )
    : [];
  const filteredServiceIMs = selectedCollege
    ? serviceIMs.filter((im) => getCollegeIdFromIM(im) === selectedCollege.id)
    : [];

  // Department filter options derived from university IMs under the selected college
  const departmentOptions: number[] = selectedCollege
    ? Array.from(
        new Set(
          filteredUniversityIMs
            .map((im) => getDepartmentIdFromUIM(im))
            .filter((id): id is number => typeof id === "number")
        )
      )
    : [];

  // Fetch department details for pills if missing
  useEffect(() => {
    if (departmentOptions.length && authToken) {
      // Prefill API cache for these departments; no local state needed
      getDepartmentsByIdsCached(departmentOptions, authToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentOptions.join(","), authToken]);

  const filteredUniversityIMsByDept = useMemo(() => {
    if (!selectedCollege) return [] as UniversityIM[];
    if (selectedDepartmentId == null) return filteredUniversityIMs;
    return filteredUniversityIMs.filter(
      (im) => getDepartmentIdFromUIM(im) === selectedDepartmentId
    );
  }, [selectedCollege?.id, selectedDepartmentId, filteredUniversityIMs]);

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
        onSelect={selectCollege}
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
                (im) => getDepartmentIdFromUIM(im) === deptId
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
