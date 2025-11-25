import type { UniversityIM } from "./universityim";
import type { ServiceIM } from "./serviceim";

export enum IMType {
  university = "university",
  service = "service",
}

export interface InstructionalMaterial {
  id: number;
  im_type: string;
  university_im_id: number;
  service_im_id: number;
  status: string;
  validity: string;
  version: string;
  s3_link: string;
  notes?: string | null;
  due_date?: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  is_deleted: boolean;
  university_im?: UniversityIM;
  service_im?: ServiceIM;
}
