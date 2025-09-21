import React, { useEffect, useMemo, useRef, useState } from "react";
import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";
import { getDepartmentCacheEntry } from "../../api/department";
import IMRowActions from "../shared/IMRowActions";
import { useAuth } from "../auth/AuthProvider";
import { getAllUsersForIM } from "../../api/author";
import { getUserById } from "../../api/users";

export type IMTableType = "university" | "service" | "all";

interface BaseProps {
  type: IMTableType;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  actionsRole?: string;
  extraActions?: (row: any) => React.ReactNode | null;
  authToken?: string;
}

interface UniversityProps extends BaseProps {
  type: "university";
  data: UniversityIM[];
}
interface ServiceProps extends BaseProps {
  type: "service";
  data: ServiceIM[];
}
interface AllProps extends BaseProps {
  type: "all";
  data: any[];
}
export default function IMTable(
  props: UniversityProps | ServiceProps | AllProps
) {
  const {
    type,
    loading,
    error,
    onRefresh,
    actionsRole,
    extraActions,
    authToken,
  } = props as any;
  const data = props.data as any[];

  const { authToken: ctxToken } = useAuth();
  const token = useMemo(() => {
    if (authToken) return authToken;
    if (ctxToken) return ctxToken;
    try {
      const ls = localStorage.getItem("authToken");
      if (ls) return ls;
    } catch {}
    if (typeof window !== "undefined") {
      return (window as any)?.authToken || (window as any)?.jwtToken;
    }
    return undefined;
  }, [authToken, ctxToken]);
  const [authorsStaffIdsByIm, setAuthorsStaffIdsByIm] = useState<
    Record<number, string>
  >({});
  const userCache = useRef<Map<number, any>>(new Map());
  const seqRef = useRef(0);

  const pickStaffId = (u: any): string | undefined => {
    if (!u) return undefined;
    return u.staff_id || undefined;
  };
  const pickLastName = (u: any): string | undefined => {
    if (!u) return undefined;
    return u.last_name || undefined;
  };

  useEffect(() => {
    if (!data?.length || !token) return;
    const seq = ++seqRef.current;
    const imIds = Array.from(new Set(data.map((d) => Number(d.id)).filter(Boolean)));
    let cancelled = false;

    (async () => {
      try {
        // 1) Fetch authors (user IDs) for all IMs in parallel
        const imToUserIdsArr = await Promise.all(
          imIds.map(async (imId) => {
            try {
              const uids = await getAllUsersForIM(imId, token);
              const unique = Array.from(new Set((uids || []).map((x: any) => Number(x)).filter(Boolean)));
              return [imId, unique] as [number, number[]];
            } catch {
              return [imId, []] as [number, number[]];
            }
          })
        );

        const imToUserIds = new Map<number, number[]>(imToUserIdsArr);
        // 2) Build global set of user IDs to fetch
        const allUserIds = new Set<number>();
        for (const [, uids] of imToUserIds) {
          for (const uid of uids) allUserIds.add(uid);
        }

        // 3) Determine which users are missing from cache
        const missing = Array.from(allUserIds).filter((uid) => !userCache.current.has(uid));

        // 4) Fetch missing users in parallel
        await Promise.all(
          missing.map(async (uid) => {
            try {
              const u = await getUserById(uid, token);
              const userObj = u?.user || u;
              userCache.current.set(uid, userObj);
            } catch {
              // Leave uncached; labels will fallback to IDs
            }
          })
        );

        // 5) Build labels per IM
        const entries: Record<number, string> = {};
        for (const [imId, uids] of imToUserIds) {
          const labels = uids.map((uid) => {
            const u = userCache.current.get(uid);
            const staff = pickStaffId(u) || String(uid);
            const last = pickLastName(u);
            return last ? `${staff} – ${last}` : staff;
          });
          const joined = Array.from(new Set(labels.filter(Boolean))).join(", ");
          entries[imId] = joined || "-";
        }

        if (!cancelled && seq === seqRef.current) {
          setAuthorsStaffIdsByIm(entries);
        }
      } catch {
        if (!cancelled && seq === seqRef.current) {
          const fallback: Record<number, string> = {};
          for (const imId of imIds) fallback[imId] = "-";
          setAuthorsStaffIdsByIm(fallback);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, token]);

  if (loading)
    return (
      <div className="text-gray-500 p-2">
        Loading{" "}
        {type === "university"
          ? "University"
          : type === "service"
          ? "Service"
          : "All"}{" "}
        IMs...
      </div>
    );
  if (error) return <div className="text-meritRed p-2">{error}</div>;
  if (!data.length)
    return (
      <div className="text-gray-400 p-2">
        No{" "}
        {type === "university"
          ? "University"
          : type === "service"
          ? "Service"
          : "Instructional"}{" "}
        IMs.
      </div>
    );

  return (
    <div className="overflow-x-auto border border-gray-200 rounded shadow-sm bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 text-left w-16">ID</th>
            <th className="px-3 py-2 text-left">Type</th>
            {type !== "service" && (
              <th className="px-3 py-2 text-left">Department</th>
            )}
            {type !== "service" && (
              <th className="px-3 py-2 text-left">Year Level</th>
            )}
            <th className="px-3 py-2 text-left">Subject</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Validity</th>
            <th className="px-3 py-2 text-left">Version</th>
            <th className="px-3 py-2 text-left">Authors</th>
            <th className="px-3 py-2 text-left">Updated By</th>
            <th className="px-3 py-2 text-left">Updated At</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((im) => {
            const subjectName =
              im.subject_name ||
              im.subject?.name ||
              `Subject #${im.subject_id}`;
            let dept = "";
            const depId = im.department_id || im.department?.id;
            if (depId) {
              const depCache = getDepartmentCacheEntry(depId);
              if (depCache)
                dept = depCache.name || depCache.abbreviation || String(depId);
            }
            if (!dept && im.department) {
              dept =
                im.department.name ||
                im.department.abbreviation ||
                String(depId || "");
            }
            return (
              <tr key={im.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{im.id}</td>
                <td className="px-3 py-2">
                  {im.im_type ||
                    (type === "service"
                      ? "Service"
                      : type === "university"
                      ? "University"
                      : "-")}
                </td>
                {type !== "service" && (
                  <td className="px-3 py-2">
                    {dept ||
                      (im.department_id ? `Dept #${im.department_id}` : "-")}
                  </td>
                )}
                {type !== "service" && (
                  <td className="px-3 py-2">{im.year_level ?? "-"}</td>
                )}
                <td className="px-3 py-2">{subjectName}</td>
                <td className="px-3 py-2">{im.status || "-"}</td>
                <td className="px-3 py-2">{im.validity || "-"}</td>
                <td className="px-3 py-2">{im.version || "-"}</td>
                <td className="px-3 py-2">
                  {authorsStaffIdsByIm[Number(im.id)] || (token ? "…" : "-")}
                </td>
                <td className="px-3 py-2">{im.updated_by || "-"}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {im.updated_at
                    ? new Date(im.updated_at).toLocaleString()
                    : ""}
                </td>
                <td className="px-3 py-2 flex items-center gap-2">
                  <IMRowActions
                    row={im}
                    onChanged={() => onRefresh && onRefresh()}
                    role={
                      actionsRole ||
                      (window as any)?.currentUserRole ||
                      "Faculty"
                    }
                  />
                  {extraActions ? extraActions(im) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
