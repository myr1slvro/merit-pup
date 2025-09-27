import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllSubjects,
  getSubjectsByCollegeId,
  getAllSubjectsNoPagination,
} from "../../../api/subject";
import { Subject } from "../../../types/subject";
import SubjectRow from "./SubjectRow";
import { useAuth } from "../../auth/AuthProvider";

interface Props {
  page: number;
  setHasNext: (v: boolean) => void;
  setHasPrev: (v: boolean) => void;
  refreshKey?: number;
  collegeFilterId?: number;
  search?: string;
}

export default function SubjectListTable({
  page,
  setHasNext,
  setHasPrev,
  refreshKey = 0,
  collegeFilterId,
  search = "",
}: Props) {
  const { authToken } = useAuth();
  const [list, setList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    if (!authToken) {
      setList([]);
      setHasNext(false);
      setHasPrev(false);
      setLoading(false);
      return;
    }
    try {
      let res: any;
      let items: Subject[] = [];

      const activeSearch = search.trim().length > 0;

      if (activeSearch) {
        // For search we pull full dataset (respect college filter if provided)
        if (typeof collegeFilterId === "number") {
          res = await getSubjectsByCollegeId(collegeFilterId, authToken);
          items = res?.subjects ?? res?.data ?? res ?? [];
        } else {
          res = await getAllSubjectsNoPagination(authToken);
          items = res?.subjects ?? res?.data ?? res ?? [];
        }
      } else {
        if (typeof collegeFilterId === "number") {
          res = await getSubjectsByCollegeId(collegeFilterId, authToken);
          items = res?.subjects ?? res?.data ?? res ?? [];
        } else {
          res = await getAllSubjects(authToken, page);
          items = res?.subjects ?? res?.data ?? res ?? [];
        }
      }

      // Client-side search filtering
      if (activeSearch) {
        const q = search.toLowerCase();
        items = items.filter(
          (s) =>
            s.code?.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q)
        );
      }

      setList(items);

      if (activeSearch || typeof collegeFilterId === "number") {
        // treat as single page when searching or filtered
        setHasNext(false);
        setHasPrev(false);
      } else {
        setHasNext(
          !!res?.has_next ||
            (Array.isArray(items) && items.length === (res?.per_page ?? 10))
        );
        setHasPrev(page > 1);
      }
    } catch {
      setList([]);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  }, [authToken, page, collegeFilterId, search, setHasNext, setHasPrev]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects, page, refreshKey]);

  if (loading) return <div className="p-4">Loading subjects...</div>;
  if (!list.length) return <div className="p-4">No subjects found.</div>;

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full border border-gray-300 bg-white rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold w-32">
              Code
            </th>
            <th className="px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold">
              Name
            </th>
            <th className="px-4 py-2 border-b bg-gray-100 text-right text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <SubjectRow
              key={s.id}
              subject={s}
              onRefresh={fetchSubjects}
              collegeFilterId={collegeFilterId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
