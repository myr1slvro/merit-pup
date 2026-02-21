import React, { useState, useRef, useEffect } from "react";
import {
  MdDownload,
  MdPictureAsPdf,
  MdOutlineDescription,
} from "react-icons/md";

interface CertDownloadButtonProps {
  pdfUrl?: string | null;
  docxUrl?: string | null;
  /** Label used as the download filename base, e.g. "CERT-26" */
  label?: string;
  className?: string;
}

/**
 * A small button that opens a dropdown giving the user a choice of
 * downloading the certificate as PDF or DOCX.
 */
export default function CertDownloadButton({
  pdfUrl,
  docxUrl,
  label = "certificate",
  className = "",
}: CertDownloadButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasPdf = Boolean(pdfUrl);
  const hasDocx = Boolean(docxUrl);
  if (!hasPdf && !hasDocx) return null;

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        title="Download certificate"
      >
        <MdDownload className="text-sm" />
        Download
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-10 overflow-hidden">
          {hasPdf && (
            <a
              href={pdfUrl!}
              download={`${label}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
            >
              <MdPictureAsPdf className="text-red-500 text-sm shrink-0" />
              Download PDF
            </a>
          )}
          {hasDocx && (
            <a
              href={docxUrl!}
              download={`${label}.docx`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
            >
              <MdOutlineDescription className="text-blue-500 text-sm shrink-0" />
              Download DOCX
            </a>
          )}
        </div>
      )}
    </div>
  );
}
