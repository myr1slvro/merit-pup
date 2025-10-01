import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getForPIMEC } from "../../api/instructionalmaterial";
import { getDepartmentsByCollegeId } from "../../api/department";
import { getSubjectById } from "../../api/subject";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { getServiceIMsByCollege } from "../../api/serviceim";

export default function useEvaluatorIMs(
  selectedCollege: any,
  reloadTick: number,
  departmentId?: number | null,
  needsOnly?: boolean
) {
  const { authToken } = useAuth();
  const [rawIMs, setRawIMs] = useState<any[]>([]); // raw instructional_material entries
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({});
  const [baseUniversityIMs, setBaseUniversityIMs] = useState<any[]>([]);
  const [baseServiceIMs, setBaseServiceIMs] = useState<any[]>([]);

  // Fetch all evaluator IMs (page 1 for now) and department ids for selected college
  useEffect(() => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    getForPIMEC(authToken, 1, departmentId || undefined)
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : res?.instructional_materials || [];
        const filtered = needsOnly
          ? list.filter((im: any) => im.status === "For PIMEC Evaluation")
          : list;
        setRawIMs(filtered);
      })
      .catch(() => setError("Failed to load evaluator IMs."))
      .finally(() => setLoading(false));
  }, [authToken, reloadTick, departmentId, needsOnly]);

  // Fetch base University & Service IMs for selected college (needed to derive college + dept + subject info)
  useEffect(() => {
    if (!selectedCollege?.id || !authToken) {
      setBaseUniversityIMs([]);
      setBaseServiceIMs([]);
      return;
    }
    Promise.all([
      getUniversityIMsByCollege(selectedCollege.id, authToken),
      getServiceIMsByCollege(selectedCollege.id, authToken),
    ])
      .then(([uRes, sRes]) => {
        const uims = Array.isArray(uRes) ? uRes : uRes?.universityims || [];
        const sims = Array.isArray(sRes) ? sRes : sRes?.serviceims || [];
        setBaseUniversityIMs(uims);
        setBaseServiceIMs(sims);
      })
      .catch(() => {
        setBaseUniversityIMs([]);
        setBaseServiceIMs([]);
      });
  }, [selectedCollege?.id, authToken, reloadTick]);

  // Collect subject ids and fetch names (merge raw IM subject_ids + base University/Service IMs)
  useEffect(() => {
    if (!authToken) return;
    const candidateIds = new Set<number>();
    rawIMs.forEach((im) => {
      if (typeof im.subject_id === "number") candidateIds.add(im.subject_id);
    });
    baseUniversityIMs.forEach((u: any) => {
      if (typeof u.subject_id === "number") candidateIds.add(u.subject_id);
    });
    baseServiceIMs.forEach((s: any) => {
      if (typeof s.subject_id === "number") candidateIds.add(s.subject_id);
    });
    const ids = Array.from(candidateIds).filter((id) => Number.isFinite(id));
    if (!ids.length) return;
    let cancelled = false;
    Promise.all(
      ids.map(async (id) => {
        try {
          const subj = await getSubjectById(id, authToken);
          if (subj?.name) return [id, subj.name] as const;
        } catch {}
        return [id, `Subject #${id}`] as const;
      })
    ).then((pairs) => {
      if (cancelled) return;
      const map: Record<number, string> = {};
      pairs.forEach(([id, name]) => (map[id] = name));
      setSubjectsMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [authToken, rawIMs, baseUniversityIMs, baseServiceIMs]);
  // (fields above were accidentally inserted here during patch; corrected below)

  // Department ids for selected college (used for filter pills)
  useEffect(() => {
    if (!selectedCollege?.id || !authToken) {
      setDepartmentIds([]);
      return;
    }
    getDepartmentsByCollegeId(selectedCollege.id, authToken)
      .then((deps) => {
        const ids = Array.isArray(deps) ? deps.map((d: any) => d.id) : [];
        setDepartmentIds(ids.filter((n: any) => typeof n === "number"));
      })
      .catch(() => setDepartmentIds([]));
  }, [selectedCollege?.id, authToken]);

  // Build lookup sets for base IM ids in this college
  const uniIdSet = useMemo(
    () => new Set(baseUniversityIMs.map((u: any) => u.id)),
    [baseUniversityIMs]
  );
  const servIdSet = useMemo(
    () => new Set(baseServiceIMs.map((s: any) => s.id)),
    [baseServiceIMs]
  );

  // Filter raw IM versions to those whose base IM belongs to selected college
  const collegeFiltered = useMemo(() => {
    if (!selectedCollege) return [] as any[];
    return rawIMs.filter((im) => {
      if (im.university_im_id) return uniIdSet.has(im.university_im_id);
      if (im.service_im_id) return servIdSet.has(im.service_im_id);
      return false; // skip if cannot associate
    });
  }, [rawIMs, selectedCollege, uniIdSet, servIdSet]);

  const enrichRows = (ims: any[]) =>
    ims.map((im) => {
      const baseU = im.university_im_id
        ? baseUniversityIMs.find((b) => b.id === im.university_im_id)
        : null;
      const baseS = im.service_im_id
        ? baseServiceIMs.find((b) => b.id === im.service_im_id)
        : null;
      const subject_id =
        im.subject_id || baseU?.subject_id || baseS?.subject_id || null;
      const subject_name =
        (subject_id && subjectsMap[subject_id]) ||
        baseU?.subject?.name ||
        baseS?.subject?.name ||
        (subject_id ? `Subject #${subject_id}` : "-");
      return {
        id: im.id,
        im_type: im.im_type,
        department_id: baseU?.department_id ?? im.department_id ?? null,
        year_level: baseU?.year_level ?? im.year_level ?? null,
        subject_id,
        subject_name,
        status: im.status,
        validity: im.validity,
        version: im.version,
        updated_by: im.updated_by,
        updated_at: im.updated_at,
        s3_link: im.s3_link || baseU?.s3_link || baseS?.s3_link || null,
        university_im_id: im.university_im_id || null,
        service_im_id: im.service_im_id || null,
      };
    });

  // Department counts from currently loaded rawIMs (university only with department_id after enrichment below)
  const deptCounts: Record<number, number> = {};
  baseUniversityIMs.forEach((u: any) => {
    const deptId = u.department_id;
    if (!Number.isFinite(deptId)) return;
    // count how many rawIMs reference this base university IM and have evaluation status
    const count = rawIMs.filter(
      (im) =>
        im.university_im_id === u.id && im.status === "For PIMEC Evaluation"
    ).length;
    if (count) deptCounts[deptId] = (deptCounts[deptId] || 0) + count;
  });

  return {
    loading,
    error,
    departmentIds,
    rawIMs,
    subjectsMap,
    collegeFiltered: enrichRows(collegeFiltered),
    baseUniversityIMs,
    baseServiceIMs,
    deptCounts,
  } as const;
}
