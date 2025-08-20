import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { FaUniversity } from "react-icons/fa";

import { getCollegeById } from "../../api/college";
import { getCollegesForUser } from "../../api/collegeincluded";
import { getServiceIMsByCollege } from "../../api/serviceim";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getSubjectById } from "../../api/subject";
import { getDepartmentById } from "../../api/department";

import type { CollegeIncluded } from "../../types/collegeincluded";
import type { College } from "../../types/college";
import type { ServiceIM } from "../../types/serviceim";
import type { UniversityIM } from "../../types/universityim";

export default function FacultyDirectory() {
  const { user, authToken } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [serviceIMs, setServiceIMs] = useState<ServiceIM[]>([]);
  const [universityIMs, setUniversityIMs] = useState<UniversityIM[]>([]);
  const [imsLoading, setIMsLoading] = useState(false);
  const [imsError, setIMsError] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [departmentCache, setDepartmentCache] = useState<
    Record<number, { name: string; abbreviation?: string }>
  >({});

  // Load colleges for the current user
  useEffect(() => {
    if (!user?.id || !authToken) return;
    setLoading(true);
    setError("");
    getCollegesForUser(user.id, authToken)
      .then(async (res: CollegeIncluded[]) => {
        if (!Array.isArray(res)) {
          setColleges([]);
          return;
        }
        // Fetch full college details for each college_id
        const collegeIds = res
          .map((ci) =>
            typeof ci.college_id === "string"
              ? parseInt(ci.college_id as any, 10)
              : ci.college_id
          )
          .filter((id): id is number => Number.isFinite(id as number));
        const collegePromises = collegeIds.map((id) =>
          getCollegeById(id, authToken)
        );
        const collegeResults = await Promise.all(collegePromises);
        // API may return the college object directly or { college: {...} }
        const mapped = collegeResults
          .map((result) => (result as any).college || result)
          .filter(
            (c: College) => !!c && c.id !== undefined && c.name !== undefined
          );
        setColleges(mapped);
      })
      .catch(() => {
        setColleges([]);
        setError("Failed to load colleges.");
      })
      .finally(() => setLoading(false));
  }, [user?.id, authToken]);

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
    const missing = departmentOptions.filter(
      (id) => departmentCache[id] === undefined
    );
    if (missing.length && authToken) {
      Promise.all(
        missing.map((id) =>
          getDepartmentById(id, authToken)
            .then((dep) => ({ id, dep }))
            .catch(() => null)
        )
      ).then((results) => {
        const updates: Record<number, { name: string; abbreviation?: string }> =
          {};
        results.forEach((r) => {
          if (r && r.dep) {
            const d = r.dep.department || r.dep;
            updates[r.id] = { name: d.name, abbreviation: d.abbreviation };
          }
        });
        if (Object.keys(updates).length) {
          setDepartmentCache((prev) => ({ ...prev, ...updates }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentOptions.join(","), authToken]);

  const filteredUniversityIMsByDept = selectedCollege
    ? selectedDepartmentId == null
      ? filteredUniversityIMs
      : filteredUniversityIMs.filter(
          (im) => getDepartmentIdFromUIM(im) === selectedDepartmentId
        )
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-meritRed" /> My Colleges
      </h2>
      <div className="flex flex-wrap gap-3 mb-6">
        {loading ? (
          <div className="text-gray-500">Loading colleges...</div>
        ) : error ? (
          <div className="text-meritRed">{error}</div>
        ) : colleges.length === 0 ? (
          <div className="text-gray-400 flex items-center gap-2">
            <FaUniversity />
            No colleges assigned.
          </div>
        ) : (
          colleges.map((c) => (
            <button
              key={c.id}
              className={`px-4 py-2 rounded-full border font-semibold transition-colors cursor-pointer ${
                selectedCollege?.id === c.id
                  ? "bg-meritRed text-white border-meritRed"
                  : "bg-white text-meritRed border-meritRed/40 hover:bg-meritRed/10"
              }`}
              title={c.name}
              onClick={async () => {
                setSelectedCollege(c);
                setIMsLoading(true);
                setIMsError("");
                if (!authToken) {
                  setIMsError("No auth token available.");
                  setServiceIMs([]);
                  setUniversityIMs([]);
                  setIMsLoading(false);
                  return;
                }
                try {
                  const [service, university] = await Promise.all([
                    getServiceIMsByCollege(c.id, authToken),
                    getUniversityIMsByCollege(c.id, authToken),
                  ]);
                  const serviceIMsRaw = Array.isArray(service)
                    ? service
                    : service.serviceims || [];
                  const universityIMsRaw = Array.isArray(university)
                    ? university
                    : university.universityims || [];

                  // Fetch missing subject details for Service IMs
                  const serviceIMsWithSubjects = await Promise.all(
                    serviceIMsRaw.map(async (im) => {
                      if (!im.subject && im.subject_id && authToken) {
                        try {
                          const subject = await getSubjectById(
                            im.subject_id,
                            authToken
                          );
                          return { ...im, subject };
                        } catch {
                          return im;
                        }
                      }
                      return im;
                    })
                  );

                  // Fetch missing subject details for University IMs
                  const universityIMsWithSubjects = await Promise.all(
                    universityIMsRaw.map(async (im) => {
                      if (!im.subject && im.subject_id && authToken) {
                        try {
                          const subject = await getSubjectById(
                            im.subject_id,
                            authToken
                          );
                          return { ...im, subject };
                        } catch {
                          return im;
                        }
                      }
                      return im;
                    })
                  );

                  setServiceIMs(serviceIMsWithSubjects);
                  setUniversityIMs(universityIMsWithSubjects);
                } catch (e) {
                  setIMsError("Failed to load IMs for this college.");
                  setServiceIMs([]);
                  setUniversityIMs([]);
                } finally {
                  setIMsLoading(false);
                }
              }}
            >
              {c.abbreviation}
            </button>
          ))
        )}
      </div>
      {selectedCollege && (
        <div className="flex flex-col mt-6">
          <h3 className="text-lg font-semibold mb-2 text-meritRed">
            {selectedCollege.name} IMs
          </h3>
          {/* Department filter (only after a college is selected) */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              className={`px-3 py-1 rounded-full border text-sm ${
                selectedDepartmentId == null
                  ? "bg-meritRed text-white border-meritRed"
                  : "bg-white text-meritRed border-meritRed/40 hover:bg-meritRed/10"
              }`}
              onClick={() => setSelectedDepartmentId(null)}
            >
              All Departments
            </button>
            {departmentOptions.map((deptId) => {
              let label =
                departmentCache[deptId]?.abbreviation ||
                departmentCache[deptId]?.name;
              if (!label) {
                const sample = universityIMs.find(
                  (im) => getDepartmentIdFromUIM(im) === deptId
                );
                label =
                  (sample as any)?.department?.abbreviation ||
                  (sample as any)?.department?.name ||
                  `Department #${deptId}`;
              }
              const active = selectedDepartmentId === deptId;
              return (
                <button
                  key={deptId}
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm ${
                    active
                      ? "bg-meritRed text-white border-meritRed"
                      : "bg-white text-meritRed border-meritRed/40 hover:bg-meritRed/10"
                  }`}
                  onClick={() => setSelectedDepartmentId(deptId)}
                  title={label}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {imsLoading ? (
            <div className="text-gray-500">Loading IMs...</div>
          ) : imsError ? (
            <div className="text-meritRed">{imsError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-2">University IMs</h4>
                {filteredUniversityIMsByDept.length === 0 ? (
                  <div className="text-gray-400">No University IMs.</div>
                ) : (
                  <ul className="space-y-2">
                    {filteredUniversityIMsByDept.map((im) => (
                      <li
                        key={im.id}
                        className="p-2 bg-gray-50 rounded border text-sm"
                      >
                        {im.subject?.name || `Subject #${im.subject_id}`} (Year{" "}
                        {im.year_level})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-bold mb-2">Service IMs</h4>
                {filteredServiceIMs.length === 0 ? (
                  <div className="text-gray-400">No Service IMs.</div>
                ) : (
                  <ul className="space-y-2">
                    {filteredServiceIMs.map((im) => (
                      <li
                        key={im.id}
                        className="p-2 bg-gray-50 rounded border text-sm"
                      >
                        {im.subject?.name || `Subject #${im.subject_id}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
