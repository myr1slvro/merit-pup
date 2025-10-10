import React from "react";
import { FaRegFileLines } from "react-icons/fa6";

interface PIMECIMTableHeaderProps {
  activeIMType: "university" | "service" | "all";
  setActiveIMType: (type: "university" | "service" | "all") => void;
  onCreate?: () => void;
  onRefresh: () => void;
  hideCreate?: boolean;
}

export default function PIMECIMTableHeader({
  activeIMType,
  setActiveIMType,
  onCreate,
  onRefresh,
  hideCreate,
}: PIMECIMTableHeaderProps) {
  const buttonClasses = (isActive: boolean) =>
    `px-3 py-1 transition-colors ${
      isActive ? "bg-meritRed text-white" : "hover:bg-gray-200"
    }`;

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 my-2">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FaRegFileLines className="text-meritRed" />
        Instructional Materials for Evaluation
        <span className="ml-4 inline-flex rounded-full bg-gray-100 text-gray-700 text-xs font-semibold overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveIMType("all")}
            className={buttonClasses(activeIMType === "all")}
          >
            All IMs
          </button>
          <button
            type="button"
            onClick={() => setActiveIMType("university")}
            className={`border-l border-gray-300 ${buttonClasses(
              activeIMType === "university"
            )}`}
          >
            University IMs
          </button>
          <button
            type="button"
            onClick={() => setActiveIMType("service")}
            className={`border-l border-gray-300 ${buttonClasses(
              activeIMType === "service"
            )}`}
          >
            Service IMs
          </button>
        </span>
      </h2>
      <div className="flex items-center gap-2 ml-auto">
        {!hideCreate && onCreate && (
          <button
            className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow"
            onClick={onCreate}
            type="button"
          >
            + Upload Instructional Material
          </button>
        )}
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
