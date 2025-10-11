import React from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { MdDownload } from "react-icons/md";

interface Props {
  certFile: File | null;
  setCertFile: (f: File | null) => void;
  downloadingTemplate: boolean;
  handleDownloadTemplate: () => void;
}

export default function CertificateUpload({
  certFile,
  setCertFile,
  downloadingTemplate,
  handleDownloadTemplate,
}: Props) {
  return (
    <div className="border rounded-md p-2 bg-yellow-50 border-yellow-200">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-gray-700">
            Upload Certificate of Appreciation{" "}
            <span className="text-meritRed">*</span>
          </div>
          <div className="text-xs text-gray-500">
            Accepted: .docx, .doc, .pdf
          </div>
        </div>
        <button
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
          className="flex items-center gap-2 px-2 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          title="Download certificate template"
        >
          <MdDownload className="text-sm" />
          Download Certificate Template
        </button>
      </div>

      <div className="mb-2">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setCertFile(file);
            }}
            className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-meritRed file:text-white cursor-pointer"
          />
          {certFile ? (
            <div className="text-xs text-green-700 flex items-center gap-2">
              <BsCheckCircleFill />
              <span className="truncate max-w-xs">{certFile.name}</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">No file selected</div>
          )}
        </div>
      </div>

      <div className="text-xs text-yellow-800 flex items-start gap-2">
        <IoIosWarning className="mt-0.5" />
        <span>
          Please verify the uploaded certificate before marking certified — it
          will be sent to all authors.
        </span>
      </div>
    </div>
  );
}
