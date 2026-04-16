import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  downloadInstructionalMaterial,
  deleteInstructionalMaterial,
  getDeletedInstructionalMaterials,
  restoreInstructionalMaterial,
  generateCertificateForUser,
} from "../../api/instructionalmaterial";
import { getAllUsersForIM, getAuthorsForIM } from "../../api/author";
import { getUserById } from "../../api/users";
import EditAuthorsModal from "./EditAuthorsModal";
import DeleteIMModal from "./DeleteIMModal";
import UploadIMModal from "./UploadIMModal";
import SendCertificateModal from "./SendCertificateModal";
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

function resolveInstructionalMaterialId(row: any): number | null {
  const hasImIdField = Object.prototype.hasOwnProperty.call(row || {}, "im_id");
  const candidate = hasImIdField ? row?.im_id : row?.id;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

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
  const [showSendCertModal, setShowSendCertModal] = useState(false);

  // Data States
  const [authorIds, setAuthorIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const roleNorm = (role || "").toLowerCase();
  const statusNorm = String(row.status || "").toLowerCase();
  const imId = resolveInstructionalMaterialId(row);
  const hasImRecord = imId !== null;

  // Permission checks
  const permissions = {
    canUploadRevision:
      hasImRecord &&
      !disabled &&
      statusNorm === STATUS_FOR_RESUBMISSION.toLowerCase() &&
      roleNorm === "faculty",

    // row.im_id is null when enrichBaseIMs found no InstructionalMaterial record yet —
    // in that case the PIMEC hasn't assigned the IM so the upload button must be hidden.
    canInitialUpload:
      hasImRecord &&
      !disabled &&
      !row.s3_link &&
      roleNorm === "faculty" &&
      row.im_id !== null,

    canAdminUpload:
      hasImRecord &&
      !disabled &&
      !row.s3_link &&
      (roleNorm === "pimec" || roleNorm === "technical admin"),

    canDownload: hasImRecord && (!!row.s3_link || !!row.id),

    canEvaluate:
      hasImRecord &&
      showEvaluate &&
      (roleNorm === "pimec" || roleNorm === "technical admin") &&
      EVALUABLE_STATUSES.includes(statusNorm),

    canEditAuthors:
      hasImRecord &&
      (roleNorm === "pimec" ||
        roleNorm === "technical admin" ||
        roleNorm === "utldo admin"),

    canDelete: hasImRecord && roleNorm === "technical admin",

    canSendCertificate:
      hasImRecord &&
      !disabled &&
      statusNorm === STATUS_PUBLISHED.toLowerCase() &&
      (roleNorm === "pimec" ||
        roleNorm === "utldo admin" ||
        roleNorm === "technical admin"),

    canRestoreMissingIm:
      !hasImRecord &&
      (roleNorm === "pimec" ||
        roleNorm === "utldo admin" ||
        roleNorm === "technical admin"),
  };

  const canShowUpload =
    permissions.canUploadRevision ||
    permissions.canInitialUpload ||
    permissions.canAdminUpload;

  // Fetch author IDs when modal opens
  useEffect(() => {
    if (!showAuthorsModal || !authToken || !imId) return;

    let cancelled = false;

    (async () => {
      try {
        const ids = await getAllUsersForIM(imId, authToken);
        if (!cancelled) setAuthorIds(ids);
      } catch {
        if (!cancelled) setAuthorIds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showAuthorsModal, authToken, imId]);

  async function handleDelete() {
    if (!authToken || !imId) return;

    setDeleting(true);
    try {
      const res = await deleteInstructionalMaterial(imId, authToken);
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
    if (!authToken || !imId) {
      alert("No active instructional material record. Restore it first.");
      return;
    }

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

      const res = await downloadInstructionalMaterial(imId, authToken);
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
    if (!imId) {
      alert("No active instructional material record. Restore it first.");
      return;
    }
    navigate(`/pimec/evaluate/${imId}`, {
      state: { s3_link: row.s3_link },
    });
  }

  function getUploadButtonLabel() {
    if (permissions.canInitialUpload) return "Upload IM";
    if (permissions.canUploadRevision) return "Upload Revision";
    return "Upload PDF";
  }

  async function handleRestoreMissingIm() {
    if (!authToken) return;

    setRestoring(true);
    try {
      const targetType = String(row?.im_type || "").toLowerCase();
      const baseId = Number(row?.id);

      if (!targetType || !Number.isFinite(baseId) || baseId <= 0) {
        throw new Error("Unable to identify base IM row for restore.");
      }

      let page = 1;
      let totalPages = 1;
      let deletedMatch: any = null;

      while (page <= totalPages && !deletedMatch) {
        const res = await getDeletedInstructionalMaterials(authToken, page);
        if (res?.error) throw new Error(res.error);

        const list = Array.isArray(res)
          ? res
          : res?.instructional_materials || [];
        totalPages = Number(res?.pages || 1);

        deletedMatch = list.find((im: any) => {
          const imType = String(im?.im_type || "").toLowerCase();
          if (imType !== targetType) return false;

          if (imType === "university") {
            return Number(im?.university_im_id) === baseId;
          }

          if (imType === "service") {
            return Number(im?.service_im_id) === baseId;
          }

          return false;
        });

        page += 1;
      }

      if (!deletedMatch?.id) {
        throw new Error(
          "No deleted instructional material found for this row. Create a new assignment first.",
        );
      }

      const restored = await restoreInstructionalMaterial(
        Number(deletedMatch.id),
        authToken,
        { reset_to_assignment: true },
      );

      if (restored?.error) throw new Error(restored.error);

      alert(
        "Instructional Material restored and reset to Assigned to Faculty.",
      );
      onChanged();
    } catch (e: any) {
      alert(e.message || "Failed to restore instructional material.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {permissions.canRestoreMissingIm && (
        <button
          type="button"
          onClick={handleRestoreMissingIm}
          disabled={restoring}
          className="text-xs px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 whitespace-nowrap disabled:opacity-50"
        >
          {restoring ? "Restoring..." : "Restore IM"}
        </button>
      )}

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

      {permissions.canSendCertificate && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700 whitespace-nowrap"
          onClick={() => setShowSendCertModal(true)}
        >
          Send Cert
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
      {imId !== null && (
        <UploadIMModal
          isOpen={openUpload}
          onClose={() => setOpenUpload(false)}
          onUploaded={onChanged}
          imId={imId}
          canInitialUpload={permissions.canInitialUpload}
        />
      )}

      {imId !== null && (
        <EditAuthorsModal
          imId={imId}
          departmentId={row.department_id || row.department?.id}
          collegeId={row.college_id || row.university_im?.college_id || null}
          isOpen={showAuthorsModal}
          onClose={() => setShowAuthorsModal(false)}
          onSaved={onChanged}
        />
      )}

      <DeleteIMModal
        isOpen={showDeleteConfirm}
        deleting={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      {showSendCertModal && imId !== null && (
        <SendCertificateModal
          imId={imId}
          authToken={authToken!}
          onClose={() => setShowSendCertModal(false)}
        />
      )}

      {!hasImRecord && !permissions.canRestoreMissingIm && (
        <span className="text-xs text-amber-700">No active IM record.</span>
      )}
    </div>
  );
}
