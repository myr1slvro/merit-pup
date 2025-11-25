import React from "react";

interface IMTypeToggleProps {
  activeIMType: "university" | "service" | "all";
  setActiveIMType: (type: "university" | "service" | "all") => void;
}

export default function IMTypeToggle({
  activeIMType,
  setActiveIMType,
}: IMTypeToggleProps) {
  const buttonClasses = (isActive: boolean) =>
    `px-3 py-1 transition-colors ${
      isActive ? "bg-meritRed text-white" : "hover:bg-gray-200"
    }`;

  return (
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
  );
}
