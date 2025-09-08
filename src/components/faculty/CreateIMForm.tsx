import React, { useEffect, useState } from "react";
import {
  uploadIMPdf,
  createInstructionalMaterial,
  checkMissingSections,
} from "../../api/instructionalmaterial";
import { getAllSubjects } from "../../api/subject";
import { getDepartmentsByCollegeId } from "../../api/department";
import { createUniversityIM } from "../../api/universityim";
import { createServiceIM } from "../../api/serviceim";
import { useAuth } from "../auth/AuthProvider";
import { IMType } from "../../types/instructionalmats";

type CreateIMFormProps = {
  selectedCollege?: any | null;
  onCancel: () => void;
  onCreated?: (newId?: number) => void;
};

export default function CreateIMForm({
  selectedCollege,
  onCancel,
  onCreated,
}: CreateIMFormProps) {
  const { authToken, user } = useAuth();

  const [imType, setImType] = useState<IMType>(IMType.university);
  const [file, setFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [analysisNotes, setAnalysisNotes] = useState<string>("");
  const [objectKey, setObjectKey] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  // Step 1: Subject selection (filtered by selected college if backend supports it)
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");

  // Conditional fields
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">(
    ""
  );
  const [yearLevel, setYearLevel] = useState<number | "">("");
  // Required by backend IM schema
  const [validity, setValidity] = useState<string>(
    String(new Date().getFullYear())
  );

  // Load subjects (all, since ERD doesn't link subjects directly to colleges)
  useEffect(() => {
    async function loadSubjects() {
      if (!authToken) return;
      try {
        const res = await getAllSubjects(authToken);
        setSubjects(res?.subjects || []);
      } catch {
        setSubjects([]);
      }
    }
    loadSubjects();
  }, [authToken]);

  // Load departments for the selected college
  useEffect(() => {
    async function loadDepartments() {
      if (!authToken || !selectedCollege?.id) {
        setDepartments([]);
        return;
      }
      try {
        const res = await getDepartmentsByCollegeId(
          selectedCollege.id,
          authToken
        );
        const list = Array.isArray(res) ? res : res?.departments || res || [];
        setDepartments(list);
      } catch {
        setDepartments([]);
      }
    }
    loadDepartments();
  }, [authToken, selectedCollege?.id]);

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
      setAnalysisNotes(res?.result || "");
      setUploadPreview(file.name);
    } catch (e: any) {
      setError(e.message || "Failed to analyze PDF.");
    } finally {
      setUploading(false);
    }
  }

  function clearUpload() {
    setFile(null);
    setUploadPreview("");
    setAnalysisNotes("");
    setObjectKey("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }
    setError("");
    setCreating(true);
    try {
      const derivedStatus =
        analysisNotes && analysisNotes.startsWith("Missing sections")
          ? "For Resubmission"
          : "For Evaluator Evaluation";
      if (!selectedSubjectId) {
        throw new Error("Please select a subject.");
      }
      if (!validity) {
        throw new Error("Please provide validity (e.g., year).");
      }
      // Create subtype record first
      let subtypeId: number | string | undefined;
      if (imType === IMType.university) {
        if (!selectedCollege?.id) throw new Error("No college selected.");
        if (!selectedDepartmentId) throw new Error("Select a department.");
        if (!yearLevel) throw new Error("Enter year level.");
        const uniPayload = {
          college_id: selectedCollege.id,
          department_id: selectedDepartmentId,
          year_level: Number(yearLevel),
          subject_id: selectedSubjectId,
        };
        const uniRes = await createUniversityIM(uniPayload, authToken);
        if (uniRes?.error) throw new Error(uniRes.error);
        subtypeId = uniRes?.id;
      } else {
        if (!selectedCollege?.id) throw new Error("No college selected.");
        const svcPayload = {
          college_id: selectedCollege.id,
          subject_id: selectedSubjectId,
        };
        const svcRes = await createServiceIM(svcPayload, authToken);
        if (svcRes?.error) throw new Error(svcRes.error);
        subtypeId = svcRes?.id;
      }

      // Upload PDF now
      const up = await uploadIMPdf(file as File, authToken);
      if (up?.error) throw new Error(up.error);
      setObjectKey(up.s3_link || up.object_key || "");
      const finalS3 = up.s3_link || up.object_key;

      // Create master IM
      const payload: any = {
        im_type: imType,
        status: derivedStatus,
        validity,
        created_by: user?.staff_id || "",
        updated_by: user?.staff_id || "",
        s3_link: finalS3,
        notes: analysisNotes || up.notes || "",
      };
      if (imType === IMType.university) {
        payload.university_im_id = subtypeId;
      } else {
        payload.service_im_id = subtypeId;
      }

      const res = await createInstructionalMaterial(payload, authToken);
      if (res?.error) throw new Error(res.error);
      onCreated?.(res?.id);
      onCancel();
    } catch (e: any) {
      setError(e.message || "Failed to create IM.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3">
      {/* Step 1: Subject selection (filtered by college requires backend support; using all subjects for now) */}
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Subject</span>
          <select
            value={selectedSubjectId || ""}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="" disabled>
              Select subject...
            </option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-gray-500">IM Type</span>
          <select
            value={imType}
            onChange={(e) => setImType(e.target.value as IMType)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value={IMType.university}>University IM</option>
            <option value={IMType.service}>Service IM</option>
          </select>
        </div>
      </div>

      {/* Conditional fields based on IM Type */}
      {imType === IMType.university ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <span className="text-xs text-gray-500">Department</span>
            <select
              value={selectedDepartmentId || ""}
              onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
              className="mt-1 block w-full border rounded px-2 py-1"
            >
              <option value="" disabled>
                Select department...
              </option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.abbreviation || d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-xs text-gray-500">Year Level</span>
            <input
              type="number"
              min={1}
              max={6}
              value={yearLevel as number | ""}
              onChange={(e) =>
                setYearLevel(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1 block w-full border rounded px-2 py-1"
              placeholder="e.g., 2"
            />
          </div>
          <div>
            <span className="text-xs text-gray-500">Validity</span>
            <input
              type="text"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
              placeholder="e.g., 2026"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-gray-500">Validity</span>
            <input
              type="text"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
              placeholder="e.g., 2026"
            />
          </div>
        </div>
      )}

      <div>
        <span className="text-xs text-gray-500">PDF File</span>
        <div className="mt-1 flex items-center gap-2">
          <label className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded border cursor-pointer hover:bg-gray-200 text-sm">
            Browse...
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <span className="text-sm text-gray-600">
            {file
              ? file.name
              : uploadPreview
              ? uploadPreview
              : "No file selected."}
          </span>
          {file || objectKey ? (
            <button
              type="button"
              onClick={clearUpload}
              className="ml-auto px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={handleAnalyze}
            disabled={uploading || !file}
          >
            {uploading ? "Analyzing..." : "Analyze PDF"}
          </button>
          {analysisNotes && (
            <span
              className={`text-xs px-2 py-1 rounded ${
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
          <div className="mt-2 text-xs text-gray-600">
            Status on create:{" "}
            {analysisNotes.startsWith("Missing sections") ? (
              <span className="text-red-700 font-semibold">
                For Resubmission
              </span>
            ) : (
              <span className="text-green-700 font-semibold">
                For Evaluator Evaluation
              </span>
            )}
          </div>
        )}
      </div>

      {error && <div className="text-meritRed text-sm">{error}</div>}

      <div className="flex flex-row-reverse gap-2 mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold"
          disabled={creating}
        >
          {creating ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-meritGray font-semibold"
          onClick={onCancel}
          disabled={creating}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
