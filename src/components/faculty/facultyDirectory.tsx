import React, { useEffect, useMemo, useState } from "react";

import { FaUniversity } from "react-icons/fa";
import { FaRegFileLines } from "react-icons/fa6";

import { useAuth } from "../auth/AuthProvider";
import CollegeButtonsRow from "./CollegeButtonsRow";
import DepartmentFilter from "./DepartmentFilter";
import IMColumns from "./IMColumns";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getServiceIMsByCollege } from "../../api/serviceim";
import { getSubjectById } from "../../api/subject";

import useUserColleges from "./useUserColleges";
import {
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
  getDepartmentIdFromIM,
  getDepartmentsByCollegeId,
} from "../../api/department";

import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";

export default function FacultyDirectory() {
  const { authToken } = useAuth();
  const { colleges, loading, error } = useUserColleges();
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [universityIMs, setUniversityIMs] = useState<UniversityIM[]>([]);
  const [serviceIMs, setServiceIMs] = useState<ServiceIM[]>([]);
  const [imsLoading, setIMsLoading] = useState(false);
  const [imsError, setIMsError] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [departmentOptions, setDepartmentOptions] = useState<number[]>([]);

  useEffect(() => {
    if (colleges && colleges.length > 0 && !selectedCollege) {
      setSelectedCollege(colleges[0]);
    }
  }, [colleges, selectedCollege]);

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
      .then(async ([univ, serv]) => {
        const uims: any[] = Array.isArray(univ)
          ? univ
          : univ?.universityims || [];
        const sims: any[] = Array.isArray(serv) ? serv : serv?.serviceims || [];

        // Collect all unique subject_ids from both IM arrays
        const allIMs = [...uims, ...sims];
        const subjectIds = Array.from(
          new Set(
            allIMs
              .map((im) => im.subject_id)
              .filter((id) => typeof id === "number")
          )
        );

        // Fetch all subject names in parallel
        const subjectMap: Record<number, string> = {};
        await Promise.all(
          subjectIds.map(async (id) => {
            try {
              const subj = await getSubjectById(id, authToken);
              if (subj && subj.name) subjectMap[id] = subj.name;
            } catch {}
          })
        );

        // Attach subject name to each IM
        const attachSubjectName = (ims: any[]) =>
          ims.map((im) =>
            im.subject_id && subjectMap[im.subject_id]
              ? {
                  ...im,
                  subject: {
                    ...(im.subject || {}),
                    name: subjectMap[im.subject_id],
                  },
                }
              : im
          );

        setUniversityIMs(attachSubjectName(uims));
        setServiceIMs(attachSubjectName(sims));
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
  useEffect(() => {
    if (selectedCollege && authToken) {
      getDepartmentsByCollegeId(selectedCollege.id, authToken)
        .then((departments) => {
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

  return (
    <div className="ml-8 p-8 bg-white rounded-2xl shadow">
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
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-meritRed">
            {selectedCollege.name}
          </h3>
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
          <div className="border-t border-gray-300 my-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaRegFileLines className="text-meritRed" /> 
              Instructional Materials
            </h2>
            <button
              className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow"
            >
              + Create New Instructional Material
            </button>
          </div>
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
