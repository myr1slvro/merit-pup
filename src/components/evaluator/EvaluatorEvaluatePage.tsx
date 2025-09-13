import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  downloadInstructionalMaterial,
  getInstructionalMaterial,
  getInstructionalMaterialPresignedUrl,
} from "../../api/instructionalmaterial";
import PdfPreview from "./PdfPreview";
import ImerRubricForm from "./ImerRubricForm";
import { updateInstructionalMaterial } from "../../api/instructionalmaterial";

export default function EvaluatorEvaluatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authToken, user } = useAuth();
  const [assumedIsModule, setAssumedIsModule] = useState(true); // toggle for hiding module-only fields
  const [scores, setScores] = useState<Record<string, number>>({});
  const [s3Link, setS3Link] = useState<string | null>(
    () => (location.state as any)?.s3_link || null
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch IM details if s3_link not passed via state, then request presigned URL
  useEffect(() => {
    async function loadPdf() {
      if (!id || !authToken) return;
      setLoadingPdf(true);
      setPdfError(null);
      try {
        let key = s3Link;
        if (!key) {
          const imRes = await getInstructionalMaterial(Number(id), authToken);
          if (imRes?.s3_link) {
            key = imRes.s3_link;
            setS3Link(key);
          } else {
            setPdfError("No PDF available.");
            return;
          }
        }
        const presigned = await getInstructionalMaterialPresignedUrl(
          Number(id),
          authToken
        );
        if (presigned?.url) {
          setPdfUrl(presigned.url);
        } else if (presigned?.error) {
          setPdfError(presigned.error);
        } else {
          setPdfError("Failed to get PDF URL.");
        }
      } catch (e: any) {
        setPdfError(e.message || "Error loading PDF");
      } finally {
        setLoadingPdf(false);
      }
    }
    loadPdf();
  }, [id, authToken]);

  async function handleDownloadOriginal() {
    if (!authToken || !id) return;
    try {
      const res = await downloadInstructionalMaterial(Number(id), authToken);
      if (res?.error) alert(res.error);
      else alert("Download triggered");
    } catch (e: any) {
      alert(e.message || "Download failed");
    }
  }

  async function handleSubmitEvaluation(result: {
    totalScore: number;
    totalMax: number;
    passed: boolean;
    breakdown: { section: string; subtotal: number; max: number }[];
  }) {
    if (!authToken || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const status = result.passed
        ? "For UTLDO Evaluation"
        : "For Resubmission";
      // Build notes string with breakdown
      const lines: string[] = [];
      lines.push(`Evaluator Score: ${result.totalScore}/${result.totalMax}`);
      lines.push(
        result.passed
          ? "Threshold met; forwarded for UTLDO evaluation."
          : "Threshold not met; returned for revision."
      );
      lines.push("Section Breakdown:");
      result.breakdown.forEach((b) => {
        lines.push(` - ${b.section}: ${b.subtotal}/${b.max}`);
      });
      if (!result.passed) {
        lines.push("Action: Please address deficiencies and resubmit.");
      }
      const notes = lines.join("\n");

      const payload: any = {
        status,
        notes,
        email: user?.email,
        updated_by: user?.email || user?.id || "evaluator",
      };
      const res = await updateInstructionalMaterial(
        Number(id),
        payload,
        authToken
      );
      if (res?.error) throw new Error(res.error);
      alert(`Evaluation submitted. Status set to ${status}.`);
      navigate("/evaluator");
    } catch (e: any) {
      setSubmitError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col w-full h-full p-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-meritRed">Evaluate IM #{id}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadOriginal}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-100"
          >
            Download PDF
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </div>
      <div className="flex gap-4 flex-1 min-h-[70vh]">
        <PdfPreview url={pdfUrl} loading={loadingPdf} error={pdfError} />
        <ImerRubricForm
          scores={scores}
          setScores={setScores}
          assumedIsModule={assumedIsModule}
          setAssumedIsModule={setAssumedIsModule}
          onSubmit={handleSubmitEvaluation}
          disabled={submitting}
        />
      </div>
      {submitError && (
        <div className="text-xs text-meritRed">{submitError}</div>
      )}
    </div>
  );
}
