import React, { useMemo } from "react";
import { RUBRIC_ITEMS, SECTION_TITLES, RubricItem } from "./rubric";

interface ImerRubricFormProps {
  scores: Record<string, number>;
  setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sectionComments?: Record<string, string>;
  setSectionComments?: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  overallComment?: string;
  setOverallComment?: React.Dispatch<React.SetStateAction<string>>;
  assumedIsModule: boolean;
  setAssumedIsModule: (v: boolean) => void;
  onSubmit: (summary: {
    totalScore: number;
    totalMax: number;
    passed: boolean;
    breakdown: {
      section: string;
      subtotal: number;
      max: number;
      comment?: string;
    }[];
    overallComment?: string;
  }) => void;
  disabled?: boolean;
}

export const ImerRubricForm: React.FC<ImerRubricFormProps> = ({
  scores,
  setScores,
  sectionComments,
  setSectionComments,
  overallComment,
  setOverallComment,
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

  // All rubric item IDs that are visible in this form
  const allItemIds = useMemo(
    () =>
      Object.values(grouped)
        .flat()
        .map((item) => item.id),
    [grouped]
  );

  // Check if all score fields are filled (not empty, not NaN)
  const allScoresFilled = allItemIds.every(
    (id) =>
      typeof scores[id] === "number" &&
      !isNaN(scores[id]) &&
      scores[id] !== null &&
      scores[id] !== undefined
  );

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
    // Only allow non-negative integers (digits only, no decimals, no negatives)
    if (!/^\d*$/.test(value)) return;
    const item = RUBRIC_ITEMS.find((it) => it.id === id);
    const max = item ? item.max : Infinity;
    let newValue = Number(value);
    if (isNaN(newValue)) newValue = 0;
    newValue = Math.max(0, Math.min(newValue, max));
    setScores((prev) => ({ ...prev, [id]: value === "" ? 0 : newValue }));
  }

  function handleSectionCommentChange(section: string, value: string) {
    if (setSectionComments) {
      setSectionComments((prev) => ({ ...prev, [section]: value }));
    }
  }

  function handleOverallCommentChange(value: string) {
    if (setOverallComment) {
      setOverallComment(value);
    }
  }

  function handleSubmit() {
    const breakdown = Object.keys(grouped).map((section) => ({
      section,
      subtotal: sectionSubtotal(section),
      max: sectionMax(section),
      comment: sectionComments ? sectionComments[section] : undefined,
    }));
    onSubmit({
      totalScore,
      totalMax,
      passed,
      breakdown,
      overallComment: overallComment ?? undefined,
    });
  }

  return (
    <div className="w-[420px] border rounded bg-white shadow flex flex-col overflow-hidden">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <span className="font-semibold text-sm">IMER Form – Modules</span>
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-1 py-0.5 border rounded text-xs bg-gray-100 hover:bg-gray-200"
                      tabIndex={-1}
                      aria-label="Decrement"
                      onClick={() => {
                        const current = scores[item.id] ?? 0;
                        if (current > 0)
                          handleScoreChange(item.id, String(current - 1));
                      }}
                      disabled={scores[item.id] <= 0}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\\d*"
                      min={0}
                      max={item.max}
                      value={scores[item.id] ?? ""}
                      onChange={(e) =>
                        handleScoreChange(item.id, e.target.value)
                      }
                      className="w-10 border rounded px-1 py-0.5 text-right"
                    />
                    <button
                      type="button"
                      className="px-1 py-0.5 border rounded text-xs bg-gray-100 hover:bg-gray-200"
                      tabIndex={-1}
                      aria-label="Increment"
                      onClick={() => {
                        const current = scores[item.id] ?? 0;
                        if (current < item.max)
                          handleScoreChange(item.id, String(current + 1));
                      }}
                      disabled={scores[item.id] >= item.max}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-gray-500">/ {item.max}</span>
                </label>
              ))}
            </div>
            {/* Section comments */}
            {setSectionComments && (
              <div className="p-2 border-t bg-gray-50">
                <textarea
                  className="w-full border rounded px-2 py-1 text-xs resize-vertical"
                  placeholder={`Comments for ${SECTION_TITLES[section]} (optional)`}
                  value={sectionComments?.[section] ?? ""}
                  onChange={(e) =>
                    handleSectionCommentChange(section, e.target.value)
                  }
                  rows={2}
                />
              </div>
            )}
          </div>
        ))}
        {/* Overall comments */}
        {setOverallComment && (
          <div className="border rounded p-2 bg-gray-50">
            <label className="block text-xs font-semibold mb-1">
              Overall Comments (optional)
            </label>
            <textarea
              className="w-full border rounded px-2 py-1 text-xs resize-vertical"
              placeholder="Any overall comments about this evaluation..."
              value={overallComment ?? ""}
              onChange={(e) => handleOverallCommentChange(e.target.value)}
              rows={3}
            />
          </div>
        )}
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
          disabled={!allScoresFilled || totalScore === 0 || disabled}
        >
          Submit Evaluation
        </button>
      </div>
    </div>
  );
};

export default ImerRubricForm;
