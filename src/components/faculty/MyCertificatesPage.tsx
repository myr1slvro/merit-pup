import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getCertificatesByUser } from "../../api/instructionalmaterial";
import { IMCertificate } from "../../types/certificate";
import CertDownloadButton from "../utldo-admin/certification/CertDownloadButton";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function MyCertificatesPage() {
  const { user, authToken } = useAuth();
  const [certs, setCerts] = useState<IMCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id || !authToken) return;
    setLoading(true);
    setError(null);
    getCertificatesByUser(user.id, authToken)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data?.certificates || data?.data || [];
        setCerts(list as IMCertificate[]);
      })
      .catch((e: any) => setError(e.message || "Failed to load certificates"))
      .finally(() => setLoading(false));
  }, [user?.id, authToken]);

  return (
    <div className="flex flex-col gap-4 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-immsRed">My Certificates</h1>
        <p className="text-sm text-gray-500">
          Certificates of recognition issued for your instructional materials.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          Loading certificates…
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && certs.length === 0 && (
        <div className="flex items-center justify-center py-12 text-gray-400 border rounded-lg bg-gray-50">
          No certificates issued yet.
        </div>
      )}

      {!loading && certs.length > 0 && (
        <div className="overflow-auto rounded-lg border shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-immsRed text-white">
              <tr>
                <th className="px-4 py-2 text-left font-medium">QR ID</th>
                <th className="px-4 py-2 text-left font-medium">
                  Subject Code
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  Subject Title
                </th>
                <th className="px-4 py-2 text-left font-medium">IM Version</th>
                <th className="px-4 py-2 text-left font-medium">Date Issued</th>
                <th className="px-4 py-2 text-center font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((cert, idx) => (
                <tr
                  key={cert.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {cert.qr_id || "—"}
                  </td>
                  <td className="px-4 py-2">{cert.subject_code || "—"}</td>
                  <td className="px-4 py-2">{cert.subject_title || "—"}</td>
                  <td className="px-4 py-2">
                    {cert.im_version != null ? `v${cert.im_version}` : "—"}
                  </td>
                  <td className="px-4 py-2">{formatDate(cert.date_issued)}</td>
                  <td className="px-4 py-2 text-center">
                    {cert.s3_link || cert.s3_link_docx ? (
                      <div className="flex items-center justify-center gap-2">
                        {cert.s3_link && (
                          <a
                            href={cert.s3_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-immsRed text-white rounded hover:bg-red-700 transition-colors"
                          >
                            View PDF
                          </a>
                        )}
                        <CertDownloadButton
                          pdfUrl={cert.s3_link}
                          docxUrl={cert.s3_link_docx}
                          label={cert.qr_id}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Not available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
