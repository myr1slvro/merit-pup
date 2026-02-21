import { useState, useEffect, useCallback } from "react";
import { getAuthorsForIM } from "../api/author";
import { getUserById } from "../api/users";
import { AuthorInfo } from "../types/certificate";

async function fetchAuthorsWithDetails(
  imId: number,
  authToken: string,
): Promise<AuthorInfo[]> {
  const authorList = await getAuthorsForIM(imId, authToken);
  const items = Array.isArray(authorList) ? authorList : authorList?.data || [];
  return Promise.all(
    items.map(async (a: any) => {
      const uid = a.user_id ?? a.userId;
      try {
        const user = await getUserById(uid, authToken);
        const name = [user?.first_name, user?.middle_name, user?.last_name]
          .filter(Boolean)
          .join(" ");
        return {
          user_id: uid,
          name: name || `User ${uid}`,
          rank: user?.rank || null,
          email: user?.email || "",
        };
      } catch {
        return { user_id: uid, name: `User ${uid}`, rank: null, email: "" };
      }
    }),
  );
}

export function useAuthors(imId: number, authToken?: string) {
  const [authors, setAuthors] = useState<AuthorInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!authToken || !imId) return;
    setLoading(true);
    try {
      const detailed = await fetchAuthorsWithDetails(imId, authToken);
      setAuthors(detailed);
    } catch {
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, imId]);

  useEffect(() => {
    let active = true;
    reload().then(() => {
      if (!active) setAuthors([]);
    });
    return () => {
      active = false;
    };
  }, [reload]);

  return { authors, loading, reload };
}
