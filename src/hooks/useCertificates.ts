import { useState, useEffect } from "react";
import { getCertificatesByUser } from "../api/instructionalmaterial";
import { IMCertificate } from "../types/certificate";

export function useCertificates(userId?: number, authToken?: string) {
  const [certs, setCerts] = useState<IMCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !authToken) return;
    setLoading(true);
    setError(null);
    getCertificatesByUser(userId, authToken)
      .then((data: any) => {
        const list = Array.isArray(data)
          ? data
          : data?.certificates || data?.data || [];
        setCerts(list as IMCertificate[]);
      })
      .catch((e: any) => setError(e.message || "Failed to load certificates"))
      .finally(() => setLoading(false));
  }, [userId, authToken]);

  return { certs, loading, error };
}
