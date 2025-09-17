import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getInstructionalMaterial, getInstructionalMaterialPresignedUrl, updateInstructionalMaterial } from '../../../api/instructionalmaterial';
import PdfPreview from '../../shared/evaluation/PdfPreview';
import UecRubricForm from './UecRubricForm';
import ToastContainer, { ToastMessage } from '../../shared/Toast';

export default function UECEvaluatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authToken, user } = useAuth();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [s3Link, setS3Link] = useState<string | null>(() => (location.state as any)?.s3_link || null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priorNotes, setPriorNotes] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function pushToast(type: ToastMessage['type'], text: string, duration = 4000) {
    setToasts(t => [...t, { id: Date.now() + Math.random(), type, text, duration }]);
  }
  function removeToast(id: number) {
    setToasts(t => t.filter(m => m.id !== id));
  }

  useEffect(() => {
    async function load() {
      if (!id || !authToken) return;
      setLoadingPdf(true);
      setPdfError(null);
      try {
        let key = s3Link;
        let imRes: any = null;
        if (!key) {
          imRes = await getInstructionalMaterial(Number(id), authToken);
          if (imRes?.s3_link) {
            key = imRes.s3_link;
            setS3Link(key);
          } else {
            setPdfError('No PDF available.');
          }
        } else {
          imRes = await getInstructionalMaterial(Number(id), authToken);
        }
        if (imRes?.notes) setPriorNotes(imRes.notes);
        const presigned = await getInstructionalMaterialPresignedUrl(Number(id), authToken);
        if (presigned?.url) setPdfUrl(presigned.url); else setPdfError('Failed to fetch PDF.');
      } catch (e: any) {
        setPdfError(e.message || 'Error fetching PDF');
      } finally {
        setLoadingPdf(false);
      }
    }
    load();
  }, [id, authToken]);

  function parsePriorEvaluatorSummary() {
    if (!priorNotes) return null;
    const lines = priorNotes.split(/\r?\n/);
    const evalHeaderIndex = lines.findIndex(l => l.startsWith('Evaluator Score:'));
    if (evalHeaderIndex === -1) return priorNotes; // fallback
    return lines.slice(evalHeaderIndex, evalHeaderIndex + 25).join('\n');
  }

  async function handleSubmit(result: { totalScore: number; totalMax: number; passed: boolean; breakdown: { section: string; subtotal: number; max: number }[] }) {
    if (!authToken || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // UEC threshold; if passed -> For Certification else For Resubmission
      const status = result.passed ? 'For Certification' : 'For Resubmission';
      const lines: string[] = [];
      lines.push(`UEC Score: ${result.totalScore}/${result.totalMax}`);
      lines.push(result.passed ? 'Passed UEC quality review.' : 'Below UEC threshold; requires revision.');
      lines.push('UEC Section Breakdown:');
      result.breakdown.forEach(b => lines.push(` - ${b.section}: ${b.subtotal}/${b.max}`));
      if (!result.passed) lines.push('Action: Address deficiencies before certification.');
      if (priorNotes) {
        lines.push('--- Prior Phase Notes ---');
        lines.push(priorNotes);
      }
      const notes = lines.join('\n');

      const payload: any = {
        status,
        notes,
        email: user?.email,
        updated_by: user?.email || user?.id || 'utldo-admin'
      };
      const res = await updateInstructionalMaterial(Number(id), payload, authToken);
      if (res?.error) throw new Error(res.error);
      pushToast('success', `UEC evaluation submitted. Status: ${status}`);
      navigate('/utldo/evaluation');
    } catch (e: any) {
      setSubmitError(e.message || 'Submission failed');
      pushToast('error', e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='flex flex-col w-full h-full p-4 gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-meritRed'>UEC Evaluate IM #{id}</h1>
        <button onClick={() => navigate(-1)} className='px-3 py-1 text-xs rounded border hover:bg-gray-100'>Back</button>
      </div>
      {priorNotes && (
        <div className='bg-white border rounded p-3 text-xs whitespace-pre-wrap max-h-40 overflow-auto'>
          <div className='font-semibold mb-1 text-meritRed'>Prior Phase Summary</div>
          {parsePriorEvaluatorSummary()}
        </div>
      )}
      <div className='flex gap-4 flex-1 min-h-[70vh]'>
        <PdfPreview url={pdfUrl} loading={loadingPdf} error={pdfError} title='IM PDF' />
        <UecRubricForm
          scores={scores}
          setScores={setScores}
          onSubmit={handleSubmit}
          disabled={submitting}
        />
      </div>
      {submitError && <div className='text-xs text-meritRed'>{submitError}</div>}
      <ToastContainer messages={toasts} remove={removeToast} />
    </div>
  );
}
