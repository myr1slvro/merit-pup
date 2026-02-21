import React from "react";
import CertificateUpload from "./CertificateUpload";
import PdfPreview from "../../shared/evaluation/PdfPreview";
import PriorPhaseSummary from "../utldo-approval/PriorPhaseSummary";
import EditAuthorsModal from "../../shared/EditAuthorsModal";
import { useAuth } from "../../auth/AuthProvider";
import { getIMERPIMECById } from "../../../api/imerpimec";
import { getAuthorsForIM } from "../../../api/author";
import { getUserById } from "../../../api/users";
import {
  updateInstructionalMaterial,
  generateCertificates,
} from "../../../api/instructionalmaterial";
import { BsCheckCircleFill } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { MdAutorenew } from "react-icons/md";

interface CertResult {
  qr_id: string;
  user_id: number;
  author_name: string;
  /** PDF presigned URL — null when PDF conversion was unavailable */
  s3_link: string | null;
  s3_link_docx?: string;
}

interface CertificationIM {
  id: number;
  version?: number | string | null;
  im_type?: string;
  material_type?: string;
  category?: string;
  format?: string;
  notes?: string | null;
  semester?: string | null;
  department_id?: number | null;
  college_id?: number | null;
}

interface AuthorInfo {
  user_id: number;
  name: string;
  rank: string | null;
  email: string;
}

interface Props {
  im: CertificationIM;
  subjectName?: string;
  subjectLoading?: boolean;
  pdfUrl?: string | null;
  pdfLoading?: boolean;
  pdfError?: string | null;
  onAct: (status: "Published" | "For Resubmission") => void;
  actionLoading: boolean;
  onToast?: (type: "success" | "error", text: string) => void;
}

export default function CertificationDetail({
  im,
  subjectName,
  subjectLoading,
  pdfUrl,
  pdfLoading,
  pdfError,
  onAct,
  actionLoading,
  onToast,
}: Props) {
  const imType = im.im_type || "IM";
  const { authToken } = useAuth();

  const [priorIMERPIMEC, setPriorIMERPIMEC] = React.useState<any | null>(
    (im as any).imerpimec ?? null,
  );
  const [authors, setAuthors] = React.useState<AuthorInfo[]>([]);
  const [authorsLoading, setAuthorsLoading] = React.useState(false);
  const [showEditAuthors, setShowEditAuthors] = React.useState(false);

  // Editable semester
  const [semester, setSemester] = React.useState<string>(im.semester || "");
  const [editingSemester, setEditingSemester] = React.useState(false);
  const [savingSemester, setSavingSemester] = React.useState(false);

  // Certificate tracking
  const [generatedCerts, setGeneratedCerts] = React.useState<CertResult[]>([]);
  const [showCertifyModal, setShowCertifyModal] = React.useState(false);

  React.useEffect(() => {
    setSemester(im.semester || "");
  }, [im.id, im.semester]);

  // Load prior IMERPIMEC
  React.useEffect(() => {
    let cancelled = false;
    async function loadPrior() {
      if (!authToken) return;
      const priorId = (im as any).imerpimec_id ?? (im as any).imerpimec?.id;
      if (!priorId) {
        setPriorIMERPIMEC((im as any).imerpimec ?? null);
        return;
      }
      try {
        const res = await getIMERPIMECById(priorId, authToken);
        if (!cancelled && !(res as any).error) setPriorIMERPIMEC(res);
      } catch {
        if (!cancelled) setPriorIMERPIMEC((im as any).imerpimec ?? null);
      }
    }
    loadPrior();
    return () => {
      cancelled = true;
    };
  }, [authToken, im]);

  // Load authors with full user details
  React.useEffect(() => {
    let cancelled = false;
    async function loadAuthors() {
      if (!authToken || !im.id) return;
      setAuthorsLoading(true);
      try {
        const authorList = await getAuthorsForIM(im.id, authToken);
        const items = Array.isArray(authorList)
          ? authorList
          : authorList?.data || [];
        const detailed: AuthorInfo[] = await Promise.all(
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
      } catch {
        if (!cancelled) setAuthors([]);
      } finally {
        if (!cancelled) setAuthorsLoading(false);
      }
    }
    loadAuthors();
    return () => {
      cancelled = true;
    };
  }, [authToken, im.id]);

  async function saveSemester() {
    if (!authToken) return;
    setSavingSemester(true);
    try {
      const res = await updateInstructionalMaterial(
        im.id,
        { semester },
        authToken,
      );
      if (res?.error) throw new Error(res.error);
      setEditingSemester(false);
      onToast?.("success", "Semester updated");
    } catch (e: any) {
      onToast?.("error", e.message || "Failed to save semester");
    } finally {
      setSavingSemester(false);
    }
  }

  if (!im) return null;

  return (
    <div className="flex-1 flex flex-col rounded-lg shadow-lg gap-3 p-4 bg-white">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-immsRed">
            {subjectLoading && !subjectName
              ? "Loading subject..."
              : subjectName || "Subject"}
            {im.version != null && ` - v${im.version}`}
          </h2>
          <div className="text-xs text-gray-600">{imType}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCertifyModal(true)}
            disabled={actionLoading}
            className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark Certified
          </button>
          <button
            onClick={() => onAct("For Resubmission")}
            disabled={actionLoading}
            className="px-3 py-1 text-sm rounded bg-immsRed text-white hover:bg-red-700 disabled:opacity-50"
          >
            Request Resubmission
          </button>
        </div>
      </div>

      {/* Semester inline edit */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 text-xs font-medium">Semester:</span>
        {editingSemester ? (
          <>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="border rounded px-2 py-0.5 text-xs"
              disabled={savingSemester}
            >
              <option value="">-- Select --</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
            <button
              onClick={saveSemester}
              disabled={savingSemester}
              className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {savingSemester ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setSemester(im.semester || "");
                setEditingSemester(false);
              }}
              disabled={savingSemester}
              className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-800">
              {semester || (
                <span className="italic text-gray-400">Not set</span>
              )}
            </span>
            <button
              onClick={() => setEditingSemester(true)}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Authors preview */}
      <div className="border rounded p-2 bg-gray-50 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-700">Authors</span>
          <button
            type="button"
            onClick={() => setShowEditAuthors(true)}
            className="text-xs text-blue-600 underline hover:text-blue-800"
          >
            Edit Authors
          </button>
        </div>
        {authorsLoading ? (
          <div className="text-gray-400">Loading authors…</div>
        ) : authors.length === 0 ? (
          <div className="text-gray-400 italic">No authors found</div>
        ) : (
          <ul className="space-y-1">
            {authors.map((a) => (
              <li key={a.user_id} className="flex items-center gap-2">
                <span className="font-medium">{a.name}</span>
                {a.rank && (
                  <span className="bg-blue-100 text-blue-700 rounded px-1 py-0.5 text-xs">
                    {a.rank}
                  </span>
                )}
                {a.email && <span className="text-gray-500">{a.email}</span>}
                {!a.rank && (
                  <span className="text-yellow-600 italic">No rank set</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Certificate generation */}
      {authToken && (
        <CertificateUpload
          imId={im.id}
          authToken={authToken}
          onCertsGenerated={(certs) => setGeneratedCerts(certs)}
          onToast={onToast}
        />
      )}

      {/* PDF + Prior summary */}
      <div className="flex gap-4 flex-1 min-h-[60vh]">
        <PdfPreview
          url={pdfUrl ?? null}
          loading={!!pdfLoading}
          error={pdfError ?? null}
          title="IM PDF"
        />
        <div className="w-1/3 border rounded p-2 flex flex-col text-xs gap-2 bg-white">
          <div className="font-semibold">Prior Phase Summary</div>
          <div className="flex-1 overflow-auto">
            <PriorPhaseSummary imerpimec={priorIMERPIMEC} />
          </div>
        </div>
      </div>

      {/* Edit Authors Modal */}
      <EditAuthorsModal
        imId={im.id}
        departmentId={im.department_id}
        collegeId={im.college_id}
        isOpen={showEditAuthors}
        onClose={() => setShowEditAuthors(false)}
        onSaved={() => {
          setShowEditAuthors(false);
          // Reload authors after saving
          setAuthors([]);
          setAuthorsLoading(true);
          if (authToken) {
            getAuthorsForIM(im.id, authToken)
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
                setAuthors(detailed);
              })
              .finally(() => setAuthorsLoading(false));
          }
        }}
      />

      {/* Certify Confirmation Modal */}
      {showCertifyModal && authToken && (
        <CertifyConfirmModal
          imId={im.id}
          authToken={authToken}
          generatedCerts={generatedCerts}
          actionLoading={actionLoading}
          onCertsGenerated={(certs) => setGeneratedCerts(certs)}
          onConfirm={() => {
            setShowCertifyModal(false);
            onAct("Published");
          }}
          onClose={() => setShowCertifyModal(false)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ─── Certify Confirmation Modal ──────────────────────────────────────────────

interface CertifyConfirmModalProps {
  imId: number;
  authToken: string;
  generatedCerts: CertResult[];
  actionLoading: boolean;
  onCertsGenerated: (certs: CertResult[]) => void;
  onConfirm: () => void;
  onClose: () => void;
  onToast?: (type: "success" | "error", text: string) => void;
}

function CertifyConfirmModal({
  imId,
  authToken,
  generatedCerts,
  actionLoading,
  onCertsGenerated,
  onConfirm,
  onClose,
  onToast,
}: CertifyConfirmModalProps) {
  const hasCerts = generatedCerts.length > 0;
  const [generating, setGenerating] = React.useState(false);
  const [localCerts, setLocalCerts] =
    React.useState<CertResult[]>(generatedCerts);
  React.useEffect(() => {
    setLocalCerts(generatedCerts);
  }, [generatedCerts]);

  async function handleGenerateNow() {
    setGenerating(true);
    try {
      const res = await generateCertificates(imId, authToken);
      if (res?.error) throw new Error(res.error);
      const certs: CertResult[] = res?.certificates || [];
      setLocalCerts(certs);
      onCertsGenerated(certs);
      onToast?.(
        "success",
        `${certs.length} certificate(s) generated & emailed.`,
      );
    } catch (e: any) {
      onToast?.("error", e.message || "Certificate generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const certsToShow = localCerts.length > 0 ? localCerts : generatedCerts;
  const confirmed = certsToShow.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            Confirm Certification
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {!confirmed ? (
          /* ── Certs not yet generated ── */
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              <IoIosWarning className="text-yellow-500 text-lg shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  Certificates haven&apos;t been generated yet.
                </p>
                <p className="text-xs mt-0.5 text-yellow-700">
                  It&apos;s recommended to generate and review certificates
                  before marking this IM as certified.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateNow}
              disabled={generating}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              <MdAutorenew className={generating ? "animate-spin" : ""} />
              {generating
                ? "Generating certificates…"
                : "Generate Certificates Now"}
            </button>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                Or proceed without certificates
              </span>
              <button
                type="button"
                onClick={onConfirm}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Skip &amp; Publish Anyway
              </button>
            </div>
          </div>
        ) : (
          /* ── Certs generated — show list for review ── */
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
              <BsCheckCircleFill className="shrink-0" />
              <span className="font-medium">
                {certsToShow.length} certificate
                {certsToShow.length !== 1 ? "s" : ""} generated
              </span>
            </div>
            <div className="border rounded divide-y max-h-56 overflow-auto">
              {certsToShow.map((c) => (
                <div
                  key={c.qr_id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {c.author_name}
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {c.qr_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {c.s3_link ? (
                      <a
                        href={c.s3_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No link</span>
                    )}
                    <CertDownloadButton
                      pdfUrl={c.s3_link}
                      docxUrl={c.s3_link_docx}
                      label={c.qr_id}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={handleGenerateNow}
                disabled={generating}
                className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
              >
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {actionLoading ? "Publishing…" : "Confirm & Publish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
