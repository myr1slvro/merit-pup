import React from "react";

interface PdfPreviewProps {
  url: string | null;
  loading: boolean;
  error: string | null;
  className?: string;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  url,
  loading,
  error,
  className,
}) => {
  return (
    <div
      className={`flex-1 border rounded bg-white shadow overflow-hidden flex flex-col ${
        className || ""
      }`}
    >
      <div className="p-2 border-b text-sm font-semibold bg-gray-50">
        PDF Preview
      </div>
      {url ? (
        <iframe title="IM PDF" src={url} className="w-full flex-1" />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          {loading ? "Loading PDF..." : error || "No PDF available."}
        </div>
      )}
    </div>
  );
};

export default PdfPreview;
