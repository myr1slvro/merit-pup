import React from "react";
import type { College } from "../../types/college";

type Props = {
  colleges: College[];
  selectedCollege: College | null;
  loading: boolean;
  error: string;
  onSelect: (college: College) => void;
};

export default function CollegeButtonsRow({
  colleges,
  selectedCollege,
  loading,
  error,
  onSelect,
}: Props) {
  if (loading) return <div className="text-gray-500">Loading colleges...</div>;
  if (error) return <div className="text-immsRed">{error}</div>;
  if (!colleges?.length)
    return (
      <div className="text-gray-400 flex items-center gap-2">
        No colleges assigned.
      </div>
    );

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {colleges.map((c) => (
        <button
          key={c.id}
          className={`px-4 py-2 rounded-full border font-semibold transition-colors cursor-pointer ${
            selectedCollege?.id === c.id
              ? "bg-immsRed text-white border-immsRed"
              : "bg-white text-immsRed border-immsRed/40 hover:bg-immsRed/10"
          }`}
          title={c.name}
          onClick={() => onSelect(c)}
        >
          {c.abbreviation}
        </button>
      ))}
    </div>
  );
}
