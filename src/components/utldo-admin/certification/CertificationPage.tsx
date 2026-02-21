import React, { useEffect, useState } from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { useAuth } from "../../auth/AuthProvider";
import {
  getInstructionalMaterialPresignedUrl,
  updateInstructionalMaterial,
  getForCertification,
} from "../../../api/instructionalmaterial";
import ToastContainer, { ToastMessage } from "../../shared/Toast";
import PdfPreview from "../../shared/evaluation/PdfPreview";
import { getSubjectByImID } from "../../../api/subject";
import CertificationsSidebar from "./CertificationsSidebar";
import CertificationDetail from "./CertificationDetail";

interface CertificationIM {
  id: number;
  status: string;
  notes?: string | null;
  version?: number | string | null;
  subject_id?: number;
  subject?: { id?: number; name?: string; title?: string };
  subject_name?: string;
  s3_link?: string;
  im_type?: string;
  type?: string;
  category?: string;
  format?: string;
  college_id?: number | null;
  department_id?: number | null;
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
    duration = 4000,
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
            }),
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
          authToken,
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

  async function act(status: "Published" | "For Resubmission") {
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
        user_id: user?.id, // For activity log tracking
      };
      const res = await updateInstructionalMaterial(
        selected.id,
        payload,
        authToken,
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
    <div className="flex flex-col w-full h-full p-4 gap-4 overflow-hidden">
      <div className="flex gap-4 flex-1 overflow-hidden">
        <CertificationsSidebar
          ims={ims}
          selectedId={selected?.id}
          onSelect={(im) => selectIM(im as any)}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          loading={loading}
          subjectMap={subjectMap}
        />
        <div className="flex-1 bg-white">
          {!selected && (
            <div className="flex items-center justify-center h-full text-sm text-gray-500 border rounded p-4">
              Select an IM to review and certify.
            </div>
          )}
          {selected && (
            <CertificationDetail
              im={selected}
              subjectName={subjectName}
              subjectLoading={subjectLoading}
              pdfUrl={pdfUrl}
              pdfLoading={pdfLoading}
              pdfError={pdfError}
              onAct={act}
              actionLoading={actionLoading}
              onToast={pushToast}
            />
          )}
        </div>
      </div>
      <ToastContainer messages={toasts} remove={removeToast} />
      {/* TODOs: add filters (department, college), pagination, audit trail, inline diff of notes changes */}
    </div>
  );
}
