import React from "react";
import { FaRegFileLines } from "react-icons/fa6";
import IMTypeToggle from "./IMTypeToggle";
import IMStatusDropdown from "./IMStatusDropdown";

interface IMTableHeaderProps {
  activeIMType: "university" | "service" | "all";
  setActiveIMType: (type: "university" | "service" | "all") => void;
  onCreate?: () => void;
  onRefresh: () => void;
  onSearch?: (q: string) => void;
  searchTerm?: string;
  hideCreate?: boolean;
  activeStatus?: string | null;
  setActiveStatus?: (s: string | null) => void;
  statusList?: string[];
}

export default function IMTableHeader({
  activeIMType,
  setActiveIMType,
  onCreate,
  onRefresh,
  onSearch,
  searchTerm,
  hideCreate,
  activeStatus,
  setActiveStatus,
  statusList,
}: IMTableHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 my-2">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FaRegFileLines className="text-meritRed" />
        Instructional Materials
        <div className="flex items-center gap-2">
          <IMTypeToggle
            activeIMType={activeIMType}
            setActiveIMType={setActiveIMType}
          />
          <IMStatusDropdown
            activeStatus={activeStatus}
            setActiveStatus={setActiveStatus}
            statuses={statusList}
          />
        </div>
      </h2>

      <div className="flex items-center gap-4 ml-auto">
        {!hideCreate && onCreate && (
          <button
            className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow"
            onClick={onCreate}
            type="button"
          >
            + Assign Instructional Material
          </button>
        )}
        <div className="relative">
          <input
            type="search"
            aria-label="Search IMs by subject"
            placeholder="Search by subject..."
            value={searchTerm || ""}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="px-6 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-meritRed"
          />
        </div>
        <button
          className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 underline"
          type="button"
          onClick={onRefresh}
          title="Refresh IM lists"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
