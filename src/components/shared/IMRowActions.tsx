import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  downloadInstructionalMaterial,
  deleteInstructionalMaterial,
} from "../../api/instructionalmaterial";
import { getAllUsersForIM } from "../../api/author";
import EditAuthorsModal from "./EditAuthorsModal";
import DeleteIMModal from "./DeleteIMModal";
import UploadIMModal from "./UploadIMModal";
import { useAuth } from "../auth/AuthProvider";

interface Props {
  row: any;
  onChanged: () => void;
  role?: string;
  disabled?: boolean;
  evaluateLabel?: string;
  showEvaluate?: boolean; // New prop to control evaluate button visibility
}

const STATUS_FOR_RESUBMISSION = "For Resubmission";
const STATUS_FOR_PIMEC_EVALUATION = "For PIMEC Evaluation";
const STATUS_ASSIGNED_TO_FACULTY = "Assigned to Faculty";
const STATUS_PUBLISHED = "Published";

// Statuses where evaluate button should be shown for PIMEC
const EVALUABLE_STATUSES = [
  STATUS_ASSIGNED_TO_FACULTY.toLowerCase(),
  STATUS_FOR_RESUBMISSION.toLowerCase(),
  STATUS_FOR_PIMEC_EVALUATION.toLowerCase(),
  STATUS_PUBLISHED.toLowerCase(),
];

export default function IMRowActions({
  row,
  onChanged,
  role,
  disabled = false,
  evaluateLabel = "Evaluate",
  showEvaluate = false, // Default to false - must be explicitly enabled
}: Props) {
  const { authToken } = useAuth();
  const navigate = useNavigate();

  // Modal States
  const [openUpload, setOpenUpload] = useState(false);
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Data States
  const [authorIds, setAuthorIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  const roleNorm = (role || "").toLowerCase();
  const statusNorm = String(row.status || "").toLowerCase();

  // Permission checks
  const permissions = {
    canUploadRevision:
      !disabled &&
      statusNorm === STATUS_FOR_RESUBMISSION.toLowerCase() &&
      roleNorm === "faculty",

    // row.im_id is null when enrichBaseIMs found no InstructionalMaterial record yet —
    // in that case the PIMEC hasn't assigned the IM so the upload button must be hidden.
    canInitialUpload:
      !disabled && !row.s3_link && roleNorm === "faculty" && row.im_id !== null,

    canAdminUpload:
      !disabled &&
      !row.s3_link &&
      (roleNorm === "pimec" || roleNorm === "technical admin"),

    canDownload: !!row.s3_link || !!row.id,

    canEvaluate:
      showEvaluate &&
      (roleNorm === "pimec" || roleNorm === "technical admin") &&
      EVALUABLE_STATUSES.includes(statusNorm),

    canEditAuthors:
      roleNorm === "pimec" ||
      roleNorm === "technical admin" ||
      roleNorm === "utldo admin",

    canDelete: roleNorm === "technical admin",
  };

  const canShowUpload =
    permissions.canUploadRevision ||
    permissions.canInitialUpload ||
    permissions.canAdminUpload;

  // Fetch author IDs when modal opens
  useEffect(() => {
    if (!showAuthorsModal || !authToken) return;

    let cancelled = false;

    (async () => {
      try {
        const ids = await getAllUsersForIM(row.im_id ?? row.id, authToken);
        if (!cancelled) setAuthorIds(ids);
      } catch {
        if (!cancelled) setAuthorIds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showAuthorsModal, authToken, row.im_id, row.id]);

  async function handleDelete() {
    if (!authToken) return;

    setDeleting(true);
    try {
      const res = await deleteInstructionalMaterial(
        row.im_id ?? row.id,
        authToken,
      );
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

      const res = await downloadInstructionalMaterial(
        row.im_id ?? row.id,
        authToken,
      );
      if (res?.file_path) {
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

  function handleEvaluate() {
    navigate(`/pimec/evaluate/${row.im_id ?? row.id}`, {
      state: { s3_link: row.s3_link },
    });
  }

  function getUploadButtonLabel() {
    if (permissions.canInitialUpload) return "Upload IM";
    if (permissions.canUploadRevision) return "Upload Revision";
    return "Upload PDF";
  }

  return (
    <div className="flex items-center gap-2">
      {canShowUpload && (
        <button
          type="button"
          onClick={() => setOpenUpload(true)}
          className="text-xs px-2 py-1 rounded bg-immsRed text-white hover:bg-immsDarkRed whitespace-nowrap"
        >
          {getUploadButtonLabel()}
        </button>
      )}

      {permissions.canDownload && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 whitespace-nowrap"
          onClick={handleDownload}
        >
          Download
        </button>
      )}

      {permissions.canEvaluate && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap"
          onClick={handleEvaluate}
        >
          {evaluateLabel}
        </button>
      )}

      {permissions.canEditAuthors && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap"
          onClick={() => setShowAuthorsModal(true)}
        >
          Edit Authors
        </button>
      )}

      {permissions.canDelete && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </button>
      )}

      {/* Modals */}
      <UploadIMModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        onUploaded={onChanged}
        imId={row.im_id ?? row.id}
        canInitialUpload={permissions.canInitialUpload}
      />

      <EditAuthorsModal
        imId={row.im_id ?? row.id}
        departmentId={row.department_id || row.department?.id}
        isOpen={showAuthorsModal}
        onClose={() => setShowAuthorsModal(false)}
        onSaved={onChanged}
      />

      <DeleteIMModal
        isOpen={showDeleteConfirm}
        deleting={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
