import React from "react";

interface IMItem {
  id: number;
  subject_name?: string;
  version?: number | string | null;
  im_type?: string;
  material_type?: string;
  category?: string;
  format?: string;
}

interface Props {
  ims: IMItem[];
  selectedId?: number | null;
  onSelect: (im: IMItem) => void;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  loading: boolean;
}

export default function CertificationsSidebar({
  ims,
  selectedId,
  onSelect,
  page,
  setPage,
  totalPages,
  loading,
}: Props) {
  return (
    <div className="w-1/3 rounded-lg shadow-lg p-6 flex flex-col overflow-hidden bg-white">
      <div className="font-semibold mb-2 text-sm flex items-center justify-between">
        <span>Awaiting Certification ({ims.length})</span>
        {loading && <span className="text-xs text-gray-500">Loading...</span>}
      </div>

      <div className="flex-1 overflow-auto divide-y">
        {ims.map((im) => {
          const subj = (im as any).subject_name || "Subject";
          const imType =
            im.im_type || im.material_type || im.category || im.format || "IM";
          return (
            <button
              key={im.id}
              onClick={() => onSelect(im)}
              className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-100 transition flex flex-col gap-0 ${
                selectedId === im.id ? "bg-gray-100" : ""
              }`}
            >
              <span className="font-medium">
                {subj}
                {im.version != null && ` - v${im.version}`}
              </span>
              <span className="text-xs text-gray-600 truncate">
                IM Type: {imType}
              </span>
            </button>
          );
        })}
        {ims.length === 0 && !loading && (
          <div className="text-xs text-gray-500 p-2">None pending.</div>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between text-xs">
        <button
          className="px-2 py-1 rounded border disabled:opacity-50"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
        >
          Prev
        </button>
        <span className="text-gray-600">
          Page {page} / {totalPages}
        </span>
        <button
          className="px-2 py-1 rounded border disabled:opacity-50"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={loading || page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
