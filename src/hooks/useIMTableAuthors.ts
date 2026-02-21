import { useState, useEffect, useRef } from "react";
import { getAllUsersForIM } from "../api/author";
import { getUserById } from "../api/users";
import { getDepartmentCacheEntry } from "../api/department";

function pickStaffId(u: any): string | undefined {
  if (!u) return undefined;
  return u.staff_id || undefined;
}

function pickLastName(u: any): string | undefined {
  if (!u) return undefined;
  return u.last_name || undefined;
}

/**
 * Fetches per-IM author labels and computes per-IM action permission,
 * extracted from IMTable to keep that component focused on rendering.
 */
export function useIMTableAuthors(
  data: any[],
  token: string | undefined,
  currentUser: any,
  actionsRole: string | undefined,
  userCollegeIds: number[],
) {
  const [authorsStaffIdsByIm, setAuthorsStaffIdsByIm] = useState<
    Record<number, string>
  >({});
  const [canActByIm, setCanActByIm] = useState<Record<number, boolean>>({});
  const userCache = useRef<Map<number, any>>(new Map());
  const seqRef = useRef(0);

  useEffect(() => {
    if (!data?.length || !token) return;
    const seq = ++seqRef.current;
    const imIds = Array.from(
      new Set(data.map((d) => Number(d.id)).filter(Boolean)),
    );
    let cancelled = false;

    (async () => {
      try {
        const imToUserIdsArr: Array<[number, number[]]> = await Promise.all(
          imIds.map(async (imId) => {
            try {
              const uids = await getAllUsersForIM(imId, token);
              const unique = Array.from(
                new Set((uids || []).map((x: any) => Number(x)).filter(Boolean)),
              );
              return [imId, unique] as [number, number[]];
            } catch {
              return [imId, []] as [number, number[]];
            }
          }),
        );

        const imToUserIds = new Map<number, number[]>(imToUserIdsArr);

        const allUserIds = new Set<number>();
        for (const [, uids] of imToUserIds)
          for (const uid of uids) allUserIds.add(uid);

        const missing = Array.from(allUserIds).filter(
          (uid) => !userCache.current.has(uid),
        );
        await Promise.all(
          missing.map(async (uid) => {
            try {
              const u = await getUserById(uid, token);
              const userObj = u?.user || u;
              userCache.current.set(uid, userObj);
            } catch {
              // ignore
            }
          }),
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
                .filter(Boolean),
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
      } catch {
        if (!cancelled && seq === seqRef.current) {
          const fallback: Record<number, string> = {};
          const fallbackCan: Record<number, boolean> = {};
          for (const imId of imIds) {
            fallback[imId] = "-";
            fallbackCan[imId] = false;
          }
          setAuthorsStaffIdsByIm(fallback);
          setCanActByIm(fallbackCan);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, token, currentUser?.id, userCollegeIds, actionsRole, currentUser?.role]);

  return { authorsStaffIdsByIm, canActByIm };
}
