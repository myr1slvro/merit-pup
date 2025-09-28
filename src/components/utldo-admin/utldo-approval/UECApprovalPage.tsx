import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import {
  getInstructionalMaterial,
  getInstructionalMaterialPresignedUrl,
  updateInstructionalMaterial,
} from "../../../api/instructionalmaterial";
import { getSubjectByImID } from "../../../api/subject";
import PdfPreview from "../../shared/evaluation/PdfPreview";
import ToastContainer, { ToastMessage } from "../../shared/Toast";
import UECApprovalActions from "./UECApprovalActions";

export default function UECApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authToken, user } = useAuth();

  // (Scores removed for UTLDO phase - placeholder left if needed for future rubric)
  // const [scores, setScores] = useState<Record<string, number>>({});
  const [s3Link, setS3Link] = useState<string | null>(
    () => (location.state as any)?.s3_link || null
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Removed local submit states; handled in child actions component
  const [priorNotes, setPriorNotes] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [subjectName, setSubjectName] = useState<string>("");
  const [version, setVersion] = useState<string | number | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [im, setIm] = useState<any>(null);
  // Action state moved to child component

  function pushToast(
    type: ToastMessage["type"],
    text: string,
    duration = 4000
  ) {
    setToasts((t) => [
      ...t,
      { id: Date.now() + Math.random(), type, text, duration },
    ]);
  }
  function removeToast(id: number) {
    setToasts((t) => t.filter((m) => m.id !== id));
  }

  useEffect(() => {
    async function load() {
      if (!id || !authToken) return;
      setLoadingPdf(true);
      setPdfError(null);
      setSubjectLoading(true);
      try {
        // Always fetch IM for notes, version, etc.
        const imRes: any = await getInstructionalMaterial(
          Number(id),
          authToken
        );
        setIm(imRes);
        if (imRes?.notes) setPriorNotes(imRes.notes);
        if (imRes?.version != null) setVersion(imRes.version);

        // Fetch subject name via new endpoint
        const subjRes = await getSubjectByImID(Number(id), authToken);
        if (subjRes?.name) {
          setSubjectName(subjRes.name);
        } else {
          setSubjectName("");
        }

        const presigned = await getInstructionalMaterialPresignedUrl(
          Number(id),
          authToken
        );
        if (presigned?.url) setPdfUrl(presigned.url);
        else setPdfError("Failed to fetch PDF.");
      } catch (e: any) {
        setPdfError(e.message || "Error fetching PDF");
      } finally {
        setLoadingPdf(false);
        setSubjectLoading(false);
      }
    }
    load();
  }, [id, authToken]);

  // Prior phase parsing moved into PriorPhaseSummary component

  // Status change logic moved to UECApprovalActions

  return (
    <div className="flex flex-col w-full h-full p-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-meritRed leading-tight flex flex-col gap-0">
          {subjectLoading ? (
            <span className="">Loading subject...</span>
          ) : (
            (subjectName || version) && (
              <span className="">
                UTLDO Evaluation - {subjectName || "Subject"}
                {version != null && ` · v${version}`}
              </span>
            )
          )}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 text-xs rounded border hover:bg-gray-100"
        >
          Back
        </button>
      </div>
      <div className="flex gap-4 flex-1 min-h-[70vh]">
        <PdfPreview
          url={pdfUrl}
          loading={loadingPdf}
          error={pdfError}
          title={subjectName}
        />
        <UECApprovalActions
          imId={Number(id)}
          imStatus={im?.status}
          priorNotes={priorNotes}
          authToken={authToken as string}
          userEmail={user?.email}
          userId={user?.id}
          pushToast={pushToast}
          onDone={() => navigate("/utldo/evaluation")}
        />
      </div>
      {/* Error display removed; child handles inline errors */}
      <ToastContainer messages={toasts} remove={removeToast} />
    </div>
  );
}
