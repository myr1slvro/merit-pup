import React from "react";
import { useAuth } from "../auth/AuthProvider";
import { MdWorkspacePremium } from "react-icons/md";
import { useCertificates } from "../../hooks/useCertificates";
import CertCard from "../utldo-admin/certification/CertCard";

export default function MyCertificatesPage() {
  const { user, authToken } = useAuth();
  const { certs, loading, error } = useCertificates(
    user?.id,
    authToken ?? undefined,
  );

  return (
    <div className="flex flex-col gap-4 p-8 max-w-screen-2xl mx-auto bg-white mt-8 rounded-2xl">
      {/* Page header — white card to lift above background image */}
      <div className=" backdrop-blur-sm rounded-xl px-5 flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-immsRed leading-tight">
            My Certificates
          </h1>
          <p className="text-xs text-gray mt-0.5">
            Certificates of appreciation issued for your instructional
            materials.
          </p>
        </div>
        {certs.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-immsRed/10 text-immsRed text-xs font-semibold">
            <MdWorkspacePremium />
            {certs.length} {certs.length === 1 ? "certificate" : "certificates"}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2 text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Loading your certificates…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && certs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <MdWorkspacePremium className="text-5xl text-gray-300" />
          <p className="text-sm font-medium">No certificates issued yet.</p>
          <p className="text-xs">
            Certificates will appear here once your instructional materials are
            certified.
          </p>
        </div>
      )}

      {/* Certificate card grid */}
      {!loading && certs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {certs.map((cert) => (
            <CertCard key={cert.id ?? cert.qr_id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
