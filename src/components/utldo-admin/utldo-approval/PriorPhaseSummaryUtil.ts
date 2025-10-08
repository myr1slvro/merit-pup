import { RUBRIC_ITEMS, SECTION_TITLES } from "../../pimec/rubric";
import type { IMERPIMEC } from "../../../types/imerpimec";

// Utility to format an IMERPIMEC object as a rubric summary string
// Pass the IMERPIMEC object as returned from the backend
export function formatIMERPIMECToRubricSummary(
  imer: Partial<IMERPIMEC> | any
): string {
  if (!imer) return "";
  const sectionMap: Record<string, typeof RUBRIC_ITEMS> = {};
  RUBRIC_ITEMS.forEach((item) => {
    (sectionMap[item.section] ||= []).push(item);
  });
  const lines: string[] = [];
  Object.keys(sectionMap).forEach((section) => {
    const sectionTitle = SECTION_TITLES[section] || section;
    lines.push(sectionTitle);
    sectionMap[section].forEach((item) => {
      // Backend fields are lowercase (e.g., a1, b1_1, etc.)
      const field = item.id.toLowerCase();
      const score = imer[field] ?? "-";
      lines.push(`${item.label} - ${score}/${item.max}`);
    });
    // Section comment (e.g., a_comment, b1_comment, ...)
    const commentField = section.toLowerCase() + "_comment";
    if (imer[commentField]) {
      lines.push(`Comments: ${imer[commentField]}`);
    }
    lines.push("");
  });
  if (imer.overall_comment) {
    lines.push("Overall Comments:");
    lines.push(imer.overall_comment);
  }
  return lines.join("\n");
}
