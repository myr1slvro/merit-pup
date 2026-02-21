import React from "react";
import { getSubjectById } from "../api/subject";
import IMTable from "../components/shared/IMTable";

export type IMType = "university" | "service" | "all";

// ─── Subject enrichment ───────────────────────────────────────────────────────

export async function enrichIMsWithSubjects(
  ims: any[],
  authToken: string,
  onComplete: (enriched: any[]) => void,
) {
  const subjectIds = Array.from(
    new Set(ims.map((im) => im.subject_id).filter(Boolean)),
  );
  const subjectMap: Record<number, string> = {};

  await Promise.all(
    subjectIds.map(async (id) => {
      try {
        const subj = await getSubjectById(id, authToken);
        if (subj?.name) subjectMap[id] = subj.name;
      } catch {}
    }),
  );

  const enriched = ims.map((im) =>
    im.subject_id && subjectMap[im.subject_id]
      ? {
          ...im,
          subject: { ...(im.subject || {}), name: subjectMap[im.subject_id] },
        }
      : im,
  );

  onComplete(enriched);
}

// ─── Metadata map builders ────────────────────────────────────────────────────

export function buildLatestMetaMap(
  allIMs: any[],
  type: string,
  idKey: string,
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

export function enrichBaseIMs(
  baseIMs: any[],
  metaMap: Map<number, any>,
  defaultType: string,
  collegeId?: number,
): any[] {
  if (!collegeId) return [];

  const rows = baseIMs.map((base) => {
    const meta = metaMap.get(base.id);
    return {
      id: base.id,
      im_id: meta?.id ?? null,
      s3_link: meta?.s3_link ?? null,
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

export function belongsToCollege(
  im: any,
  universityIMs: any[],
  serviceIMs: any[],
  collegeId: number,
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

export function buildAllRow(
  im: any,
  universityIMs: any[],
  serviceIMs: any[],
): any {
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

// ─── Filtering helpers ────────────────────────────────────────────────────────

export function applyDepartmentFilter(
  rows: any[],
  departmentId: number | null,
): any[] {
  if (departmentId === null) return rows;
  return rows.filter(
    (row) =>
      (row.im_type || "").toLowerCase() !== "service" &&
      row.department_id === departmentId,
  );
}

export function filterByFacultyStatuses(rows: any[]): any[] {
  const ALLOWED_FACULTY_STATUSES = [
    "-",
    "for utldo evaluation",
    "assigned to faculty",
    "for resubmission",
    "for certification",
    "certified",
    "published",
  ];

  console.log("Before faculty filter:", rows);
  const filtered = rows.filter((row) => {
    const statusNorm = String(row.status || "").toLowerCase();
    return ALLOWED_FACULTY_STATUSES.includes(statusNorm);
  });
  console.log("After faculty filter:", filtered);
  return filtered;
}

export function deduplicateById(rows: any[]): any[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.id}-${row.im_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getTimestamp(im: any): number {
  return im.updated_at ? new Date(im.updated_at).getTime() : 0;
}

// ─── Render helper ────────────────────────────────────────────────────────────

export function renderTable(
  type: IMType,
  data: Record<IMType, any[]>,
  options: { loading: boolean; error: string | null; onRefresh: () => void },
) {
  const { loading, error, onRefresh } = options;

  if (loading) return <div className="text-gray-500">Loading IMs...</div>;
  if (error) return <div className="text-immsRed">{error}</div>;

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
