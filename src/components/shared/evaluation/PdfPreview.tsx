import React from "react";

interface PdfPreviewProps {
  url: string | null;
  loading: boolean;
  error: string | null;
  className?: string;
  title?: string;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  url,
  loading,
  error,
  className,
  title = "PDF Preview",
}) => {
  return (
    <div
      className={`flex-1 border rounded-lg bg-white shadow-lg overflow-hidden flex flex-col ${
        className || ""
      }`}
    >
      <div className="px-4 py-2 border-b text-md font-semibold bg-gray-50 flex items-center justify-between">
        <span>{title}</span>
      </div>
      {url ? (
        <iframe title={title} src={url} className="w-full flex-1" />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          {loading ? "Loading PDF..." : error || "No PDF available."}
        </div>
      )}
    </div>
  );
};

export default PdfPreview;
