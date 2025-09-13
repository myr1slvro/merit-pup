import React, { useMemo } from "react";
import { RUBRIC_ITEMS, SECTION_TITLES, RubricItem } from "./rubric";

interface ImerRubricFormProps {
  scores: Record<string, number>;
  setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  assumedIsModule: boolean;
  setAssumedIsModule: (v: boolean) => void;
  onSubmit: (summary: {
    totalScore: number;
    totalMax: number;
    passed: boolean;
  }) => void;
  disabled?: boolean;
}

export const ImerRubricForm: React.FC<ImerRubricFormProps> = ({
  scores,
  setScores,
  assumedIsModule,
  setAssumedIsModule,
  onSubmit,
  disabled,
}) => {
  const grouped = useMemo(() => {
    const map: Record<string, RubricItem[]> = {};
    RUBRIC_ITEMS.forEach((item) => {
      if (item.modulesOnly && !assumedIsModule) return;
      (map[item.section] ||= []).push(item);
    });
    return map;
  }, [assumedIsModule]);

  const sectionSubtotal = (section: string) => {
    const items = grouped[section] || [];
    return items.reduce((sum, it) => sum + (scores[it.id] || 0), 0);
  };
  const sectionMax = (section: string) => {
    const items = grouped[section] || [];
    return items.reduce((sum, it) => sum + it.max, 0);
  };

  const totalScore = useMemo(
    () => Object.keys(grouped).reduce((s, sec) => s + sectionSubtotal(sec), 0),
    [grouped, scores]
  );
  const totalMax = useMemo(
    () => Object.keys(grouped).reduce((s, sec) => s + sectionMax(sec), 0),
    [grouped]
  );
  const passed = totalScore >= 75; // threshold

  function handleScoreChange(id: string, value: string) {
    const v = Math.max(0, Number(value));
    setScores((prev) => ({ ...prev, [id]: v }));
  }

  function handleSubmit() {
    onSubmit({ totalScore, totalMax, passed });
  }

  return (
    <div className="w-[420px] border rounded bg-white shadow flex flex-col overflow-hidden">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <span className="font-semibold text-sm">IMER Form – Modules</span>
        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            checked={assumedIsModule}
            onChange={(e) => setAssumedIsModule(e.target.checked)}
          />{" "}
          Module
        </label>
      </div>
      <div className="p-3 overflow-y-auto flex-1 space-y-4">
        {Object.keys(grouped).map((section) => (
          <div key={section} className="border rounded">
            <div className="px-2 py-1 bg-gray-100 text-xs font-semibold flex justify-between">
              <span>{SECTION_TITLES[section]}</span>
              <span>
                {sectionSubtotal(section)}/{sectionMax(section)}
              </span>
            </div>
            <div className="divide-y">
              {grouped[section].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-1 text-xs"
                >
                  <span className="flex-1">{item.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={item.max}
                    value={scores[item.id] ?? ""}
                    onChange={(e) => handleScoreChange(item.id, e.target.value)}
                    className="w-14 border rounded px-1 py-0.5 text-right"
                  />
                  <span className="text-gray-500">/ {item.max}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t text-sm flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span>Total</span>
          <span className="font-semibold">
            {totalScore} / {totalMax}
          </span>
        </div>
        <div className="text-xs">
          Result:{" "}
          {passed ? (
            <span className="text-green-700 font-semibold">Pass</span>
          ) : (
            <span className="text-red-700 font-semibold">Below Threshold</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="mt-1 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-1.5 rounded disabled:opacity-50"
          disabled={totalScore === 0 || disabled}
        >
          Submit Evaluation
        </button>
      </div>
    </div>
  );
};

export default ImerRubricForm;
