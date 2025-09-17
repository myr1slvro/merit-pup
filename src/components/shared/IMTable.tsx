import React from "react";
import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";
import { getDepartmentCacheEntry } from "../../api/department";
import IMRowActions from "../shared/IMRowActions";

// Common columns: id, subject (resolved name), year_level (only university), department (only university), actions placeholder
// Expect parent to pass already-enriched IM objects with subject?.name present and department maybe present.

export type IMTableType = "university" | "service" | "all";

interface BaseProps {
  type: IMTableType;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  actionsRole?: string; // explicitly pass role for actions instead of relying on window
  extraActions?: (row: any) => React.ReactNode | null;
  // raw list for 'all' will be generic any[] containing instructional_materials entries
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
  const { type, loading, error, onRefresh, actionsRole, extraActions } =
    props as any;
  const data = props.data as any[];

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
