import React from "react";

interface PaginationProps {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}) => (
  <div className="flex items-center justify-between mt-4">
    <button
      className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      onClick={onPrev}
      disabled={!hasPrev}
    >
      Previous
    </button>
    <span className="text-sm">Page {page}</span>
    <button
      className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      onClick={onNext}
      disabled={!hasNext}
    >
      Next
    </button>
  </div>
);

export default Pagination;
