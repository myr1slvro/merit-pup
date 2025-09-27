import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  updateInstructionalMaterial,
  downloadInstructionalMaterial,
  checkMissingSections,
} from "../../api/instructionalmaterial";
import { useAuth } from "../auth/AuthProvider";

interface Props {
  row: any; // unified row shape
  onChanged: () => void;
  role?: string;
  disabled?: boolean;
}

const STATUS_FOR_RESUBMISSION = "For Resubmission";

export default function IMRowActions({
  row,
  onChanged,
  role,
  disabled,
}: Props) {
  const { authToken } = useAuth();
  const navigate = useNavigate();
  const [openUpload, setOpenUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysisNotes, setAnalysisNotes] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  const canUploadRevision =
    !disabled && row.status === STATUS_FOR_RESUBMISSION && role === "Faculty";
  const canDownload = !!row.s3_link || !!row.id;
  const canEvaluate =
    role === "pimec" && row.status === "For PIMEC Evaluation";

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    if (!file) {
      setError("Select a PDF first");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const analysisIndicatesMissing =
        analysisNotes.startsWith("Missing sections");
      const nextStatus = analysisIndicatesMissing
        ? STATUS_FOR_RESUBMISSION
        : "For PIMEC Evaluation";
      const payload: any = {
        pdf_file: file,
        status: nextStatus,
        notes: analysisNotes,
        updated_by: "system",
      };
      const updateRes = await updateInstructionalMaterial(
        row.id,
        payload,
        authToken
      );
      if (updateRes.error) throw new Error(updateRes.error);
      setOpenUpload(false);
      setAnalysisNotes("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onChanged();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!authToken) return;
    const selected = fileRef.current?.files?.[0];
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

  async function handleDownload() {
    if (!authToken) return;
    try {
      // Prefer direct S3 link if bucket env provided
      if (row.s3_link) {
        const bucket = (import.meta as any).env?.VITE_S3_BUCKET;
        if (bucket) {
          const url = `https://${bucket}.s3.amazonaws.com/${row.s3_link}`;
          window.open(url, "_blank", "noopener");
          return;
        }
      }
      const res = await downloadInstructionalMaterial(row.id, authToken);
      if (res?.file_path) {
        // Backend saved locally; just notify user.
        alert(`Downloaded on server: ${res.file_name || res.file_path}`);
      } else if (res?.error) {
        alert(res.error);
      } else {
        alert("Download request sent.");
      }
    } catch (e: any) {
      alert(e.message || "Download failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canUploadRevision && (
        <button
          type="button"
          onClick={() => setOpenUpload(true)}
          className="text-xs px-2 py-1 rounded bg-meritRed text-white hover:bg-meritDarkRed"
        >
          Upload Revision
        </button>
      )}
      {canDownload && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          onClick={handleDownload}
        >
          Download
        </button>
      )}
      {canEvaluate && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() =>
            navigate(`/pimec/evaluate/${row.id}`, {
              state: { s3_link: row.s3_link },
            })
          }
        >
          Evaluate
        </button>
      )}

      {openUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !uploading && setOpenUpload(false)}
          />
          <form
            onSubmit={handleUploadSubmit}
            className="relative bg-white rounded shadow-lg p-6 w-full max-w-lg z-10 flex flex-col gap-4"
          >
            <h3 className="text-lg font-semibold">Upload Revised PDF</h3>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded border cursor-pointer hover:bg-gray-200 text-sm">
                Browse...
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
              <span className="text-sm text-gray-600">
                {file ? file.name : "No file selected."}
              </span>
              {file && (
                <button
                  type="button"
                  className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => {
                    setFile(null);
                    setAnalysisNotes("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  disabled={uploading || analyzing}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || uploading}
                className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Analyze PDF"}
              </button>
              {analysisNotes && (
                <span
                  className={`text-xs px-2 py-1 rounded whitespace-pre-line ${
                    analysisNotes.startsWith("Missing sections")
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {analysisNotes}
                </span>
              )}
            </div>
            {analysisNotes && row.status === STATUS_FOR_RESUBMISSION && (
              <div className="text-xs text-gray-600">
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
            )}
            {error && <div className="text-meritRed text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!uploading) {
                    setOpenUpload(false);
                    setFile(null);
                    setAnalysisNotes("");
                    if (fileRef.current) fileRef.current.value = "";
                  }
                }}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || analyzing || !analysisNotes || !file}
                className="px-4 py-1 text-sm bg-meritRed text-white rounded hover:bg-meritDarkRed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
