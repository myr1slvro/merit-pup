import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 text-xs text-gray-600">
      <span>
        Showing {(currentPage - 1) * 10 + 1}-
        {Math.min(currentPage * 10, totalItems)} of {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={onPrev}
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-2 py-1">
          Page {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={onNext}
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
