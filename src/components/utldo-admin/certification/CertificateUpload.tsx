import React, { useState } from "react";
import { BsCheckCircleFill, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { MdDownload, MdAutorenew } from "react-icons/md";
import {
  generateCertificates,
  getCertOfAppreciation,
} from "../../../api/instructionalmaterial";
import CertDownloadButton from "./CertDownloadButton";

interface CertResult {
  qr_id: string;
  user_id: number;
  author_name: string;
  /** PDF presigned URL — null when PDF conversion was unavailable */
  s3_link: string | null;
  s3_link_docx?: string;
}

interface Props {
  imId: number;
  authToken: string;
  onCertsGenerated?: (certs: CertResult[]) => void;
  onToast?: (type: "success" | "error", text: string) => void;
  /** @deprecated Pass imId/authToken instead — kept for backward compat */
  certFile?: File | null;
  setCertFile?: (f: File | null) => void;
  downloadingTemplate?: boolean;
  handleDownloadTemplate?: () => void;
}

export default function CertificateUpload({
  imId,
  authToken,
  onCertsGenerated,
  onToast,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [certsResult, setCertsResult] = useState<CertResult[] | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  async function handleAutoGenerate() {
    setGenerating(true);
    try {
      const res = await generateCertificates(imId, authToken);
      if (res?.error) throw new Error(res.error);
      const certs: CertResult[] = res?.certificates || [];
      setCertsResult(certs);
      onCertsGenerated?.(certs);
      onToast?.(
        "success",
        `${certs.length} certificate${certs.length !== 1 ? "s" : ""} generated & emailed.`,
      );
    } catch (e: any) {
      onToast?.("error", e.message || "Certificate generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCustomGenerate() {
    if (!templateFile) return;
    setGenerating(true);
    try {
      const res = await generateCertificates(imId, authToken, templateFile);
      if (res?.error) throw new Error(res.error);
      const certs: CertResult[] = res?.certificates || [];
      setCertsResult(certs);
      onCertsGenerated?.(certs);
      onToast?.(
        "success",
        `${certs.length} certificate${certs.length !== 1 ? "s" : ""} generated with custom template & emailed.`,
      );
    } catch (e: any) {
      onToast?.("error", e.message || "Certificate generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      await getCertOfAppreciation(authToken);
      onToast?.("success", "Certificate template downloaded");
    } catch (e: any) {
      onToast?.("error", e.message || "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  return (
    <div className="border rounded-md p-3 bg-yellow-50 border-yellow-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">
          Certificate Generation
        </div>
      </div>

      {/* Primary: auto-generate */}
      {certsResult ? (
        <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded">
          <BsCheckCircleFill className="text-green-600 mt-0.5 shrink-0" />
          <div className="text-xs text-green-800">
            <div className="font-semibold">
              {certsResult.length} certificate
              {certsResult.length !== 1 ? "s" : ""} generated &amp; emailed
            </div>
            <ul className="mt-1 list-none space-y-0.5">
              {certsResult.map((c) => (
                <li key={c.qr_id} className="flex items-center gap-1.5">
                  <span className="text-green-700">•</span>
                  <span>
                    {c.author_name} —{" "}
                    <span className="font-mono">{c.qr_id}</span>
                  </span>
                  <div className="ml-1 flex items-center gap-1">
                    {c.s3_link && (
                      <a
                        href={c.s3_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View certificate"
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
              onClick={() => {
                setCertsResult(null);
                onCertsGenerated?.([]);
              }}
            >
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAutoGenerate}
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

      {/* Secondary: custom template */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 underline"
          onClick={() => setShowCustom((v) => !v)}
        >
          {showCustom ? <BsChevronUp /> : <BsChevronDown />}
          Use a custom template instead
        </button>

        {showCustom && (
          <div className="mt-2 space-y-2 border-t pt-2">
            <p className="text-xs text-gray-500">
              Upload a <code>.docx</code> file using the placeholders below. The
              system personalizes it per author and emails each one.
            </p>
            <div className="text-xs bg-gray-100 rounded p-2 font-mono leading-relaxed whitespace-pre-line">
              {`{{AUTHOR_NAME}}  {{AUTHOR_RANK}}\n{{COLLEGE_NAME}}  {{PROGRAM_NAME}}\n{{COURSE_CODE}}  {{COURSE_TITLE}}\n{{SEMESTER}}  {{ACADEMIC_YEAR}}\n{{DATE_ISSUED}}  [QR CODE SPACE]`}
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <MdDownload />
              Download default template
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                accept=".docx"
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                className="text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-immsRed file:text-white cursor-pointer"
              />
              {templateFile && (
                <span className="text-xs text-green-700 flex items-center gap-1">
                  <BsCheckCircleFill />
                  {templateFile.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCustomGenerate}
              disabled={generating || !templateFile}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <MdAutorenew className={generating ? "animate-spin" : ""} />
              {generating ? "Generating…" : "Generate with Custom Template"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
