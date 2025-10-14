import React, { useEffect, useMemo, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";
import CollegeButtonsRow from "../shared/CollegeButtonsRow";
import DepartmentFilter from "../shared/DepartmentFilter";
import IMTable from "../shared/IMTable";
import IMTableHeader from "../shared/IMTableHeader";
import useUserColleges from "./useUserColleges";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getServiceIMsByCollege } from "../../api/serviceim";
import { getAllInstructionalMaterials } from "../../api/instructionalmaterial";
import { getSubjectById } from "../../api/subject";
import {
  getDepartmentsByCollegeId,
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
} from "../../api/department";
import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";

type IMType = "university" | "service" | "all";

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
        setUniversityIMs(uims);
        setServiceIMs(sims);
        setIMsLoading(false);

        // Enrich with subject names in background
        await enrichIMsWithSubjects(
          [...uims, ...sims],
          authToken,
          (enriched) => {
            setUniversityIMs(
              enriched.filter((im) => uims.find((u) => u.id === im.id))
            );
            setServiceIMs(
              enriched.filter((im) => sims.find((s) => s.id === im.id))
            );
          }
        );
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

    setAllIMsLoading(true);
    setAllIMsError(null);

    getAllInstructionalMaterials(authToken, 1)
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : res?.instructional_materials || [];
        setAllIMs(list);
      })
      .catch(() => setAllIMsError("Failed to load instructional materials."))
      .finally(() => setAllIMsLoading(false));
  }, [authToken, reloadTick]);

  // Build latest metadata maps
  const latestUniversityIMMeta = useMemo(
    () => buildLatestMetaMap(allIMs, "university", "university_im_id"),
    [allIMs]
  );

  const latestServiceIMMeta = useMemo(
    () => buildLatestMetaMap(allIMs, "service", "service_im_id"),
    [allIMs]
  );

  // Build enriched table rows filtered by Faculty-visible statuses
  const universityRows = useMemo(
    () =>
      filterByFacultyStatuses(
        enrichBaseIMs(
          universityIMs,
          latestUniversityIMMeta,
          "University",
          selectedCollege?.id
        )
      ),
    [universityIMs, latestUniversityIMMeta, selectedCollege?.id]
  );

  const serviceRows = useMemo(
    () =>
      filterByFacultyStatuses(
        enrichBaseIMs(
          serviceIMs,
          latestServiceIMMeta,
          "Service",
          selectedCollege?.id
        )
      ),
    [serviceIMs, latestServiceIMMeta, selectedCollege?.id]
  );

  const allRows = useMemo(() => {
    if (!selectedCollege?.id) return [];

    const rows = allIMs
      .filter((im) =>
        belongsToCollege(im, universityIMs, serviceIMs, selectedCollege.id)
      )
      .map((im) => buildAllRow(im, universityIMs, serviceIMs));

    return applyDepartmentFilter(
      deduplicateById(filterByFacultyStatuses(rows)),
      selectedDepartmentId
    );
  }, [
    allIMs,
    selectedCollege?.id,
    universityIMs,
    serviceIMs,
    selectedDepartmentId,
  ]);

  const getDepartmentLabel = (deptId: number) => {
    const entry = getDepartmentCacheEntry(deptId);
    return entry?.abbreviation || entry?.name || `Department #${deptId}`;
  };

  return (
    <div className="mx-8 p-8 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-meritRed" /> My Colleges
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
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Functions

async function enrichIMsWithSubjects(
  ims: any[],
  authToken: string,
  onComplete: (enriched: any[]) => void
) {
  const subjectIds = Array.from(
    new Set(ims.map((im) => im.subject_id).filter(Boolean))
  );
  const subjectMap: Record<number, string> = {};

  await Promise.all(
    subjectIds.map(async (id) => {
      try {
        const subj = await getSubjectById(id, authToken);
        if (subj?.name) subjectMap[id] = subj.name;
      } catch {}
    })
  );

  const enriched = ims.map((im) =>
    im.subject_id && subjectMap[im.subject_id]
      ? {
          ...im,
          subject: { ...(im.subject || {}), name: subjectMap[im.subject_id] },
        }
      : im
  );

  onComplete(enriched);
}

function buildLatestMetaMap(
  allIMs: any[],
  type: string,
  idKey: string
): Map<number, any> {
  const map = new Map<number, any>();

  allIMs
    .filter((im) => im[idKey] && (im.im_type || "").toLowerCase() === type)
    .forEach((im) => {
      const key = im[idKey];
      const existing = map.get(key);

      if (!existing || getTimestamp(im) > getTimestamp(existing)) {
        map.set(key, im);
      }
    });

  return map;
}

function enrichBaseIMs(
  baseIMs: any[],
  metaMap: Map<number, any>,
  defaultType: string,
  collegeId?: number
): any[] {
  if (!collegeId) return [];

  const rows = baseIMs.map((base) => {
    const meta = metaMap.get(base.id);
    return {
      id: meta?.id || base.id,
      im_type: meta?.im_type || defaultType,
      department_id: base.department_id || null,
      year_level: base.year_level || null,
      subject_id: base.subject_id,
      subject_name: base.subject?.name,
      status: meta?.status || "-",
      validity: meta?.validity || "-",
      version: meta?.version || "-",
      updated_by: meta?.updated_by || "-",
      updated_at: meta?.updated_at || null,
    };
  });

  return deduplicateById(rows);
}

function belongsToCollege(
  im: any,
  universityIMs: any[],
  serviceIMs: any[],
  collegeId: number
): boolean {
  if (im.university_im_id) {
    const base = universityIMs.find((x) => x.id === im.university_im_id);
    return base?.college_id === collegeId;
  }
  if (im.service_im_id) {
    const base = serviceIMs.find((x) => x.id === im.service_im_id);
    return base?.college_id === collegeId;
  }
  return false;
}

function buildAllRow(im: any, universityIMs: any[], serviceIMs: any[]): any {
  const baseU = im.university_im_id
    ? universityIMs.find((x) => x.id === im.university_im_id)
    : undefined;
  const baseS = im.service_im_id
    ? serviceIMs.find((x) => x.id === im.service_im_id)
    : undefined;

  return {
    id: im.id,
    im_type: im.im_type,
    department_id: baseU?.department_id || null,
    year_level: baseU?.year_level || null,
    subject_id: baseU?.subject_id || baseS?.subject_id,
    subject_name: baseU?.subject?.name || baseS?.subject?.name,
    status: im.status,
    validity: im.validity,
    version: im.version,
    updated_by: im.updated_by,
    updated_at: im.updated_at,
  };
}

function applyDepartmentFilter(
  rows: any[],
  departmentId: number | null
): any[] {
  if (departmentId === null) return rows;

  return rows.filter(
    (row) =>
      (row.im_type || "").toLowerCase() !== "service" &&
      row.department_id === departmentId
  );
}

function filterByFacultyStatuses(rows: any[]): any[] {
  const ALLOWED_FACULTY_STATUSES = ["assigned to faculty", "for resubmission"];

  return rows.filter((row) => {
    const statusNorm = String(row.status || "").toLowerCase();
    return ALLOWED_FACULTY_STATUSES.includes(statusNorm);
  });
}

function deduplicateById(rows: any[]): any[] {
  const seen = new Set<number>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function getTimestamp(im: any): number {
  return im.updated_at ? new Date(im.updated_at).getTime() : 0;
}

function renderTable(
  type: IMType,
  data: Record<IMType, any[]>,
  options: { loading: boolean; error: string | null; onRefresh: () => void }
) {
  const { loading, error, onRefresh } = options;

  if (loading) return <div className="text-gray-500">Loading IMs...</div>;
  if (error) return <div className="text-meritRed">{error}</div>;

  return (
    <IMTable
      type={type}
      data={data[type]}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
    />
  );
}
