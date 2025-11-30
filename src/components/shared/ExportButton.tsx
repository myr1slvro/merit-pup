import { useState, useCallback } from "react";
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
 * - PDF: Uses browser print dialog for accurate rendering
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
      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow pop-ups to export PDF");
        return;
      }

      const element = targetRef.current;

      // Get all stylesheets
      const stylesheets = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
          } catch {
            // External stylesheets may throw CORS error
            if (sheet.href) {
              return `@import url("${sheet.href}");`;
            }
            return "";
          }
        })
        .join("\n");

      // Clone the content
      const content = element.cloneNode(true) as HTMLElement;

      // Remove the export button from the clone
      const exportBtns = content.querySelectorAll('[class*="export"]');
      exportBtns.forEach((btn) => btn.remove());

      // Build the print document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${pdfFilename}</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
              ${stylesheets}
              
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              
              body {
                font-family: 'Poppins', sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
              }
              
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            </style>
          </head>
          <body>
            ${content.outerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content and fonts to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger print dialog
      printWindow.print();

      // Close the window after a delay (user may cancel)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
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
