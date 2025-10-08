export interface RubricItem {
  id: string;
  label: string;
  max: number;
  section: string;
  modulesOnly?: boolean;
}

export const RUBRIC_ITEMS: RubricItem[] = [
  {
    id: "A1",
    label: "Cultivate analytical, critical, and creative thinking",
    max: 5,
    section: "A",
  },
  {
    id: "A2",
    label: "Develop innovative, communicative, and life skills",
    max: 5,
    section: "A",
  },
  {
    id: "A3",
    label: "Develop wholesome character traits and values system",
    max: 5,
    section: "A",
  },
  {
    id: "B1",
    label: "Lessons sequenced per course requirements",
    max: 5,
    section: "B1",
    modulesOnly: true,
  },
  {
    id: "B2",
    label: "Materials organized by topics, themes, or principles",
    max: 5,
    section: "B1",
    modulesOnly: true,
  },
  {
    id: "B3",
    label: "Learning units arranged from simple to complex",
    max: 5,
    section: "B1",
    modulesOnly: true,
  },
  {
    id: "C1",
    label: "Subject matter specified in updated OBE syllabus",
    max: 5,
    section: "C",
  },
  {
    id: "C2",
    label: "Lessons based on theoretical constructs, scholarly written",
    max: 5,
    section: "C",
  },
  {
    id: "C3",
    label: "Use of relevant theories, concepts, principles",
    max: 5,
    section: "C",
  },
  {
    id: "C4",
    label: "Concepts presented in context understandable to learners",
    max: 5,
    section: "C",
  },
  {
    id: "C5",
    label: "Materials suited to individual learner needs",
    max: 5,
    section: "C",
  },
  {
    id: "C6",
    label: "Introduces learners to new ideas and frames of reference",
    max: 5,
    section: "C",
  },
  {
    id: "C7",
    label: "Text addresses learners’ needs, inclinations, and preferences",
    max: 5,
    section: "C",
  },
  {
    id: "C8",
    label: "Uses appropriate and relevant approaches",
    max: 5,
    section: "C",
  },
  {
    id: "C9",
    label: "Provides graphs, illustrations, maps, and figures",
    max: 5,
    section: "C",
  },
  {
    id: "C10",
    label: "Cites data sources properly (APA/MLA), lists references",
    max: 5,
    section: "C",
  },
  {
    id: "D1",
    label: "Activities for critical/creative thinking & independent learning",
    max: 4,
    section: "D1",
    modulesOnly: true,
  },
  {
    id: "D2",
    label: "Activities test newly acquired knowledge",
    max: 3,
    section: "D1",
    modulesOnly: true,
  },
  {
    id: "D3",
    label: "Activities improve oral & written communication",
    max: 3,
    section: "D1",
    modulesOnly: true,
  },
  {
    id: "E1",
    label: "Clarity and organization of contents",
    max: 4,
    section: "E1",
    modulesOnly: true,
  },
  {
    id: "E2",
    label: "Logical and critical thinking evident",
    max: 3,
    section: "E1",
    modulesOnly: true,
  },
  {
    id: "E3",
    label: "Relevance and justification",
    max: 3,
    section: "E1",
    modulesOnly: true,
  },
];

export const SECTION_TITLES: Record<string, string> = {
  A: "A. Fulfillment of Objectives",
  B1: "B. Organization",
  C: "C. Content and Lesson Presentation",
  D1: "D. Activities",
  E1: "E. Rubric for Assessment",
};
