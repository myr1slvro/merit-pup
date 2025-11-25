import React, { useState, useEffect, useRef } from "react";

interface IMStatusDropdownProps {
  activeStatus?: string | null;
  setActiveStatus?: (s: string | null) => void;
  statuses?: string[];
}

export default function IMStatusDropdown({
  activeStatus = null,
  setActiveStatus,
  statuses,
}: IMStatusDropdownProps) {
  const defaultStatuses = [
    "All",
    "Assigned to Faculty",
    "For PIMEC Evaluation",
    "For UTLDO Evaluation",
    "For Resubmission",
    "Certified",
  ];

  const list = statuses && statuses.length ? statuses : defaultStatuses;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const label = activeStatus || "All";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 hover:bg-gray-200 border border-gray-200 flex items-center gap-1"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="truncate max-w-[120px]">{label}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
          role="menu"
        >
          <div className="max-h-64 overflow-auto py-1">
            {list.map((s, idx) => {
              const isActive = activeStatus
                ? String(activeStatus).toLowerCase() === String(s).toLowerCase()
                : String(s).toLowerCase() === "all";
              return (
                <button
                  key={`${s}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue =
                      String(s).toLowerCase() === "all" ? null : s;
                    if (setActiveStatus) {
                      setActiveStatus(newValue);
                    }
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    isActive
                      ? "bg-meritRed/90 text-white hover:bg-meritRed"
                      : "text-gray-700"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
