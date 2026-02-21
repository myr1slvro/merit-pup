import { useMemo } from "react";

/**
 * Returns stable filter functions for IM directory pages.
 * Both applyStatus and applySearch are memoised and safe to use in
 * deeper useMemo dependency arrays.
 */
export function useIMFilters(
  activeStatus: string | null,
  searchTerm?: string,
) {
  const applyStatus = useMemo(() => {
    return (rows: any[]) => {
      if (!activeStatus) return rows;
      const norm = activeStatus.trim().toLowerCase();
      if (!norm || norm === "all") return rows;
      return rows.filter((im: any) => {
        const st = (im.status || "").toString().toLowerCase();
        return st === norm;
      });
    };
  }, [activeStatus]);

  const applySearch = useMemo(() => {
    return (rows: any[]) => {
      const q = (searchTerm || "").trim().toLowerCase();
      if (!q) return rows;
      return (rows || []).filter((im: any) => {
        const subjectName = (
          im.subject_name ||
          (im.subject && im.subject.name) ||
          ""
        ).toString();
        return subjectName.toLowerCase().includes(q);
      });
    };
  }, [searchTerm]);

  return { applyStatus, applySearch };
}
