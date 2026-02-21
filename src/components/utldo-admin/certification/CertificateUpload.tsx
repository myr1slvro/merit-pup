import React from "react";
import { IoIosWarning } from "react-icons/io";
import { MdAutorenew } from "react-icons/md";
import { useCertGeneration } from "../../../hooks/useCertGeneration";
import CertResultsList from "./CertResultsList";
import CustomTemplatePanel from "./CustomTemplatePanel";
import { CertResult } from "../../../types/certificate";

interface Props {
  imId: number;
  authToken: string;
  onCertsGenerated?: (certs: CertResult[]) => void;
  onToast?: (type: "success" | "error", text: string) => void;
}

export default function CertificateUpload({
  imId,
  authToken,
  onCertsGenerated,
  onToast,
}: Props) {
  const {
    generating,
    certsResult,
    downloadingTemplate,
    generate,
    downloadTemplate,
    reset,
  } = useCertGeneration({ imId, authToken, onCertsGenerated, onToast });

  return (
    <div className="border rounded-md p-3 bg-yellow-50 border-yellow-200 space-y-3">
      <div className="text-sm font-semibold text-gray-700">
        Certificate Generation
      </div>

      {certsResult ? (
        <CertResultsList certs={certsResult} onReset={reset} />
      ) : (
        <button
          type="button"
          onClick={() => generate()}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition font-semibold"
        >
          <MdAutorenew
            className={`text-lg ${generating ? "animate-spin" : ""}`}
          />
          {generating
            ? "Generating certificates…"
            : "Generate & Send Certificates"}
        </button>
      )}

      <div className="text-xs text-yellow-800 flex items-start gap-1">
        <IoIosWarning className="mt-0.5 shrink-0" />
        <span>
          Each author receives a personalized certificate (name, rank, QR code,
          IM details) via email automatically.
        </span>
      </div>

      <CustomTemplatePanel
        generating={generating}
        downloadingTemplate={downloadingTemplate}
        onGenerate={(file) => generate(file)}
        onDownloadTemplate={downloadTemplate}
      />
    </div>
  );
}
