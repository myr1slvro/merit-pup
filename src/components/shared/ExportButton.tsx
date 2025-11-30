import { useState, useRef, useCallback } from "react";
import { FaDownload, FaFilePdf, FaFileCsv, FaSpinner } from "react-icons/fa";

interface ExportButtonProps {
  /** Target element ref for PDF capture */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Optional callback to export analytics CSV from backend */
  onExportCSV?: () => Promise<void>;
  /** PDF filename (without extension) */
  pdfFilename?: string;
  /** Button className */
  className?: string;
}

/**
 * ExportButton component for exporting analytics dashboard
 * - PDF: Captures the target element as a PDF using html2canvas + jsPDF
 * - CSV: Calls the backend export endpoint
 */
export default function ExportButton({
  targetRef,
  onExportCSV,
  pdfFilename = "analytics_report",
  className = "",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!targetRef?.current) {
      console.error("No target element provided for PDF export");
      alert("Cannot export PDF: No content to capture.");
      return;
    }

    setIsExporting(true);
    setShowDropdown(false);

    try {
      // Dynamically import to avoid SSR issues and keep bundle size smaller
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;
      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF;

      const element = targetRef.current;

      // Capture the element as a canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");

      // Calculate dimensions for PDF (A4 width)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Create PDF with appropriate size
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, Math.max(pdfHeight, 297)], // At least A4 height
      });

      // Add the image to PDF
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Add metadata
      pdf.setProperties({
        title: pdfFilename,
        subject: "Analytics Dashboard Report",
        creator: "MERIT Analytics",
      });

      // Save the PDF
      pdf.save(`${pdfFilename}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert(
        `Failed to export PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  }, [targetRef, pdfFilename]);

  const handleExportCSV = useCallback(async () => {
    if (!onExportCSV) return;

    setIsExporting(true);
    setShowDropdown(false);

    try {
      await onExportCSV();
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [onExportCSV]);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className={`flex items-center gap-2 px-4 py-2 bg-meritRed text-white rounded-lg 
          hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
      >
        {isExporting ? (
          <>
            <FaSpinner className="animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FaDownload />
            <span>Export</span>
          </>
        )}
      </button>

      {showDropdown && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {targetRef && (
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 
                hover:bg-gray-50 first:rounded-t-lg transition-colors"
            >
              <FaFilePdf className="text-red-500" />
              <span>Export as PDF</span>
            </button>
          )}
          {onExportCSV && (
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 
                hover:bg-gray-50 last:rounded-b-lg transition-colors border-t border-gray-100"
            >
              <FaFileCsv className="text-green-500" />
              <span>Export as CSV</span>
            </button>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
