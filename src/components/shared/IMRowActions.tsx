import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  uploadIMPdf,
  updateInstructionalMaterial,
  downloadInstructionalMaterial,
  checkMissingSections,
  deleteInstructionalMaterial,
} from "../../api/instructionalmaterial";
import { getAllUsersForIM } from "../../api/author";
// Removed broad getAllUsers usage in favor of department-based filtering
import EditAuthorsModal from "./EditAuthorsModal";
import DeleteIMModal from "./DeleteIMModal";
import UploadIMModal from "./UploadIMModal";
import { useAuth } from "../auth/AuthProvider";

interface Props {
  row: any; // unified row shape
  onChanged: () => void;
  role?: string;
  disabled?: boolean;
  evaluateLabel?: string; // override label (e.g., Approval)
}

const STATUS_FOR_RESUBMISSION = "For Resubmission";

export default function IMRowActions({
  row,
  onChanged,
  role,
  disabled,
  evaluateLabel = "Evaluate",
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
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authorIds, setAuthorIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  const roleNorm = (role || "").toLowerCase();

  const statusNorm = String(row.status || "").toLowerCase();

  // Faculty can upload revision when status is "For Resubmission"
  const canUploadRevision =
    !disabled &&
    statusNorm === STATUS_FOR_RESUBMISSION.toLowerCase() &&
    role === "Faculty";

  // Faculty can upload IM for the first time when s3_link is null (assigned but not yet uploaded)
  const canInitialUpload = !disabled && !row.s3_link && roleNorm === "faculty";

  // PIMEC/Admin can upload if no s3_link exists (override upload)
  const canAdminUpload =
    !disabled &&
    !row.s3_link &&
    (roleNorm === "pimec" || roleNorm === "technical admin");

  const canDownload = !!row.s3_link || !!row.id;
  const canEvaluate =
    roleNorm === "pimec" &&
    String(row.status).toLowerCase() === "for pimec evaluation";
  const canEditAuthors =
    roleNorm === "pimec" ||
    roleNorm === "technical admin" ||
    roleNorm === "utldo admin";
  const canDelete = roleNorm === "technical admin"; // tighten if needed

  useEffect(() => {
    if (!showAuthorsModal || !authToken) return;
    let cancelled = false;
    (async () => {
      try {
        const ids = await getAllUsersForIM(row.id, authToken);
        if (!cancelled) setAuthorIds(ids);
      } catch {
        if (!cancelled) setAuthorIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAuthorsModal, authToken, row.id]);

  // Author save logic moved into EditAuthorsModal component

  async function confirmDelete() {
    if (!authToken) return;
    setDeleting(true);
    try {
      const res = await deleteInstructionalMaterial(row.id, authToken);
      if (res?.error) throw new Error(res.error);
      setShowDeleteConfirm(false);
      onChanged();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    } finally {
      setDeleting(false);
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
      {(canUploadRevision || canInitialUpload || canAdminUpload) && (
        <button
          type="button"
          onClick={() => setOpenUpload(true)}
          className="text-xs px-2 py-1 rounded bg-meritRed text-white hover:bg-meritDarkRed whitespace-nowrap"
        >
          {canInitialUpload
            ? "Upload IM"
            : canUploadRevision
            ? "Upload Revision"
            : "Upload PDF"}
        </button>
      )}
      {canDownload && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 whitespace-nowrap"
          onClick={handleDownload}
        >
          Download
        </button>
      )}
      {canEvaluate && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap"
          onClick={() =>
            navigate(`/pimec/evaluate/${row.id}`, {
              state: { s3_link: row.s3_link },
            })
          }
        >
          {evaluateLabel}
        </button>
      )}
      {canEditAuthors && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap"
          onClick={() => setShowAuthorsModal(true)}
        >
          Edit Authors
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </button>
      )}

      <UploadIMModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        onUploaded={() => onChanged()}
        imId={row.id}
        canInitialUpload={canInitialUpload}
      />
      <EditAuthorsModal
        imId={row.id}
        departmentId={row.department_id || row.department?.id}
        isOpen={showAuthorsModal}
        onClose={() => setShowAuthorsModal(false)}
        onSaved={() => {
          onChanged();
        }}
      />
      <DeleteIMModal
        isOpen={showDeleteConfirm}
        deleting={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
