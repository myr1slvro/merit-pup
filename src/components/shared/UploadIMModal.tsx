import React, { useRef, useState } from "react";
import {
  uploadIMPdf,
  updateInstructionalMaterial,
  checkMissingSections,
} from "../../api/instructionalmaterial";
import { useAuth } from "../auth/AuthProvider";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
  imId: number;
  canInitialUpload?: boolean;
}

export default function UploadIMModal({
  isOpen,
  onClose,
  onUploaded,
  imId,
  canInitialUpload,
}: Props) {
  const { authToken } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async function handleAnalyze() {
    if (!authToken) return;
    // prefer the actual input file list, but fall back to the local `file` state
    const selected = fileRef.current?.files?.[0] || file;
    if (!selected) {
      setError("Select a PDF first");
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const res = await checkMissingSections(selected, authToken);
      if (res?.error) throw new Error(res.error);
      setAnalysisNotes(res?.result || "");
      setFile(selected);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function onDropFile(f: File) {
    setAnalysisNotes("");
    setFile(f);
    if (fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(f);
      try {
        fileRef.current.files = dt.files;
      } catch (err) {}
    }
  }

  async function handleUploadSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!authToken) return;
    if (!file) {
      setError("Select a PDF first");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const analysisIndicatesMissing =
        analysisNotes.startsWith("Missing sections");
      const nextStatus = analysisIndicatesMissing
        ? "For Resubmission"
        : "For PIMEC Evaluation";

      const uploadRes = await uploadIMPdf(file, authToken, imId);
      if (uploadRes?.error) throw new Error(uploadRes.error);

      const metaPayload: any = {
        status: nextStatus,
        notes: analysisNotes,
        updated_by: "system",
      };
      const updateRes = await updateInstructionalMaterial(
        imId,
        metaPayload,
        authToken
      );
      if (updateRes?.error) throw new Error(updateRes.error);
      // success
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setAnalysisNotes("");
      onUploaded();
      onClose();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !uploading && onClose()}
      />

      <form
        onSubmit={handleUploadSubmit}
        className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl z-10 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 id="upload-title" className="text-lg font-semibold">
              {canInitialUpload
                ? "Upload Instructional Material"
                : "Upload Revision"}
            </h3>
            <p id="upload-help" className="text-sm text-gray-600 mt-1">
              Files must be PDF and up to <strong>50 MB</strong>. Analyze the
              file to detect missing sections before uploading.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close upload dialog"
            onClick={() => !uploading && onClose()}
            className="text-gray-500 hover:text-gray-700"
          >
            x
          </button>
        </div>

        <div
          className={`border-2 rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? "border-meritRed bg-meritRed/5"
              : "border-dashed border-gray-300 bg-gray-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer?.files?.[0];
            if (f) onDropFile(f);
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📄</div>
            <div className="text-sm text-gray-700">
              Drag & drop a PDF here, or
              <label className="ml-2 inline-flex items-center px-3 py-1 bg-white border rounded cursor-pointer text-sm text-meritRed hover:bg-meritRed/5">
                <span className="sr-only">Select file</span>
                Browse
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    setAnalysisNotes("");
                    setFile(e.target.files?.[0] || null);
                  }}
                  className="hidden"
                  disabled={uploading || analyzing}
                />
              </label>
            </div>
            <div className="text-xs text-gray-500">
              Only PDF files are accepted.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {file ? (
              <div>
                <div className="font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {formatBytes(file.size)}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No file selected.</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || uploading || !file}
              className="px-4 py-1 text-sm bg-meritRed text-white rounded hover:bg-meritDarkRed disabled:opacity-50"
            >
              {analyzing ? "Analyzing..." : "Analyze PDF"}
            </button>
            <button
              type="submit"
              disabled={uploading || analyzing || !analysisNotes || !file}
              className="px-4 py-1 text-sm bg-meritDarkRed text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>

        {analysisNotes && (
          <div className="mt-2">
            <div
              className={`p-3 rounded text-sm whitespace-pre-line border ${
                analysisNotes.startsWith("Missing sections")
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-green-50 border-green-200 text-green-800"
              }`}
            >
              <div className="font-medium mb-1">Analysis results</div>
              <div className="font-bold">{analysisNotes}</div>
            </div>

            <div className="text-sm text-gray-600 mt-2">
              Next status:&nbsp;
              {analysisNotes.startsWith("Missing sections") ? (
                <span className="text-red-700 font-semibold">
                  For Resubmission
                </span>
              ) : (
                <span className="text-green-700 font-semibold">
                  For PIMEC Evaluation
                </span>
              )}
            </div>
          </div>
        )}

        {error && <div className="text-meritRed text-sm">{error}</div>}
      </form>
    </div>
  );
}
