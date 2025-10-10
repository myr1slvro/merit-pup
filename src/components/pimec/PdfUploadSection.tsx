import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { checkMissingSections } from "../../api/instructionalmaterial";

interface PdfUploadSectionProps {
  file: File | null;
  onFileChange: (f: File | null) => void;
  analysisNotes: string;
  onAnalysisChange: (notes: string) => void;
}

export default function PdfUploadSection({
  file,
  onFileChange,
  analysisNotes,
  onAnalysisChange,
}: PdfUploadSectionProps) {
  const { authToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleAnalyze() {
    if (!authToken) return;
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const res = await checkMissingSections(file, authToken);
      if (res?.error) throw new Error(res.error);
      onAnalysisChange(res?.result || "");
    } catch (e: any) {
      setError(e.message || "Failed to analyze PDF.");
    } finally {
      setUploading(false);
    }
  }

  function clearUpload() {
    onFileChange(null);
    onAnalysisChange("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-black">
        PDF File
      </label>
      <div className="mt-1 flex items-center gap-2">
        <label className="inline-flex items-center px-3 py-2 bg-gray-100 text-black rounded-md border border-gray-300 cursor-pointer hover:bg-gray-200 text-sm shadow-sm">
          Browse...
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
        <span className="text-sm text-black">
          {file ? file.name : "No file selected."}
        </span>
        {file ? (
          <button
            type="button"
            onClick={clearUpload}
            className="ml-auto px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm border border-gray-300 shadow-sm"
          onClick={handleAnalyze}
          disabled={uploading || !file}
        >
          {uploading ? "Analyzing..." : "Analyze PDF"}
        </button>
        {analysisNotes && (
          <span
            className={`text-md font-medium px-2 py-1 rounded ${
              analysisNotes.startsWith("Missing sections")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {analysisNotes}
          </span>
        )}
      </div>
      {analysisNotes && (
        <div className="mt-2 text-sm text-black">
          Status on create:{" "}
          {analysisNotes.startsWith("Missing sections") ? (
            <span className="text-red-700 font-semibold">For Resubmission</span>
          ) : (
            <span className="text-green-700 font-semibold">
              For PIMEC Evaluation
            </span>
          )}
        </div>
      )}
      {error && <div className="text-meritRed text-xs mt-1">{error}</div>}
    </div>
  );
}
