import React from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { CertResult } from "../../../types/certificate";
import CertDownloadButton from "./CertDownloadButton";

interface Props {
  certs: CertResult[];
  onReset: () => void;
}

/**
 * Displays the list of generated certificates after a successful generation run.
 * Each row shows the author name, QR ID, a "View PDF" link, and download options.
 */
export default function CertResultsList({ certs, onReset }: Props) {
  return (
    <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded">
      <BsCheckCircleFill className="text-green-600 mt-0.5 shrink-0" />
      <div className="text-xs text-green-800 w-full">
        <div className="font-semibold">
          {certs.length} certificate{certs.length !== 1 ? "s" : ""} generated &amp; emailed
        </div>
        <ul className="mt-1 list-none space-y-0.5">
          {certs.map((c) => (
            <li key={c.qr_id} className="flex items-center gap-1.5">
              <span className="text-green-700">•</span>
              <span>
                {c.author_name} — <span className="font-mono">{c.qr_id}</span>
              </span>
              <div className="ml-1 flex items-center gap-1">
                {c.s3_link && (
                  <a
                    href={c.s3_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-green-700 hover:text-green-900 underline text-xs"
                  >
                    View PDF
                  </a>
                )}
                <CertDownloadButton
                  pdfUrl={c.s3_link}
                  docxUrl={c.s3_link_docx}
                  label={c.qr_id}
                />
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-1.5 text-xs underline text-green-700 hover:text-green-900"
          onClick={onReset}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
