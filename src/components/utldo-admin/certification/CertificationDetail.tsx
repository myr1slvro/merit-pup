import React from "react";
import CertificateUpload from "./CertificateUpload";
import PdfPreview from "../../shared/evaluation/PdfPreview";

interface CertificationIM {
  id: number;
  version?: number | string | null;
  im_type?: string;
  material_type?: string;
  category?: string;
  format?: string;
  notes?: string | null;
}

interface Props {
  im: CertificationIM;
  subjectName?: string;
  subjectLoading?: boolean;
  pdfUrl?: string | null;
  pdfLoading?: boolean;
  pdfError?: string | null;
  certFile: File | null;
  setCertFile: (f: File | null) => void;
  downloadingTemplate: boolean;
  handleDownloadTemplate: () => void;
  onAct: (status: "Published" | "For Resubmission") => void;
  actionLoading: boolean;
}

export default function CertificationDetail({
  im,
  subjectName,
  subjectLoading,
  pdfUrl,
  pdfLoading,
  pdfError,
  certFile,
  setCertFile,
  downloadingTemplate,
  handleDownloadTemplate,
  onAct,
  actionLoading,
}: Props) {
  const imType =
    im.im_type ||
    (im as any).type ||
    im.material_type ||
    im.category ||
    im.format ||
    "IM";

  if (!im) return null;

  return (
    <div className="flex-1 flex flex-col rounded-lg shadow-lg gap-3 p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-meritRed">
            {subjectLoading && !subjectName
              ? "Loading subject..."
              : subjectName || "Subject"}
            {im.version != null && ` - v${im.version}`}
          </h2>
          <div className="text-xs text-gray-600">{imType}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAct("Published")}
            disabled={actionLoading || !certFile}
            className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark Certified
          </button>
          <button
            onClick={() => onAct("For Resubmission")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm rounded bg-meritRed text-white hover:bg-red-700 disabled:opacity-50"
          >
            Request Resubmission
          </button>
        </div>
      </div>

      <CertificateUpload
        certFile={certFile}
        setCertFile={setCertFile}
        downloadingTemplate={downloadingTemplate}
        handleDownloadTemplate={handleDownloadTemplate}
      />

      <div className="flex gap-4 flex-1 min-h-[60vh]">
        <PdfPreview
          url={pdfUrl ?? null}
          loading={!!pdfLoading}
          error={pdfError ?? null}
          title="IM PDF"
        />
        <div className="w-1/3 border rounded p-2 flex flex-col text-xs gap-2 bg-white">
          <div className="font-semibold">UEC / Prior Notes</div>
          <div className="flex-1 overflow-auto whitespace-pre-wrap">
            {im.notes || <span className="text-gray-500">No notes</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
