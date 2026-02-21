import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  downloadInstructionalMaterial,
  deleteInstructionalMaterial,
  generateCertificateForUser,
} from "../../api/instructionalmaterial";
import { getAllUsersForIM, getAuthorsForIM } from "../../api/author";
import { getUserById } from "../../api/users";
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
  const [showSendCertModal, setShowSendCertModal] = useState(false);

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

    canSendCertificate:
      !disabled &&
      statusNorm === STATUS_PUBLISHED.toLowerCase() &&
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
        collegeId={row.college_id || row.university_im?.college_id || null}
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

      {showSendCertModal && (
        <SendCertificateModal
          imId={row.im_id ?? row.id}
          authToken={authToken!}
          onClose={() => setShowSendCertModal(false)}
        />
      )}
    </div>
  );
}

// ─── Send Certificate Modal ─────────────────────────────────────────────────

interface AuthorDetail {
  user_id: number;
  name: string;
  rank: string | null;
  email: string;
}

interface SendCertModalProps {
  imId: number;
  authToken: string;
  onClose: () => void;
}

function SendCertificateModal({
  imId,
  authToken,
  onClose,
}: SendCertModalProps) {
  const [authors, setAuthors] = useState<AuthorDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<
    Record<number, "idle" | "loading" | "success" | "error">
  >({});
  const [messages, setMessages] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuthorsForIM(imId, authToken)
      .then(async (list) => {
        const items = Array.isArray(list) ? list : list?.data || [];
        const detailed = await Promise.all(
          items.map(async (a: any) => {
            const uid = a.user_id ?? a.userId;
            try {
              const user = await getUserById(uid, authToken);
              const name = [
                user?.first_name,
                user?.middle_name,
                user?.last_name,
              ]
                .filter(Boolean)
                .join(" ");
              return {
                user_id: uid,
                name: name || `User ${uid}`,
                rank: user?.rank || null,
                email: user?.email || "",
              };
            } catch {
              return {
                user_id: uid,
                name: `User ${uid}`,
                rank: null,
                email: "",
              };
            }
          }),
        );
        if (!cancelled) setAuthors(detailed);
      })
      .catch(() => {
        if (!cancelled) setAuthors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imId, authToken]);

  async function sendToAuthor(userId: number) {
    setStatuses((s) => ({ ...s, [userId]: "loading" }));
    try {
      const res = await generateCertificateForUser(imId, userId, authToken);
      if ((res as any)?.error) throw new Error((res as any).error);
      setStatuses((s) => ({ ...s, [userId]: "success" }));
      setMessages((m) => ({ ...m, [userId]: "Certificate sent!" }));
    } catch (e: any) {
      setStatuses((s) => ({ ...s, [userId]: "error" }));
      setMessages((m) => ({ ...m, [userId]: e.message || "Failed" }));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Send Certificates</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            Loading authors…
          </div>
        ) : authors.length === 0 ? (
          <div className="text-sm text-gray-400 italic py-4 text-center">
            No authors found for this IM.
          </div>
        ) : (
          <ul className="space-y-3">
            {authors.map((a) => {
              const st = statuses[a.user_id] || "idle";
              return (
                <li
                  key={a.user_id}
                  className="flex items-center gap-3 border rounded p-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    {a.rank && (
                      <div className="text-xs text-gray-500">{a.rank}</div>
                    )}
                    {a.email && (
                      <div className="text-xs text-gray-400 truncate">
                        {a.email}
                      </div>
                    )}
                    {messages[a.user_id] && (
                      <div
                        className={`text-xs mt-0.5 ${st === "success" ? "text-green-600" : "text-red-500"}`}
                      >
                        {messages[a.user_id]}
                      </div>
                    )}
                    {!a.rank && (
                      <div className="text-xs text-yellow-600 italic">
                        No rank — certificate may be incomplete
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => sendToAuthor(a.user_id)}
                    disabled={st === "loading" || st === "success"}
                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      st === "success"
                        ? "bg-green-100 text-green-700 cursor-default"
                        : st === "loading"
                          ? "bg-gray-200 text-gray-500 cursor-wait"
                          : "bg-yellow-600 text-white hover:bg-yellow-700"
                    }`}
                  >
                    {st === "loading"
                      ? "Sending…"
                      : st === "success"
                        ? "Sent ✓"
                        : "Generate & Send"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
