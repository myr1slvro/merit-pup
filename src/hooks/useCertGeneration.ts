import { useState } from "react";
import {
  generateCertificates,
  getCertOfAppreciation,
} from "../api/instructionalmaterial";
import { CertResult } from "../types/certificate";

interface Options {
  imId: number;
  authToken: string;
  onCertsGenerated?: (certs: CertResult[]) => void;
  onToast?: (type: "success" | "error", text: string) => void;
}

export function useCertGeneration({
  imId,
  authToken,
  onCertsGenerated,
  onToast,
}: Options) {
  const [generating, setGenerating] = useState(false);
  const [certsResult, setCertsResult] = useState<CertResult[] | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  async function generate(templateFile?: File) {
    setGenerating(true);
    try {
      const res = await generateCertificates(imId, authToken, templateFile);
      if (res?.error) throw new Error(res.error);
      const certs: CertResult[] = res?.certificates || [];
      setCertsResult(certs);
      onCertsGenerated?.(certs);
      const label = templateFile ? "with custom template " : "";
      onToast?.(
        "success",
        `${certs.length} certificate${certs.length !== 1 ? "s" : ""} generated ${label}& emailed.`,
      );
    } catch (e: any) {
      onToast?.("error", e.message || "Certificate generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadTemplate() {
    setDownloadingTemplate(true);
    try {
      await getCertOfAppreciation(authToken);
      onToast?.("success", "Certificate template downloaded");
    } catch (e: any) {
      onToast?.("error", e.message || "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  function reset() {
    setCertsResult(null);
    onCertsGenerated?.([]);
  }

  return { generating, certsResult, downloadingTemplate, generate, downloadTemplate, reset };
}
