import React, { useEffect, useMemo, useRef, useState } from "react";
import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";
import { getDepartmentCacheEntry } from "../../api/department";
import IMRowActions from "../shared/IMRowActions";
import { useAuth } from "../auth/AuthProvider";
import { getAllUsersForIM } from "../../api/author";
import { getUserById } from "../../api/users";
import useUserColleges from "../faculty/useUserColleges";

export type IMTableType = "university" | "service" | "all";

interface BaseProps {
  type: IMTableType;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  actionsRole?: string;
  extraActions?: (row: any) => React.ReactNode | null;
  authToken?: string;
  showEvaluate?: boolean;
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
    showEvaluate = false,
  } = props as any;
  const data = props.data as any[];

  const { authToken: ctxToken, user: currentUser } = useAuth();
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
  const [canActByIm, setCanActByIm] = useState<Record<number, boolean>>({});
  const userCache = useRef<Map<number, any>>(new Map());
  const seqRef = useRef(0);

  const { colleges: userColleges } = useUserColleges();
  const userCollegeIds = useMemo(
    () => (userColleges || []).map((c: any) => Number(c.id)).filter(Boolean),
    [userColleges]
  );

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
    const imIds = Array.from(
      new Set(data.map((d) => Number(d.id)).filter(Boolean))
    );
    let cancelled = false;

    (async () => {
      // Fetch authors for each IM, fetch missing users and compute labels + canAct map
      try {
        const imToUserIdsArr: Array<[number, number[]]> = await Promise.all(
          imIds.map(async (imId) => {
            try {
              const uids = await getAllUsersForIM(imId, token);
              const unique = Array.from(
                new Set((uids || []).map((x: any) => Number(x)).filter(Boolean))
              );
              return [imId, unique] as [number, number[]];
            } catch (err) {
              return [imId, []] as [number, number[]];
            }
          })
        );

        const imToUserIds = new Map<number, number[]>(imToUserIdsArr);

        // collect all user ids and fetch missing
        const allUserIds = new Set<number>();
        for (const [, uids] of imToUserIds)
          for (const uid of uids) allUserIds.add(uid);

        const missing = Array.from(allUserIds).filter(
          (uid) => !userCache.current.has(uid)
        );
        await Promise.all(
          missing.map(async (uid) => {
            try {
              const u = await getUserById(uid, token);
              const userObj = u?.user || u;
              userCache.current.set(uid, userObj);
            } catch (err) {
              // ignore
            }
          })
        );

        const entries: Record<number, string> = {};
        const canAct: Record<number, boolean> = {};
        const me = Number(currentUser?.id) || undefined;

        for (const [imId, uids] of imToUserIds) {
          const labels = uids.map((uid) => {
            const u = userCache.current.get(uid);
            const staff = pickStaffId(u) || String(uid);
            const last = pickLastName(u);
            return last ? `${staff} – ${last}` : staff;
          });
          entries[imId] =
            Array.from(new Set(labels.filter(Boolean))).join(", ") || "-";

          let has = me ? uids.includes(me) : false;
          if (!has) {
            const rawRoles = (
              actionsRole ||
              currentUser?.role ||
              (window as any)?.currentUserRole ||
              ""
            )
              .toString()
              .toLowerCase();
            const rolesSet = new Set(
              rawRoles
                .split(/[,/]/)
                .map((r: string) => r.trim())
                .filter(Boolean)
            );

            const row = data.find((d) => Number(d.id) === imId);
            let imCollegeId: number | undefined = undefined;
            if (row) {
              imCollegeId =
                Number(row.college_id || row.college?.id) || undefined;
              const depId = row.department_id || row.department?.id;
              if (!imCollegeId && depId) {
                const depCache = getDepartmentCacheEntry(depId);
                if (depCache?.college_id)
                  imCollegeId = Number(depCache.college_id);
              }
            }

            // Grant PIMEC elevated view within their own colleges
            if (
              rolesSet.has("pimec") &&
              imCollegeId &&
              userCollegeIds.includes(imCollegeId)
            ) {
              has = true;
            } else {
              const statusNorm = String(row?.status || "").toLowerCase();
              if (rolesSet.has("technical admin")) {
                has = true;
              } else if (
                rolesSet.has("pimec") &&
                statusNorm === "for pimec evaluation"
              ) {
                has = true;
              } else if (
                (rolesSet.has("utldo admin") || rolesSet.has("utldo")) &&
                statusNorm === "for utldo evaluation"
              ) {
                has = true;
              }
            }
          }
          canAct[imId] = has;
        }

        if (!cancelled && seq === seqRef.current) {
          setAuthorsStaffIdsByIm(entries);
          setCanActByIm(canAct);
        }
      } catch (err) {
        if (!cancelled && seq === seqRef.current) {
          const fallback: Record<number, string> = {};
          const fallbackCan: Record<number, boolean> = {};
          for (const imId of imIds) fallback[imId] = "-";
          setAuthorsStaffIdsByIm(fallback);
          for (const imId of imIds) fallbackCan[imId] = false;
          setCanActByIm(fallbackCan);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    data,
    token,
    currentUser?.id,
    userCollegeIds,
    actionsRole,
    currentUser?.role,
  ]);

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
  if (error) return <div className="text-immsRed p-2">{error}</div>;
  if (!data.length)
    return (
      <div className="text-gray-400 p-2">
        No{" "}
        {type === "university"
          ? "University"
          : type === "service"
          ? "Service"
          : ""}{" "}
        Instructional Materials found.
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
            <th className="px-3 py-2 text-center w-56">Actions</th>
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
                <td className="px-3 py-2">
                  <div className="min-w-[14rem] flex items-center justify-center gap-2 text-center">
                    {canActByIm[Number(im.id)] ? (
                      <>
                        {
                          // compute im's college for this row so we can decide
                          // whether to temporarily elevate PIMEC to Technical Admin
                        }
                        {(() => {
                          let imCollegeId: number | undefined = undefined;
                          imCollegeId =
                            Number(im.college_id || im.college?.id) ||
                            undefined;
                          const depId = im.department_id || im.department?.id;
                          if (!imCollegeId && depId) {
                            const depCache = getDepartmentCacheEntry(depId);
                            if (depCache?.college_id)
                              imCollegeId = Number(depCache.college_id);
                          }
                          const rawRole = (
                            actionsRole ||
                            currentUser?.role ||
                            (window as any)?.currentUserRole ||
                            ""
                          ).toString();
                          const isPimec = rawRole
                            .toLowerCase()
                            .includes("pimec");
                          const roleForRow =
                            isPimec &&
                            imCollegeId &&
                            userCollegeIds.includes(imCollegeId)
                              ? "Technical Admin"
                              : actionsRole ||
                                currentUser?.role ||
                                (window as any)?.currentUserRole ||
                                "Faculty";

                          return (
                            <>
                              <IMRowActions
                                row={im}
                                onChanged={() => onRefresh && onRefresh()}
                                role={roleForRow}
                                showEvaluate={showEvaluate}
                              />
                              {extraActions ? extraActions(im) : null}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-gray-600 text-xs leading-snug max-w-[13rem]">
                        Restricted permissions for this IM
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
