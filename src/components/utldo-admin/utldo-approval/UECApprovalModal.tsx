import React, { useState } from "react";
import { downloadRecommendationLetterToBrowser } from "../../../api/requirements";

interface UECApprovalModalProps {
  open: boolean;
  loading: boolean;
  imStatus?: string;
  authToken: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const UECApprovalModal: React.FC<UECApprovalModalProps> = ({
  open,
  loading,
  imStatus,
  authToken,
  onCancel,
  onConfirm,
}) => {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [alreadyHasFile, setAlreadyHasFile] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!authToken) {
      setDownloadError("Authentication required");
      return;
    }

    try {
      setDownloading(true);
      setDownloadError(null);
      await downloadRecommendationLetterToBrowser(authToken);
      setHasDownloaded(true);
    } catch (error: any) {
      setDownloadError(error.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const canApprove = hasDownloaded || alreadyHasFile;

  const handleConfirm = () => {
    if (canApprove) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    // Reset state when canceling
    setHasDownloaded(false);
    setAlreadyHasFile(false);
    setDownloadError(null);
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? handleCancel : undefined}
      />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Confirm Approval
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {imStatus === "For UTLDO Evaluation"
              ? "Approve this instructional material and advance it to 'For Certification'?"
              : "Approve this instructional material?"}
          </p>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Recommendation Letter Required
            </h4>

            <div className="space-y-3">
              {/* Download Option */}
              <div className="flex items-start space-x-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading || loading || hasDownloaded}
                  className={`px-3 py-2 text-sm rounded border ${
                    hasDownloaded
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  } disabled:cursor-not-allowed`}
                >
                  {downloading
                    ? "Downloading..."
                    : hasDownloaded
                    ? "✓ Downloaded"
                    : "Download Recommendation Letter"}
                </button>
              </div>

              {downloadError && (
                <div className="text-xs text-red-600 ml-3">{downloadError}</div>
              )}

              {/* Separator */}
              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Already Have File Option */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="alreadyHasFile"
                  checked={alreadyHasFile}
                  onChange={(e) => setAlreadyHasFile(e.target.checked)}
                  disabled={loading || hasDownloaded}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="alreadyHasFile"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  I already have the recommendation letter file
                </label>
              </div>
            </div>

            {!canApprove && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                Please download the recommendation letter or confirm you already
                have it before approving.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !canApprove}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Approving..." : "Yes, Approve"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UECApprovalModal;
