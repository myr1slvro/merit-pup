import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  getAllSubjects,
  getAllSubjectsNoPagination,
  getSubjectsByCollegeId,
} from "../../api/subject";

type Subject = { id: number; code?: string; name?: string };

interface SubjectSelectorProps {
  collegeId?: number | "";
  value: number | "";
  onChange: (id: number | "") => void;
}

export default function SubjectSelector({
  collegeId,
  value,
  onChange,
}: SubjectSelectorProps) {
  const { authToken } = useAuth();
  const [items, setItems] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const normalize = (res: any) =>
    Array.isArray(res) ? res : res?.subjects || res?.data || [];

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = collegeId
          ? await getSubjectsByCollegeId(collegeId as number, authToken)
          : await getAllSubjectsNoPagination(authToken);
        if (!cancelled) setItems(normalize(res));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, collegeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) =>
      `${s.code || ""} ${s.name || ""}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700">Subject</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-meritRed focus:ring-1 focus:ring-meritRed/30"
        placeholder="Search subjects..."
      />
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-meritRed focus:ring-1 focus:ring-meritRed/30"
        disabled={loading}
      >
        {loading ? (
          <option value="" disabled>
            Loading subjects...
          </option>
        ) : (
          <option value="" disabled>
            Select subject...
          </option>
        )}
        {filtered.map((s) => (
          <option key={s.id} value={s.id}>
            {s.code} - {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
