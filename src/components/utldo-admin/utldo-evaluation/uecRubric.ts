// UEC (UTLDO / UEC phase) rubric configuration
// Structure mirrors IMER rubric but can diverge as needed.

export type UecRubricSection = {
  key: string;
  title: string;
  items: { key: string; label: string; max: number }[];
  max: number; // convenience total
};

export const UEC_RUBRIC_SECTIONS: UecRubricSection[] = [
  {
    key: "alignment",
    title: "Curriculum Alignment & Outcomes",
    items: [
      { key: "clo_mapping", label: "Clear mapping to course outcomes", max: 5 },
      {
        key: "heis_alignment",
        label: "Alignment with institutional goals",
        max: 5,
      },
      {
        key: "revision_integrity",
        label: "Revisions maintain academic integrity",
        max: 5,
      },
    ],
    max: 15,
  },
  {
    key: "quality",
    title: "Instructional Quality & Pedagogy",
    items: [
      { key: "pedagogical_soundness", label: "Pedagogical soundness", max: 5 },
      {
        key: "assessment_alignment",
        label: "Assessments align with objectives",
        max: 5,
      },
      {
        key: "feedback_quality",
        label: "Quality of feedback mechanisms",
        max: 5,
      },
      {
        key: "learner_engagement",
        label: "Learner engagement strategies",
        max: 5,
      },
    ],
    max: 20,
  },
  {
    key: "compliance",
    title: "Policy & Standards Compliance",
    items: [
      {
        key: "ip_clearance",
        label: "IP / Copyright clearance adherence",
        max: 5,
      },
      {
        key: "style_guide",
        label: "Adherence to formatting/style guide",
        max: 5,
      },
      {
        key: "accessibility",
        label: "Accessibility & inclusivity considerations",
        max: 5,
      },
    ],
    max: 15,
  },
  {
    key: "technical",
    title: "Technical & Distribution Readiness",
    items: [
      {
        key: "file_integrity",
        label: "File integrity (readable, complete)",
        max: 5,
      },
      { key: "media_quality", label: "Embedded media quality", max: 5 },
      {
        key: "metadata_completeness",
        label: "Metadata completeness (title, authors, etc.)",
        max: 5,
      },
    ],
    max: 15,
  },
];

export function totalUecMax() {
  return UEC_RUBRIC_SECTIONS.reduce((acc, s) => acc + s.max, 0);
}
