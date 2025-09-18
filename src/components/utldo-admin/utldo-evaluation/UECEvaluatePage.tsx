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
import UecRubricForm from "./UecRubricForm";
import ToastContainer, { ToastMessage } from "../../shared/Toast";
import PriorPhaseSummary from "./PriorPhaseSummary";

export default function UECEvaluatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authToken, user } = useAuth();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [s3Link, setS3Link] = useState<string | null>(
    () => (location.state as any)?.s3_link || null
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priorNotes, setPriorNotes] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [subjectName, setSubjectName] = useState<string>("");
  const [version, setVersion] = useState<string | number | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [im, setIm] = useState<any>(null);

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

  async function handleSubmit(result: {
    totalScore: number;
    totalMax: number;
    passed: boolean;
    breakdown: { section: string; subtotal: number; max: number }[];
  }) {
    if (!authToken || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // UEC threshold; if passed -> For Certification else For Resubmission
      const status = result.passed ? "For Certification" : "For Resubmission";
      const lines: string[] = [];
      lines.push(`UEC Score: ${result.totalScore}/${result.totalMax}`);
      lines.push(
        result.passed
          ? "Passed UEC quality review."
          : "Below UEC threshold; requires revision."
      );
      lines.push("UEC Section Breakdown:");
      result.breakdown.forEach((b) =>
        lines.push(` - ${b.section}: ${b.subtotal}/${b.max}`)
      );
      if (!result.passed)
        lines.push("Action: Address deficiencies before certification.");
      if (priorNotes) {
        lines.push("--- Prior Phase Notes ---");
        lines.push(priorNotes);
      }
      const notes = lines.join("\n");

      const payload: any = {
        status,
        notes,
        email: user?.email,
        updated_by: user?.email || user?.id || "utldo-admin",
      };
      const res = await updateInstructionalMaterial(
        Number(id),
        payload,
        authToken
      );
      if (res?.error) throw new Error(res.error);
      pushToast("success", `UEC evaluation submitted. Status: ${status}`);
      navigate("/utldo/evaluation");
    } catch (e: any) {
      setSubmitError(e.message || "Submission failed");
      pushToast("error", e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

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
        <div className="flex flex-col gap-3">
          <PriorPhaseSummary notes={priorNotes} />
          <UecRubricForm
            scores={scores}
            setScores={setScores}
            onSubmit={handleSubmit}
            disabled={submitting}
          />
        </div>
      </div>
      {submitError && (
        <div className="text-xs text-meritRed">{submitError}</div>
      )}
      <ToastContainer messages={toasts} remove={removeToast} />
    </div>
  );
}
