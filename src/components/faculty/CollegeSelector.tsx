import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getCollegesForUserDetailed } from "../../api/collegeincluded";

type Option = {
  id: number;
  name?: string;
  abbreviation?: string;
};

interface CollegeSelectorProps {
  value: number | "";
  onChange: (id: number | "") => void;
}

export default function CollegeSelector({
  value,
  onChange,
}: CollegeSelectorProps) {
  const { authToken, user } = useAuth();
  const [items, setItems] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const normalize = (res: any) =>
    Array.isArray(res) ? res : res?.colleges || res?.data || [];

  useEffect(() => {
    if (!authToken || !user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getCollegesForUserDetailed(
          user.id as number,
          authToken
        );
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
  }, [authToken, user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      `${c.abbreviation || ""} ${c.name || ""}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700">College</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
        placeholder="Search colleges..."
      />
      <select
        value={value as any}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-immsRed focus:ring-1 focus:ring-immsRed/30"
      >
        {loading ? (
          <option value="" disabled>
            Loading colleges...
          </option>
        ) : (
          <option value="">All colleges</option>
        )}
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {c.abbreviation ? `${c.abbreviation} — ${c.name}` : c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
