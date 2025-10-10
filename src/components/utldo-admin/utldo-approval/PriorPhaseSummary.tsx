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
    <div className="border rounded-lg shadow-lg overflow-hidden text-lg">
      <span className="w-full flex items-center justify-between px-3 py-2 bg-linear-to-r from-meritRed to-meritDarkRed  transition-colors text-white font-semibold">
        Prior Phase Summary
      </span>
      {open && (
        <div className="p-3 leading-snug flex flex-col gap-4 w-full bg-gray-100">
          {hasAnyScore ? (
            Object.keys(grouped).map((section) => (
              <div
                key={section}
                className="border rounded w-full flex flex-col bg-white"
              >
                <div className="px-2 py-1 bg-linear-to-r from-meritRed to-meritDarkRed text-white text-xs font-semibold flex justify-between">
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
                      <span className="text-aquamarine">/ {item.max}</span>
                    </div>
                  ))}
                </div>
                {/* Section comments */}
                {imerpimec[section.toLowerCase() + "_comment"] && (
                  <div className="p-2 border-t ">
                    <div className="text-xs text-black whitespace-pre-wrap">
                      <span className="font-semibold">Comments: </span>
                      {imerpimec[section.toLowerCase() + "_comment"]}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <pre className="text-xs text-black whitespace-pre-wrap">
              {formatIMERPIMECToRubricSummary(imerpimec)}
            </pre>
          )}
          {/* Overall comments */}
          {imerpimec.overall_comment && (
            <div className="border rounded p-2  bg-white w-full">
              <span className="block text-xs font-semibold mb-1">
                Overall Comments:
              </span>
              <div className="border-t border-gray-300 my-1" />
              <div className="text-xs text-black whitespace-pre-wrap">
                {imerpimec.overall_comment}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
