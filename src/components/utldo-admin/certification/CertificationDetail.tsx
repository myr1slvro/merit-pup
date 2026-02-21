import React from "react";
import CertificateUpload from "./CertificateUpload";
import AuthorsPanel from "./AuthorsPanel";
import CertifyConfirmModal from "./CertifyConfirmModal";
import PdfPreview from "../../shared/evaluation/PdfPreview";
import PriorPhaseSummary from "../utldo-approval/PriorPhaseSummary";
import EditAuthorsModal from "../../shared/EditAuthorsModal";
import { useAuth } from "../../auth/AuthProvider";
import { getIMERPIMECById } from "../../../api/imerpimec";
import { useAuthors } from "../../../hooks/useAuthors";
import { useSemesterEdit } from "../../../hooks/useSemesterEdit";
import { CertResult, CertificationIM } from "../../../types/certificate";

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
  const [showEditAuthors, setShowEditAuthors] = React.useState(false);
  const [generatedCerts, setGeneratedCerts] = React.useState<CertResult[]>([]);
  const [showCertifyModal, setShowCertifyModal] = React.useState(false);

  const { authors, loading: authorsLoading, reload: reloadAuthors } =
    useAuthors(im.id, authToken ?? undefined);

  const {
    semester,
    setSemester,
    editing: editingSemester,
    setEditing: setEditingSemester,
    saving: savingSemester,
    save: saveSemester,
    cancel: cancelSemesterEdit,
  } = useSemesterEdit(im.id, im.semester ?? "", authToken ?? undefined, onToast);

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
              onClick={cancelSemesterEdit}
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

      {/* Authors */}
      <AuthorsPanel
        authors={authors}
        loading={authorsLoading}
        onEditClick={() => setShowEditAuthors(true)}
      />

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
          reloadAuthors();
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