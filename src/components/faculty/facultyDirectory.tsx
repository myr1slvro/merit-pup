import React, { useEffect, useMemo, useState } from "react";

import { FaUniversity } from "react-icons/fa";
import IMTableHeader from "./IMTableHeader";

import { useAuth } from "../auth/AuthProvider";
import CollegeButtonsRow from "./CollegeButtonsRow";
import DepartmentFilter from "./DepartmentFilter";
import IMTable from "./IMTable";
import CreateIMForm from "./CreateIMForm";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getServiceIMsByCollege } from "../../api/serviceim";
import { getSubjectById } from "../../api/subject";
import { getAllInstructionalMaterials } from "../../api/instructionalmaterial";

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
  const [universityIMs, setUniversityIMs] = useState<UniversityIM[]>([]); // base university IM entities
  const [serviceIMs, setServiceIMs] = useState<ServiceIM[]>([]); // base service IM entities
  const [imsLoading, setIMsLoading] = useState(false);
  const [imsError, setIMsError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [departmentOptions, setDepartmentOptions] = useState<number[]>([]);
  const [activeIMType, setActiveIMType] = useState<
    "university" | "service" | "all"
  >("university");
  const [allIMs, setAllIMs] = useState<any[]>([]); // full instructional materials (versions)
  const [allIMsLoading, setAllIMsLoading] = useState(false);
  const [allIMsError, setAllIMsError] = useState<string | null>(null);

  useEffect(() => {
    if (colleges && colleges.length > 0 && !selectedCollege) {
      setSelectedCollege(colleges[0]);
    }
  }, [colleges, selectedCollege]);

  // Fetch base University & Service IMs per college and reset department filter
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
  }, [selectedCollege?.id, authToken, reloadTick]);

  // Always fetch all instructional materials (first page) so we can enrich per-toggle tables with status/version metadata
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

  // IMs are now fetched per college, so no need to filter
  const filteredUniversityIMs = universityIMs;
  const filteredServiceIMs = serviceIMs;

  // Build latest instructional material metadata maps per base IM
  const latestUniversityIMMeta = useMemo(() => {
    const map = new Map<number, any>();
    allIMs
      .filter((im: any) => im.university_im_id)
      .forEach((im: any) => {
        const key = im.university_im_id;
        const prev = map.get(key);
        if (!prev) map.set(key, im);
        else {
          const prevDate = prev.updated_at
            ? new Date(prev.updated_at).getTime()
            : 0;
          const curDate = im.updated_at ? new Date(im.updated_at).getTime() : 0;
          if (curDate > prevDate) map.set(key, im);
        }
      });
    return map;
  }, [allIMs]);
  const latestServiceIMMeta = useMemo(() => {
    const map = new Map<number, any>();
    allIMs
      .filter((im: any) => im.service_im_id)
      .forEach((im: any) => {
        const key = im.service_im_id;
        const prev = map.get(key);
        if (!prev) map.set(key, im);
        else {
          const prevDate = prev.updated_at
            ? new Date(prev.updated_at).getTime()
            : 0;
          const curDate = im.updated_at ? new Date(im.updated_at).getTime() : 0;
          if (curDate > prevDate) map.set(key, im);
        }
      });
    return map;
  }, [allIMs]);

  // Enriched rows for University toggle
  const universityRows = useMemo(() => {
    if (!selectedCollege) return [] as any[];
    return filteredUniversityIMs.map((base) => {
      const meta = latestUniversityIMMeta.get(base.id);
      return {
        id: meta?.id || base.id, // prefer real IM id
        im_type: "University",
        department_id: (base as any).department_id,
        year_level: (base as any).year_level,
        subject_id: (base as any).subject_id,
        subject_name: (base as any).subject?.name,
        status: meta?.status || "-",
        validity: meta?.validity || "-",
        version: meta?.version || "-",
        updated_by: meta?.updated_by || "-",
        updated_at: meta?.updated_at || null,
      };
    });
  }, [filteredUniversityIMs, latestUniversityIMMeta, selectedCollege?.id]);

  // Enriched rows for Service toggle
  const serviceRows = useMemo(() => {
    if (!selectedCollege) return [] as any[];
    return filteredServiceIMs.map((base) => {
      const meta = latestServiceIMMeta.get(base.id);
      return {
        id: meta?.id || base.id,
        im_type: "Service",
        department_id: null,
        year_level: null,
        subject_id: (base as any).subject_id,
        subject_name: (base as any).subject?.name,
        status: meta?.status || "-",
        validity: meta?.validity || "-",
        version: meta?.version || "-",
        updated_by: meta?.updated_by || "-",
        updated_at: meta?.updated_at || null,
      };
    });
  }, [filteredServiceIMs, latestServiceIMMeta, selectedCollege?.id]);

  // Rows for All toggle (each instructional material entry) filtered by currently selected college
  const allRows = useMemo(() => {
    if (!selectedCollege) return [] as any[];
    return allIMs
      .filter((im: any) => {
        if (im.university_im_id) {
          const u = universityIMs.find((x) => x.id === im.university_im_id);
          return u && (u as any).college_id === selectedCollege.id;
        }
        if (im.service_im_id) {
          const s = serviceIMs.find((x) => x.id === im.service_im_id);
          return s && (s as any).college_id === selectedCollege.id;
        }
        return false;
      })
      .map((im: any) => {
        const baseU = im.university_im_id
          ? universityIMs.find((x) => x.id === im.university_im_id)
          : undefined;
        const baseS = im.service_im_id
          ? serviceIMs.find((x) => x.id === im.service_im_id)
          : undefined;
        return {
          id: im.id,
          im_type: im.im_type,
          department_id: baseU ? (baseU as any).department_id : null,
          year_level: baseU ? (baseU as any).year_level : null,
          subject_id: (baseU as any)?.subject_id || (baseS as any)?.subject_id,
          subject_name:
            (baseU as any)?.subject?.name || (baseS as any)?.subject?.name,
          status: im.status,
          validity: im.validity,
          version: im.version,
          updated_by: im.updated_by,
          updated_at: im.updated_at,
        };
      });
  }, [allIMs, selectedCollege?.id, universityIMs, serviceIMs]);

  // Fetch all instructional materials when toggled to 'all'
  useEffect(() => {
    if (activeIMType !== "all") return;
    if (!authToken) return;
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
  }, [activeIMType, authToken, reloadTick]);

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
          <div className="flex flex-col gap-2 mb-2">
            <IMTableHeader
              activeIMType={activeIMType}
              setActiveIMType={setActiveIMType}
              onCreate={() => setShowCreateModal(true)}
              onRefresh={() => setReloadTick((n) => n + 1)}
            />
            <div>
              {imsLoading ? (
                <div className="text-gray-500">Loading IMs...</div>
              ) : imsError ? (
                <div className="text-meritRed">{imsError}</div>
              ) : activeIMType === "university" ? (
                <IMTable
                  type="university"
                  data={universityRows as any}
                  loading={imsLoading || allIMsLoading}
                  error={imsError || allIMsError}
                  onRefresh={() => setReloadTick((n) => n + 1)}
                />
              ) : activeIMType === "service" ? (
                <IMTable
                  type="service"
                  data={serviceRows as any}
                  loading={imsLoading || allIMsLoading}
                  error={imsError || allIMsError}
                  onRefresh={() => setReloadTick((n) => n + 1)}
                />
              ) : (
                <IMTable
                  type="all"
                  data={allRows as any}
                  loading={allIMsLoading || imsLoading}
                  error={allIMsError || imsError}
                  onRefresh={() => setReloadTick((n) => n + 1)}
                />
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
                  Create Instructional Material
                </h2>
                <CreateIMForm
                  selectedCollege={selectedCollege}
                  onCancel={() => setShowCreateModal(false)}
                  onCreated={() => setReloadTick((n) => n + 1)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
