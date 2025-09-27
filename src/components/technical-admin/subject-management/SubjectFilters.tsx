import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { getAllColleges } from "../../../api/college";
import type { College } from "../../../types/college";
import SearchInput from "../../shared/SearchInput";

interface SubjectFiltersProps {
  collegeId: number | "";
  onCollegeChange: (v: number | "") => void;
  search: string;
  onSearchChange: (v: string) => void;
  compact?: boolean;
}

export default function SubjectFilters({
  collegeId,
  onCollegeChange,
  search,
  onSearchChange,
  compact = false,
}: SubjectFiltersProps) {
  const { authToken } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res: any = await getAllColleges(authToken as string);
        const list: any[] = Array.isArray(res)
          ? res
          : res?.colleges || res?.data || [];
        if (!cancelled) setColleges(list as College[]);
      } catch {
        if (!cancelled) setColleges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end gap-3 ${
        compact ? "" : "md:gap-4"
      }`}
    >
      <div className="text-sm">
        <label
          htmlFor="subjectCollegeFilter"
          className="block text-gray-700 mb-1"
        >
          College
        </label>
        <select
          id="subjectCollegeFilter"
          className="border rounded px-2 py-1 text-sm min-w-[220px]"
          value={collegeId as any}
          onChange={(e) =>
            onCollegeChange(e.target.value ? Number(e.target.value) : "")
          }
        >
          {loading ? (
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
      </div>

      <div className="text-sm flex-1 min-w-[240px]">
        <label className="block text-gray-700 mb-1">Search</label>
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search subjects (code or name)"
        />
      </div>
    </div>
  );
}
