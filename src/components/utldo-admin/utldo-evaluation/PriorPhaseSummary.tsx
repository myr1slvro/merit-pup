import React, { useState, useMemo } from "react";

interface Props {
  notes: string | null;
}

function extractEvaluatorSection(notes: string): string {
  const lines = notes.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith("Evaluator Score:"));
  if (start === -1) return notes; // fallback entire notes
  // capture until next phase delimiter or max lines
  const slice = lines.slice(start, start + 50);
  return slice.join("\n");
}

export default function PriorPhaseSummary({ notes }: Props) {
  const [open, setOpen] = useState(true);
  const content = useMemo(() => {
    if (!notes) return null;
    return extractEvaluatorSection(notes);
  }, [notes]);

  if (!notes) return null;

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
        <div className="p-3 whitespace-pre-wrap max-h-52 overflow-auto leading-snug">
          {content}
        </div>
      )}
    </div>
  );
}
