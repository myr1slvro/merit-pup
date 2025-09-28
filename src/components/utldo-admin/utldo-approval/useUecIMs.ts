import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getForUtldo,
  getInstructionalMaterial,
} from "../../../api/instructionalmaterial";
import { getDepartmentsByCollegeId } from "../../../api/department";
import { getSubjectById } from "../../../api/subject";
import { getUniversityIMsByCollege } from "../../../api/universityim";
import { getServiceIMsByCollege } from "../../../api/serviceim";

// Similar to useEvaluatorIMs but pulls via getForUtldo endpoint and filters status
export default function useUecIMs(selectedCollege: any, reloadTick: number) {
  const { authToken } = useAuth();
  const [rawIMs, setRawIMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({});
  const [baseUniversityIMs, setBaseUniversityIMs] = useState<any[]>([]);
  const [baseServiceIMs, setBaseServiceIMs] = useState<any[]>([]);

  useEffect(() => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    getForUtldo(authToken, 1)
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : res?.instructional_materials || [];
        // Only consider those explicitly in correct status (defensive)
        const filtered = list.filter(
          (im: any) => im.status === "For UTLDO Evaluation"
        );
        setRawIMs(filtered);
      })
      .catch(() => setError("Failed to load UEC IMs."))
      .finally(() => setLoading(false));
  }, [authToken, reloadTick]);

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

  useEffect(() => {
    if (!authToken || !rawIMs.length) return;
    const ids = Array.from(
      new Set(
        rawIMs.map((im) => im.subject_id).filter((id) => typeof id === "number")
      )
    );
    if (!ids.length) return;
    Promise.all(
      ids.map(async (id) => {
        try {
          const subj = await getSubjectById(id, authToken);
          if (subj?.name) return [id, subj.name] as const;
        } catch {}
        return [id, `Subject #${id}`] as const;
      })
    ).then((pairs) => {
      const map: Record<number, string> = {};
      pairs.forEach(([id, name]) => (map[id] = name));
      setSubjectsMap(map);
    });
  }, [authToken, rawIMs]);

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

  const uniIdSet = useMemo(
    () => new Set(baseUniversityIMs.map((u: any) => u.id)),
    [baseUniversityIMs]
  );
  const servIdSet = useMemo(
    () => new Set(baseServiceIMs.map((s: any) => s.id)),
    [baseServiceIMs]
  );

  const collegeFiltered = useMemo(() => {
    if (!selectedCollege) return [] as any[];
    return rawIMs.filter((im) => {
      if (im.university_im_id) return uniIdSet.has(im.university_im_id);
      if (im.service_im_id) return servIdSet.has(im.service_im_id);
      return false;
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
        notes: im.notes || "",
      };
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
  } as const;
}
