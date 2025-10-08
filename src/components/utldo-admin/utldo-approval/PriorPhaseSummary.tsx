import React, { useState } from "react";
import { RUBRIC_ITEMS, SECTION_TITLES } from "../../pimec/rubric";
import { formatIMERPIMECToRubricSummary } from "./PriorPhaseSummaryUtil";

interface Props {
  imerpimec: any | null;
}

export default function PriorPhaseSummary({ imerpimec }: Props) {
  const [open, setOpen] = useState(true);

  // removed debug log

  if (!imerpimec) return null;

  // If rubric details are missing, show a readable summary string as fallback
  const hasAnyScore = RUBRIC_ITEMS.some(
    (item) =>
      imerpimec[item.id.toLowerCase()] !== undefined &&
      imerpimec[item.id.toLowerCase()] !== null
  );

  // Group rubric items by section
  const grouped: Record<string, typeof RUBRIC_ITEMS> = {};
  RUBRIC_ITEMS.forEach((item) => {
    (grouped[item.section] ||= []).push(item);
  });

  return (
    <div className="border rounded bg-white shadow-sm overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-meritRed/10 hover:bg-meritRed/20 transition-colors text-meritRed font-semibold"
      >
        <span>Prior Phase Summary</span>
        <span className="text-[10px] font-normal">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="p-3 leading-snug flex flex-col gap-4 w-full">
          {hasAnyScore ? (
            Object.keys(grouped).map((section) => (
              <div
                key={section}
                className="border rounded w-full flex flex-col"
              >
                <div className="px-2 py-1 bg-gray-100 text-xs font-semibold flex justify-between">
                  <span>{SECTION_TITLES[section]}</span>
                </div>
                <div className="divide-y">
                  {grouped[section].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-2 py-1 text-xs"
                    >
                      <span className="flex-1">{item.label}</span>
                      <span className="font-mono min-w-[2ch] text-right">
                        {imerpimec[item.id.toLowerCase()] ?? "-"}
                      </span>
                      <span className="text-gray-500">/ {item.max}</span>
                    </div>
                  ))}
                </div>
                {/* Section comments */}
                {imerpimec[section.toLowerCase() + "_comment"] && (
                  <div className="p-2 border-t bg-gray-50">
                    <div className="text-xs text-gray-700 whitespace-pre-wrap">
                      <span className="font-semibold">Comments: </span>
                      {imerpimec[section.toLowerCase() + "_comment"]}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {formatIMERPIMECToRubricSummary(imerpimec)}
            </pre>
          )}
          {/* Overall comments */}
          {imerpimec.overall_comment && (
            <div className="border rounded p-2 bg-gray-50 w-full">
              <span className="block text-xs font-semibold mb-1">
                Overall Comments
              </span>
              <div className="text-xs text-gray-700 whitespace-pre-wrap">
                {imerpimec.overall_comment}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
