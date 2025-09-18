import React, { useMemo } from "react";
import { UEC_RUBRIC_SECTIONS, totalUecMax } from "./uecRubric";

interface UecRubricFormProps {
  scores: Record<string, number>;
  setScores: (s: Record<string, number>) => void;
  disabled?: boolean;
  onSubmit: (r: {
    totalScore: number;
    totalMax: number;
    passed: boolean;
    breakdown: { section: string; subtotal: number; max: number }[];
  }) => void;
  thresholdPercent?: number; // default 75
}

export default function UecRubricForm({
  scores,
  setScores,
  disabled,
  onSubmit,
  thresholdPercent = 75,
}: UecRubricFormProps) {
  const breakdown = useMemo(() => {
    return UEC_RUBRIC_SECTIONS.map((section) => {
      let subtotal = 0;
      section.items.forEach((item) => {
        subtotal += scores[item.key] || 0;
      });
      return { section: section.title, subtotal, max: section.max };
    });
  }, [scores]);

  const totalScore = breakdown.reduce((a, b) => a + b.subtotal, 0);
  const totalMax = totalUecMax();
  const passed = totalScore >= (thresholdPercent / 100) * totalMax;

  function handleChange(itemKey: string, max: number, value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 0) return;
    if (num > max) return;
    setScores({ ...scores, [itemKey]: num });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ totalScore, totalMax, passed, breakdown });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col border rounded bg-white shadow max-h-[70vh] overflow-auto"
    >
      <div
        className="p-3 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-gray-700">UEC Rubric</h2>
        <div className="text-xs text-gray-500">
          Total: {totalScore}/{totalMax} ({((totalScore / totalMax) * 100).toFixed(1)}%)
        </div>
      </div>
      <div className="p-3 space-y-4 text-sm">
        {UEC_RUBRIC_SECTIONS.map((section) => (
          <div key={section.key} className="border rounded">
            <div className="px-2 py-1 bg-gray-100 font-medium text-xs flex items-center justify-between">
              <span>{section.title}</span>
              <span>
                {breakdown.find((b) => b.section === section.title)?.subtotal || 0}/{section.max}
              </span>
            </div>
            <div className="divide-y">
              {section.items.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-gray-50"
                >
                  <span className="flex-1 leading-snug pr-2">{item.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={item.max}
                    value={scores[item.key] ?? ""}
                    disabled={disabled}
                    onChange={(e) => handleChange(item.key, item.max, e.target.value)}
                    className="w-20 border rounded px-1 py-0.5 text-right text-xs"
                  />
                  <span className="text-[10px] text-gray-500 w-8 text-right">/{item.max}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto p-3 border-t bg-gray-50 flex flex-col gap-2 text-xs">
        <div>
          Status:{" "}
          {passed ? (
            <span className="text-green-600 font-semibold">Meets Threshold</span>
          ) : (
            <span className="text-red-600 font-semibold">Below Threshold</span>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="w-full py-2 rounded bg-meritRed text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? "Submitting…" : "Submit Evaluation"}
        </button>
      </div>
    </form>
  );
}
