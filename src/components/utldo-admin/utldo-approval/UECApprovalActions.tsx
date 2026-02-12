import React, { useState } from "react";
import UECApprovalModal from "./UECApprovalModal";
import UECRejectionModal from "./UECRejectionModal";
import { updateInstructionalMaterial } from "../../../api/instructionalmaterial";
import PriorPhaseSummary from "./PriorPhaseSummary";
import { getIMERPIMECById } from "../../../api/imerpimec";

import { ToastMessage } from "../../shared/Toast";

interface Props {
  imId: number;
  imStatus?: string;
  priorIMERPIMECId?: number | null;
  authToken: string;
  userEmail?: string;
  userId?: string | number;
  onDone: () => void; // navigate back after success
  pushToast: (type: ToastMessage["type"], text: string) => void;
}

export default function UECApprovalActions({
  imId,
  imStatus,
  priorIMERPIMECId,
  authToken,
  userEmail,
  userId,
  onDone,
  pushToast,
}: Props) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotesOverride, setRejectNotesOverride] = useState<string | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState<
    "approve" | "reject" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [priorIMERPIMEC, setPriorIMERPIMEC] = useState<any | null>(null);

  // Fetch prior IMERPIMEC details if id is provided
  React.useEffect(() => {
    if (priorIMERPIMECId && authToken) {
      getIMERPIMECById(priorIMERPIMECId, authToken).then((res) => {
        if (!(res as any).error) {
          setPriorIMERPIMEC(res);
        }
      });
    } else {
      setPriorIMERPIMEC(null);
    }
  }, [priorIMERPIMECId, authToken]);

  function buildNotes(header: string, explicit?: string) {
    if (explicit) return explicit; // already composed in rejection modal
    const lines: string[] = [header];
    if (priorIMERPIMEC) {
      lines.push("--- Prior Phase Rubric ---");
      // You can use a utility to format priorIMERPIMEC as a string, or just JSON.stringify for now
      lines.push(JSON.stringify(priorIMERPIMEC, null, 2));
    }
    return lines.join("\n");
  }

  async function performStatusChange(
    nextStatus: string,
    header: string,
    kind: "approve" | "reject",
    explicitNotes?: string
  ) {
    if (!authToken || !imId) return;
    setActionLoading(kind);
    setError(null);
    try {
      const payload: any = {
        status: nextStatus,
        notes: buildNotes(header, explicitNotes),
        email: userEmail,
        updated_by: userEmail || userId || "utldo-admin",
        user_id: userId, // For activity log tracking
      };
      const res = await updateInstructionalMaterial(imId, payload, authToken);
      if ((res as any)?.error) throw new Error((res as any).error);
      pushToast(
        "success",
        `Instructional Material status updated: ${nextStatus}`
      );
      onDone();
    } catch (e: any) {
      setError(e.message || "Action failed");
      pushToast("error", e.message || "Action failed");
    } finally {
      setActionLoading(null);
      setShowApproveModal(false);
      setShowRejectModal(false);
      setRejectNotesOverride(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <PriorPhaseSummary imerpimec={priorIMERPIMEC} />
      <div className="flex gap-2">
        <button
          className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={actionLoading !== null}
          onClick={() => setShowRejectModal(true)}
        >
          Reject
        </button>
        <button
          className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={actionLoading !== null}
          onClick={() => setShowApproveModal(true)}
        >
          Approve
        </button>
      </div>
      {error && <div className="text-xs text-immsRed">{error}</div>}
      <UECApprovalModal
        open={showApproveModal}
        loading={actionLoading === "approve"}
        imStatus={imStatus}
        authToken={authToken}
        onCancel={() => !actionLoading && setShowApproveModal(false)}
        onConfirm={() =>
          performStatusChange(
            "For Certification",
            "Approved by UTLDO for Certification",
            "approve",
          )
        }
      />
      <UECRejectionModal
        open={showRejectModal}
        loading={actionLoading === "reject"}
        baseNotesHeader="Returned by UTLDO for revision"
        onCancel={() => !actionLoading && setShowRejectModal(false)}
        onSubmit={(fullNotes) =>
          performStatusChange(
            "For Resubmission",
            "Returned by UTLDO for revision",
            "reject",
            fullNotes,
          )
        }
      />
    </div>
  );
}
