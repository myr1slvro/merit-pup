import React, { useState } from "react";
import { BsCheckCircleFill, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { MdDownload, MdAutorenew } from "react-icons/md";

interface Props {
  generating: boolean;
  downloadingTemplate: boolean;
  onGenerate: (file: File) => void;
  onDownloadTemplate: () => void;
}

/**
 * Collapsible panel that lets admins upload a custom DOCX template
 * and generate certificates from it.
 */
export default function CustomTemplatePanel({
  generating,
  downloadingTemplate,
  onGenerate,
  onDownloadTemplate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <BsChevronUp /> : <BsChevronDown />}
        Use a custom template instead
      </button>

      {open && (
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
            onClick={onDownloadTemplate}
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
            onClick={() => templateFile && onGenerate(templateFile)}
            disabled={generating || !templateFile}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <MdAutorenew className={generating ? "animate-spin" : ""} />
            {generating ? "Generating…" : "Generate with Custom Template"}
          </button>
        </div>
      )}
    </div>
  );
}
