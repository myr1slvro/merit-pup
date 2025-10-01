import React from "react";

interface DeleteIMModalProps {
  isOpen: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteIMModal: React.FC<DeleteIMModalProps> = ({
  isOpen,
  deleting,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !deleting && onCancel()}
      />
      <div className="relative bg-white rounded shadow-lg p-6 w-full max-w-sm z-10 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-red-700">Delete IM</h3>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this instructional material? This
          action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={deleting}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="px-4 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteIMModal;
