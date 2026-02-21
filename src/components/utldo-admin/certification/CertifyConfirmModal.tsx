import React, { useState, useEffect } from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { MdAutorenew } from "react-icons/md";
import { generateCertificates } from "../../../api/instructionalmaterial";
import { CertResult } from "../../../types/certificate";
import CertDownloadButton from "./CertDownloadButton";

interface Props {
  imId: number;
  authToken: string;
  generatedCerts: CertResult[];
  actionLoading: boolean;
  onCertsGenerated: (certs: CertResult[]) => void;
  onConfirm: () => void;
  onClose: () => void;
  onToast?: (type: "success" | "error", text: string) => void;
}

/**
 * Modal shown when an admin clicks "Mark Certified".
 * Allows generating/reviewing certificates before confirming publication.
 */
export default function CertifyConfirmModal({
  imId,
  authToken,
  generatedCerts,
  actionLoading,
  onCertsGenerated,
  onConfirm,
  onClose,
  onToast,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [localCerts, setLocalCerts] = useState<CertResult[]>(generatedCerts);

  useEffect(() => {
    setLocalCerts(generatedCerts);
  }, [generatedCerts]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generateCertificates(imId, authToken);
      if (res?.error) throw new Error(res.error);
      const certs: CertResult[] = res?.certificates || [];
      setLocalCerts(certs);
      onCertsGenerated(certs);
      onToast?.("success", `${certs.length} certificate(s) generated & emailed.`);
    } catch (e: any) {
      onToast?.("error", e.message || "Certificate generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const certsToShow = localCerts.length > 0 ? localCerts : generatedCerts;
  const hasCerts = certsToShow.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Confirm Certification</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">
            &times;
          </button>
        </div>

        {!hasCerts ? (
          <NoCertsWarning
            generating={generating}
            actionLoading={actionLoading}
            onGenerate={handleGenerate}
            onSkip={onConfirm}
          />
        ) : (
          <CertReviewList
            certs={certsToShow}
            generating={generating}
            actionLoading={actionLoading}
            onRegenerate={handleGenerate}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function NoCertsWarning({
  generating,
  actionLoading,
  onGenerate,
  onSkip,
}: {
  generating: boolean;
  actionLoading: boolean;
  onGenerate: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
        <IoIosWarning className="text-yellow-500 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Certificates haven&apos;t been generated yet.</p>
          <p className="text-xs mt-0.5 text-yellow-700">
            It&apos;s recommended to generate and review certificates before marking this IM as certified.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        <MdAutorenew className={generating ? "animate-spin" : ""} />
        {generating ? "Generating certificates…" : "Generate Certificates Now"}
      </button>
      <div className="border-t pt-3 flex justify-between items-center">
        <span className="text-xs text-gray-400">Or proceed without certificates</span>
        <button
          type="button"
          onClick={onSkip}
          disabled={actionLoading}
          className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Skip &amp; Publish Anyway
        </button>
      </div>
    </div>
  );
}

function CertReviewList({
  certs,
  generating,
  actionLoading,
  onRegenerate,
  onCancel,
  onConfirm,
}: {
  certs: CertResult[];
  generating: boolean;
  actionLoading: boolean;
  onRegenerate: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
        <BsCheckCircleFill className="shrink-0" />
        <span className="font-medium">
          {certs.length} certificate{certs.length !== 1 ? "s" : ""} generated
        </span>
      </div>
      <div className="border rounded divide-y max-h-56 overflow-auto">
        {certs.map((c) => (
          <div key={c.qr_id} className="flex items-center justify-between px-3 py-2">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{c.author_name}</span>
              <span className="text-xs font-mono text-gray-500">{c.qr_id}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              {c.s3_link ? (
                <a
                  href={c.s3_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View PDF
                </a>
              ) : (
                <span className="text-xs text-gray-400">No link</span>
              )}
              <CertDownloadButton pdfUrl={c.s3_link} docxUrl={c.s3_link_docx} label={c.qr_id} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={generating}
          className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
        >
          {generating ? "Regenerating…" : "Regenerate"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={actionLoading}
            className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {actionLoading ? "Publishing…" : "Confirm & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
