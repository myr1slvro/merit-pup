import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getDepartmentsForSubject,
  createSubjectDepartment,
  deleteSubjectDepartment,
} from "../../../api/subject_department";
import {
  getAllDepartments,
  getDepartmentsByCollegeId,
  getDepartmentsByIdsCached,
} from "../../../api/department";
import { getAllColleges } from "../../../api/college";
import type { Department } from "../../../types/department";
import type { Subject } from "../../../types/subject";
import type { College } from "../../../types/college";

type Props = {
  subject: Subject;
  collegeId?: number;
  onClose: () => void;
  onChanged?: () => void;
};

export default function SubjectDepartmentsModal({
  subject,
  collegeId,
  onClose,
  onChanged,
}: Props) {
  const { authToken } = useAuth();
  // Loading states
  const [linkedLoading, setLinkedLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [linkedIds, setLinkedIds] = useState<number[]>([]);
  const [linkedDetails, setLinkedDetails] = useState<
    Record<number, { name: string; abbreviation: string }>
  >({});
  const [allDeps, setAllDeps] = useState<Department[]>([]);
  const [pick, setPick] = useState<number | "">("");
  // College filter state (local, user-changeable)
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | "">(
    typeof collegeId === "number" ? collegeId : ""
  );
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  // Load linked department ids and resolve details (once per subject)
  async function loadLinked() {
    if (!authToken) return;
    setLinkedLoading(true);
    setError("");
    try {
      // Load linked departments for this subject
      const resLinked = await getDepartmentsForSubject(subject.id, authToken);
      const rawLinked: any[] = Array.isArray(resLinked)
        ? resLinked
        : resLinked?.departments || resLinked?.data || [];
      // Extract department_id numbers only
      const ids: number[] = rawLinked
        .map((item: any) => {
          const rawId =
            (typeof item === "number" ? item : undefined) ??
            item?.department_id ??
            item?.id ??
            item?.department?.id;
          const n = typeof rawId === "string" ? parseInt(rawId, 10) : rawId;
          return Number.isFinite(n) ? (n as number) : undefined;
        })
        .filter((v: any): v is number => typeof v === "number");
      const uniqueIds = Array.from(new Set(ids));
      setLinkedIds(uniqueIds);

      // Resolve details via cached bulk helper
      const map = await getDepartmentsByIdsCached(uniqueIds, authToken);
      const normalized: Record<number, { name: string; abbreviation: string }> =
        {};
      Object.keys(map || {}).forEach((k) => {
        const id = parseInt(k, 10);
        const entry = (map as any)[id];
        if (entry) {
          normalized[id] = {
            name: entry.name || "",
            abbreviation: entry.abbreviation || "",
          };
        }
      });
      setLinkedDetails(normalized);
    } catch (e: any) {
      setError(e?.message || "Failed to load linked departments");
      setLinkedIds([]);
      setLinkedDetails({});
    } finally {
      setLinkedLoading(false);
    }
  }

  // Load candidate departments (filtered by selected college)
  async function loadCandidates() {
    if (!authToken) return;
    setCandidatesLoading(true);
    try {
      let candidates: any = [];
      if (selectedCollegeId !== "") {
        candidates = await getDepartmentsByCollegeId(
          selectedCollegeId as number,
          authToken
        );
        candidates = Array.isArray(candidates)
          ? candidates
          : candidates?.departments || candidates?.data || [];
      } else {
        candidates = await getAllDepartments(authToken);
        candidates = Array.isArray(candidates)
          ? candidates
          : candidates?.departments || candidates?.data || [];
      }
      setAllDeps(candidates);
    } catch (e: any) {
      setError(e?.message || "Failed to load departments");
      setAllDeps([]);
    } finally {
      setCandidatesLoading(false);
    }
  }

  useEffect(() => {
    loadLinked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.id, authToken]);

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollegeId, authToken]);

  // When parent prop changes (deep-link), update dropdown selection
  useEffect(() => {
    if (typeof collegeId === "number") {
      setSelectedCollegeId(collegeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  // Load colleges for dropdown
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function fetchColleges() {
      setCollegesLoading(true);
      try {
        const res = await getAllColleges(authToken as string);
        const list: any[] = Array.isArray(res)
          ? res
          : res?.colleges || res?.data || [];
        if (!cancelled) setColleges(list as College[]);
      } catch {
        if (!cancelled) setColleges([]);
      } finally {
        if (!cancelled) setCollegesLoading(false);
      }
    }
    fetchColleges();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const available = useMemo(() => {
    const set = new Set(linkedIds);
    return allDeps.filter((d) => !set.has(d.id));
  }, [linkedIds, allDeps]);

  async function handleAdd() {
    if (!authToken || !pick || typeof pick !== "number") return;
    setSaving(true);
    setError("");
    try {
      await createSubjectDepartment(subject.id, pick, authToken);
      await Promise.all([loadLinked(), loadCandidates()]);
      if (onChanged) onChanged();
      setPick("");
    } catch (e: any) {
      setError(e?.message || "Failed to add department");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(depId: number) {
    if (!authToken) return;
    setSaving(true);
    setError("");
    try {
      await deleteSubjectDepartment(subject.id, depId, authToken);
      await Promise.all([loadLinked(), loadCandidates()]);
      if (onChanged) onChanged();
    } catch (e: any) {
      setError(e?.message || "Failed to remove department");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg p-6 min-w-[480px] max-w-[90vw] z-10">
        <button
          className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2 text-left">
          Manage Departments for {subject.code}
        </h2>
        <div className="mb-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="collegeFilter" className="block text-gray-700 mb-1">
              College filter
            </label>
            <div className="flex gap-x-2">
              <select
                id="collegeFilter"
                className="border rounded px-2 py-1 text-sm min-w-[260px]"
                value={selectedCollegeId as any}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedCollegeId(v ? Number(v) : "");
                  setPick("");
                }}
              >
                {collegesLoading ? (
                  <option value="" disabled>
                    Loading colleges...
                  </option>
                ) : (
                  <option value="">All colleges</option>
                )}
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.abbreviation ? `${c.abbreviation} — ${c.name}` : c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                onClick={() => {
                  setSelectedCollegeId("");
                  setPick("");
                }}
                disabled={selectedCollegeId === ""}
              >
                Clear
              </button>
            </div>
          </div>
          <p className="text-gray-500 mt-1">
            Only departments from the selected college are available to link.
          </p>
        </div>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-sm mb-2">Linked Departments</h3>
            {linkedLoading ? (
              <div className="flex items-center text-xs text-gray-500">
                <span className="inline-block w-3 h-3 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Loading linked departments...
              </div>
            ) : linkedIds.length ? (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {linkedIds.map((depId) => {
                  const details = linkedDetails[depId];
                  const abbr = details?.abbreviation || `#${depId}`;
                  const name = details?.name || "";
                  return (
                    <li
                      key={depId}
                      className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-sm"
                    >
                      <span>
                        <span className="font-mono mr-2">{abbr}</span>
                        {name && <span className="text-gray-700">{name}</span>}
                      </span>
                      <button
                        className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50"
                        onClick={() => handleRemove(depId)}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">None linked yet.</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Add Department</h3>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-1 text-sm min-w-[260px]"
                value={pick as any}
                onChange={(e) =>
                  setPick(e.target.value ? Number(e.target.value) : "")
                }
                disabled={candidatesLoading}
              >
                {candidatesLoading ? (
                  <option value="" disabled>
                    Loading departments...
                  </option>
                ) : (
                  <option value="">Select department...</option>
                )}
                {available.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.abbreviation} — {d.name}
                  </option>
                ))}
              </select>
              <button
                className="px-3 py-1 text-sm bg-meritRed text-white rounded disabled:opacity-60"
                onClick={handleAdd}
                disabled={saving || !pick || candidatesLoading}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
