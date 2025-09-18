import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getInstructionalMaterialPresignedUrl,
  updateInstructionalMaterial,
  getForCertification,
} from "../../../api/instructionalmaterial";
import ToastContainer, { ToastMessage } from "../../shared/Toast";
import PdfPreview from "../../shared/evaluation/PdfPreview";
import { getSubjectByImID } from "../../../api/subject";

interface CertificationIM {
  id: number;
  status: string;
  notes?: string | null;
  version?: number | string | null;
  subject_id?: number;
  subject?: { id?: number; name?: string; title?: string };
  subject_name?: string;
  s3_link?: string;
  // Possible type fields coming from backend
  im_type?: string;
  type?: string;
  material_type?: string;
  category?: string;
  format?: string;
}

export default function CertificationPage() {
  const { authToken, user } = useAuth();
  const [ims, setIMs] = useState<CertificationIM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CertificationIM | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectName, setSubjectName] = useState<string>("");
  const [subjectMap, setSubjectMap] = useState<Record<number, string>>({});
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(0);

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
      if (!authToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getForCertification(authToken, page);
        const list = Array.isArray(data?.instructional_materials)
          ? data.instructional_materials
          : Array.isArray(data)
          ? data
          : [];
        setIMs(list);
        // Pagination metadata (defensive parsing)
        const meta = data || {};
        const tp = meta.total_pages ?? meta.pages ?? meta.totalPages ?? 1;
        const ti =
          meta.total ?? meta.total_items ?? meta.totalItems ?? list.length;
        const pp = meta.per_page ?? meta.perPage ?? meta.limit ?? list.length;
        setTotalPages(Number(tp) || 1);
        setTotalItems(Number(ti) || list.length);
        setPerPage(Number(pp) || list.length);
        // Prefetch subject names for list items using IM-ID endpoint where needed
        try {
          const entries = await Promise.all(
            list.map(async (im: CertificationIM) => {
              const immediate =
                (im.subject && (im.subject.name || im.subject.title)) ||
                im.subject_name;
              if (immediate) return [im.id, String(immediate)] as const;
              if (!authToken) return [im.id, undefined] as const;
              try {
                const subjRes: any = await getSubjectByImID(im.id, authToken);
                const resolved =
                  subjRes?.subject?.name ||
                  subjRes?.subject?.title ||
                  subjRes?.name ||
                  subjRes?.title;
                return [
                  im.id,
                  resolved ? String(resolved) : undefined,
                ] as const;
              } catch {
                return [im.id, undefined] as const;
              }
            })
          );
          const map: Record<number, string> = {};
          for (const [id, name] of entries) {
            if (name) map[id] = name;
          }
          if (Object.keys(map).length)
            setSubjectMap((prev) => ({ ...prev, ...map }));
        } catch {
          // ignore prefetch errors; will resolve on selection
        }
      } catch (e: any) {
        setError(e.message || "Load error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authToken, page]);

  async function selectIM(im: CertificationIM) {
    setSelected(im);
    setPdfUrl(null);
    setPdfError(null);
    setSubjectName("");
    // Subject resolution
    const subjImmediate =
      (im.subject && (im.subject.name || im.subject.title)) || im.subject_name;
    if (subjImmediate) setSubjectName(subjImmediate);
    if (!subjImmediate && authToken) {
      try {
        setSubjectLoading(true);
        const subjRes: any = await getSubjectByImID(im.id, authToken);
        const resolved =
          subjRes?.subject?.name ||
          subjRes?.subject?.title ||
          subjRes?.name ||
          subjRes?.title;
        if (resolved) {
          setSubjectName(resolved);
          setSubjectMap((prev) => ({ ...prev, [im.id]: String(resolved) }));
        }
      } catch {
      } finally {
        setSubjectLoading(false);
      }
    }
    if (im.id && authToken) {
      try {
        setPdfLoading(true);
        const presigned = await getInstructionalMaterialPresignedUrl(
          im.id,
          authToken
        );
        if (presigned?.url) setPdfUrl(presigned.url);
        else setPdfError("No PDF URL");
      } catch (e: any) {
        setPdfError(e.message || "PDF error");
      } finally {
        setPdfLoading(false);
      }
    }
  }

  async function act(status: "Certified" | "For Resubmission") {
    if (!selected || !authToken) return;
    setActionLoading(true);
    try {
      const notesLines: string[] = [];
      notesLines.push(`Action: ${status}`);
      if (selected.notes) {
        notesLines.push("--- Existing Notes ---");
        notesLines.push(selected.notes);
      }
      const payload: any = {
        status,
        notes: notesLines.join("\n"),
        email: user?.email,
        updated_by: user?.email || user?.id || "utldo-admin",
      };
      const res = await updateInstructionalMaterial(
        selected.id,
        payload,
        authToken
      );
      if (res?.error) throw new Error(res.error);
      pushToast("success", `Updated IM ${selected.id} → ${status}`);
      // Refresh list
      setIMs((prev) => prev.filter((p) => p.id !== selected.id));
      setSelected(null);
      setPdfUrl(null);
    } catch (e: any) {
      pushToast("error", e.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full h-full p-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-meritRed">
          Certification Phase
        </h1>
      </div>
      <div className="flex gap-4 flex-1 min-h-[70vh]">
        <div className="w-1/3 border rounded p-3 flex flex-col overflow-hidden bg-white">
          <div className="font-semibold mb-2 text-sm flex items-center justify-between">
            <span>Awaiting Certification ({totalItems || ims.length})</span>
            {loading && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>
          {error && <div className="text-xs text-meritRed mb-2">{error}</div>}
          <div className="flex-1 overflow-auto divide-y">
            {ims.map((im) => {
              const immediate =
                (im.subject && (im.subject.name || im.subject.title)) ||
                im.subject_name;
              const subj = subjectMap[im.id] || immediate || "Subject";
              const imType =
                im.im_type ||
                (im as any).type ||
                im.material_type ||
                im.category ||
                im.format ||
                "IM";
              return (
                <button
                  key={im.id}
                  onClick={() => selectIM(im)}
                  className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-100 transition flex flex-col gap-0 ${
                    selected?.id === im.id ? "bg-gray-100" : ""
                  }`}
                >
                  <span className="font-medium">
                    {subj}
                    {im.version != null && ` - v${im.version}`}
                  </span>
                  <span className="text-xs text-gray-600 truncate">
                    IM Type: {imType}
                  </span>
                </button>
              );
            })}
            {!loading && ims.length === 0 && (
              <div className="text-xs text-gray-500 p-2">None pending.</div>
            )}
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              className="px-2 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Prev
            </button>
            <span className="text-gray-600">
              Page {page} / {totalPages}
            </span>
            <button
              className="px-2 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-3 p-6 bg-white">
          {!selected && (
            <div className="flex items-center justify-center h-full text-sm text-gray-500 border rounded">
              Select an IM to review and certify.
            </div>
          )}
          {selected && (
            <>
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-meritRed">
                    {subjectLoading && !subjectName
                      ? "Loading subject..."
                      : subjectName || "Subject"}
                    {selected.version != null && ` - v${selected.version}`}
                  </h2>
                  <div className="text-xs text-gray-600">
                    {selected.im_type ||
                      (selected as any).type ||
                      selected.material_type ||
                      selected.category ||
                      selected.format ||
                      "IM"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act("Certified")}
                    disabled={actionLoading}
                    className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark Certified
                  </button>
                  <button
                    onClick={() => act("For Resubmission")}
                    disabled={actionLoading}
                    className="px-3 py-1 text-xs rounded bg-meritRed text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Request Resubmission
                  </button>
                </div>
              </div>
              <div className="flex gap-4 flex-1 min-h-[60vh]">
                <PdfPreview
                  url={pdfUrl}
                  loading={pdfLoading}
                  error={pdfError}
                  title="IM PDF"
                />
                <div className="w-1/3 border rounded p-2 flex flex-col text-xs gap-2 bg-white">
                  <div className="font-semibold">UEC / Prior Notes</div>
                  <div className="flex-1 overflow-auto whitespace-pre-wrap">
                    {selected.notes ? (
                      selected.notes
                    ) : (
                      <span className="text-gray-500">No notes</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ToastContainer messages={toasts} remove={removeToast} />
      {/* TODOs: add filters (department, college), pagination, audit trail, inline diff of notes changes */}
    </div>
  );
}
