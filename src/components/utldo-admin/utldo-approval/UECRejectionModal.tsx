import React, { useState, useEffect } from "react";
import ConfirmationModal from "../../shared/ConfirmationModal";

interface UECRejectionModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (notes: string) => void;
  baseNotesHeader: string; // Header line to prepend
  priorNotes?: string | null;
}

export default function UECRejectionModal({
  open,
  loading,
  onCancel,
  onSubmit,
  baseNotesHeader,
  priorNotes,
}: UECRejectionModalProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setValue("");
      setTouched(false);
    }
  }, [open]);

  function handleConfirm() {
    setTouched(true);
    if (!value.trim()) return;
    // Compose full notes: header + entered text + prior
    const lines: string[] = [baseNotesHeader, value.trim()];
    if (priorNotes) {
      lines.push("--- Prior Phase Notes ---");
      lines.push(priorNotes);
    }
    onSubmit(lines.join("\n"));
  }

  // We reuse ConfirmationModal but pass a composite message placeholder and override confirm handler.
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded shadow-lg p-6 w-full max-w-md flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Confirm Rejection</h3>
        <p className="text-sm text-gray-600">
          Provide revision notes. This will move the IM to{" "}
          <span className="font-semibold">For Resubmission</span>.
        </p>
        <textarea
          className="w-full border rounded p-2 text-sm h-32 resize-y focus:outline-none focus:ring focus:ring-meritRed/30"
          placeholder="Detail the issues and required revisions..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />
        {touched && !value.trim() && (
          <div className="text-xs text-red-600">
            Revision notes are required.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Working..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
