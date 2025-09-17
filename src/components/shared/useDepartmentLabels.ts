import { useEffect, useState } from "react";
import {
  getDepartmentsByIdsCached,
  getDepartmentCacheEntry,
} from "../../api/department";
import { useAuth } from "../auth/AuthProvider";

export default function useDepartmentLabels(ids: number[]) {
  const { authToken } = useAuth();
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!authToken || !ids.length) return;
    const missing = ids.filter((id) => !getDepartmentCacheEntry(id));
    if (!missing.length) return; // already cached
    setLoading(true);
    getDepartmentsByIdsCached(missing, authToken)
      .catch(() => {})
      .finally(() => {
        if (active) {
          setVersion((v) => v + 1);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [ids.join(","), authToken]);

  const labels = ids.map((id) => {
    const entry = getDepartmentCacheEntry(id);
    return { id, name: entry?.abbreviation || entry?.name || null };
  });

  return { labels, loading, refresh: () => setVersion((v) => v + 1) } as const;
}
