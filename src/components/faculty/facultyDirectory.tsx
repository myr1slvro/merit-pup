import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";
import CollegeButtonsRow from "../shared/CollegeButtonsRow";
import DepartmentFilter from "../shared/DepartmentFilter";
import IMTableHeader from "../shared/IMTableHeader";
import useUserColleges from "./useUserColleges";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getServiceIMsByCollege } from "../../api/serviceim";
import { getAllInstructionalMaterials } from "../../api/instructionalmaterial";
import {
  getDepartmentsByCollegeId,
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
} from "../../api/department";
import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";
import {
  type IMType,
  enrichIMsWithSubjects,
  buildLatestMetaMap,
  enrichBaseIMs,
  applyDepartmentFilter,
  filterByFacultyStatuses,
  deduplicateById,
  renderTable,
} from "../../utils/imDirectoryUtils";
import { useIMFilters } from "../../hooks/useIMFilters";

export default function FacultyDirectory() {
  const { authToken } = useAuth();
  const {
    colleges,
    loading: collegesLoading,
    error: collegesError,
  } = useUserColleges();

  // UI State
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [activeIMType, setActiveIMType] = useState<IMType>("all");
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Data State
  const [universityIMs, setUniversityIMs] = useState<UniversityIM[]>([]);
  const [serviceIMs, setServiceIMs] = useState<ServiceIM[]>([]);
  const [allIMs, setAllIMs] = useState<any[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<number[]>([]);

  // Loading State
  const [imsLoading, setIMsLoading] = useState(false);
  const [imsError, setIMsError] = useState<string | null>(null);
  const [allIMsLoading, setAllIMsLoading] = useState(false);
  const [allIMsError, setAllIMsError] = useState<string | null>(null);

  // Auto-select first college
  useEffect(() => {
    if (colleges?.length && !selectedCollege) {
      setSelectedCollege(colleges[0]);
    }
  }, [colleges, selectedCollege]);

  // Fetch departments for selected college
  useEffect(() => {
    if (!selectedCollege?.id || !authToken) {
      setDepartmentOptions([]);
      return;
    }

    getDepartmentsByCollegeId(selectedCollege.id, authToken)
      .then((departments) => {
        const ids = Array.isArray(departments)
          ? departments
              .map((d: any) => d.id)
              .filter((id: any) => typeof id === "number")
          : [];
        setDepartmentOptions(ids);
        if (ids.length) getDepartmentsByIdsCached(ids, authToken);
      })
      .catch(() => setDepartmentOptions([]));
  }, [selectedCollege?.id, authToken]);

  // Fetch University & Service IMs for selected college
  useEffect(() => {
    if (!selectedCollege?.id || !authToken) {
      setUniversityIMs([]);
      setServiceIMs([]);
      return;
    }

    setSelectedDepartmentId(null);
    setIMsLoading(true);
    setIMsError(null);

    Promise.all([
      getUniversityIMsByCollege(selectedCollege.id, authToken),
      getServiceIMsByCollege(selectedCollege.id, authToken),
    ])
      .then(async ([univResponse, servResponse]) => {
        const uims: any[] = Array.isArray(univResponse)
          ? univResponse
          : univResponse?.universityims || [];
        const sims: any[] = Array.isArray(servResponse)
          ? servResponse
          : servResponse?.serviceims || [];

        // Display IMs immediately
        console.log("University IMs received:", uims);
        console.log("Service IMs received:", sims);
        setUniversityIMs(uims);
        setServiceIMs(sims);
        setIMsLoading(false);

        // Enrich each type independently to avoid ID collisions between
        // university and service lists (both can share numeric IDs).
        await Promise.all([
          enrichIMsWithSubjects(uims, authToken, (enriched) => {
            setUniversityIMs(enriched as UniversityIM[]);
          }),
          enrichIMsWithSubjects(sims, authToken, (enriched) => {
            setServiceIMs(enriched as ServiceIM[]);
          }),
        ]);
      })
      .catch(() => {
        setIMsError("Failed to load IMs for this college.");
        setUniversityIMs([]);
        setServiceIMs([]);
        setIMsLoading(false);
      });
  }, [selectedCollege?.id, authToken, reloadTick]);

  // Fetch all instructional materials (for metadata enrichment)
  useEffect(() => {
    if (!authToken) {
      setAllIMs([]);
      return;
    }

    let cancelled = false;
    setAllIMsLoading(true);
    setAllIMsError(null);

    (async () => {
      const firstPage = await getAllInstructionalMaterials(authToken, 1);
      const firstList = Array.isArray(firstPage)
        ? firstPage
        : firstPage?.instructional_materials || [];
      const totalPages = Array.isArray(firstPage)
        ? 1
        : Number(firstPage?.pages || 1);

      if (totalPages <= 1) {
        if (!cancelled) setAllIMs(firstList);
        return;
      }

      const pageRequests = [];
      for (let page = 2; page <= totalPages; page += 1) {
        pageRequests.push(getAllInstructionalMaterials(authToken, page));
      }

      const remaining = await Promise.all(pageRequests);
      const merged = [...firstList];
      remaining.forEach((res) => {
        const list = Array.isArray(res)
          ? res
          : res?.instructional_materials || [];
        merged.push(...list);
      });

      if (!cancelled) setAllIMs(merged);
    })()
      .catch(() => setAllIMsError("Failed to load instructional materials."))
      .finally(() => setAllIMsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [authToken, reloadTick]);

  const { applyStatus } = useIMFilters(activeStatus);

  // Build latest metadata maps
  const latestUniversityIMMeta = useMemo(
    () => buildLatestMetaMap(allIMs, "university", "university_im_id"),
    [allIMs],
  );

  const latestServiceIMMeta = useMemo(
    () => buildLatestMetaMap(allIMs, "service", "service_im_id"),
    [allIMs],
  );

  // Build enriched table rows filtered by Faculty-visible statuses
  const universityRows = useMemo(
    () =>
      applyStatus(
        filterByFacultyStatuses(
          enrichBaseIMs(
            universityIMs,
            latestUniversityIMMeta,
            "University",
            selectedCollege?.id,
          ),
        ),
      ),
    [universityIMs, latestUniversityIMMeta, selectedCollege?.id, applyStatus],
  );

  const serviceRows = useMemo(
    () =>
      applyStatus(
        filterByFacultyStatuses(
          enrichBaseIMs(
            serviceIMs,
            latestServiceIMMeta,
            "Service",
            selectedCollege?.id,
          ),
        ),
      ),
    [serviceIMs, latestServiceIMMeta, selectedCollege?.id, applyStatus],
  );

  const allRows = useMemo(() => {
    if (!selectedCollege?.id) return [];

    const mergedRows = deduplicateById([...universityRows, ...serviceRows]);
    return applyDepartmentFilter(mergedRows, selectedDepartmentId);
  }, [selectedCollege?.id, universityRows, serviceRows, selectedDepartmentId]);

  const getDepartmentLabel = (deptId: number) => {
    const entry = getDepartmentCacheEntry(deptId);
    return entry?.abbreviation || entry?.name || `Department #${deptId}`;
  };

  return (
    <div className="mx-8 p-8 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-immsRed" /> My Colleges
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
          <h3 className="text-xl font-semibold mb-2 text-immsRed">
            {selectedCollege.name}
          </h3>

          <DepartmentFilter
            departmentIds={departmentOptions}
            selectedDepartmentId={selectedDepartmentId}
            onSelect={setSelectedDepartmentId}
            getLabel={getDepartmentLabel}
          />

          <div className="border-t border-gray-300 my-4" />

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
                "For Resubmission",
                "For Certification",
                "Certified",
                "Published",
              ]}
            />

            <div>
              {renderTable(
                activeIMType,
                {
                  university: universityRows,
                  service: serviceRows,
                  all: allRows,
                },
                {
                  loading: imsLoading || allIMsLoading,
                  error: imsError || allIMsError,
                  onRefresh: () => setReloadTick((n) => n + 1),
                },
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
