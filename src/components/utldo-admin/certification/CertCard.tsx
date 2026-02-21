import React from "react";
import { MdPictureAsPdf, MdOutlineDescription } from "react-icons/md";
import { BsCalendar3 } from "react-icons/bs";
import { IMCertificate } from "../../../types/certificate";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface Props {
  cert: IMCertificate;
}

export default function CertCard({ cert }: Props) {
  const hasPdf = Boolean(cert.s3_link);
  const hasDocx = Boolean(cert.s3_link_docx);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-xl hover:border-immsRed/40 transition-all duration-150 flex flex-col overflow-hidden">
      <div className="h-0.5 w-full bg-immsRed" />

      <div className="flex flex-col gap-2 px-4 pt-3 pb-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold text-gray-400 tracking-widest uppercase">
            {cert.qr_id || "—"}
          </span>
          {hasPdf && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
              <MdPictureAsPdf className="text-xs" /> PDF
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-gray-800 leading-snug">
          {cert.subject_title || "Untitled Subject"}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-immsRed/10 text-immsRed text-[11px] font-semibold">
            {cert.subject_code || "—"}
          </span>
          {cert.im_version != null && (
            <span className="text-[11px] text-gray-400">v{cert.im_version}</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
            <BsCalendar3 className="shrink-0" />
            {formatDate(cert.date_issued)}
          </span>
        </div>
      </div>

      {hasPdf || hasDocx ? (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border-t border-gray-100">
          {hasPdf && (
            <a
              href={cert.s3_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-semibold bg-immsRed text-white hover:bg-red-700 transition-colors"
            >
              <MdPictureAsPdf className="text-xs" />
              View PDF
            </a>
          )}
          {hasPdf && (
            <a
              href={cert.s3_link!}
              download={`${cert.qr_id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
              title="Download PDF"
            >
              <MdPictureAsPdf className="text-red-400" /> .pdf
            </a>
          )}
          {hasDocx && (
            <a
              href={cert.s3_link_docx!}
              download={`${cert.qr_id}.docx`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
              title="Download DOCX"
            >
              <MdOutlineDescription className="text-blue-400" /> .docx
            </a>
          )}
        </div>
      ) : (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 text-center">
          Files not yet available
        </div>
      )}
    </div>
  );
}
