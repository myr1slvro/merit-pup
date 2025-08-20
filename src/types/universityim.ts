import type { College } from "./college";
import type { Department } from "./department";
import type { Subject } from "./subject";

export interface UniversityIM {
  id: number;
  college_id: number;
  department_id: number;
  subject_id: number;
  year_level: number;
  college?: College;
  department?: Department;
  subject?: Subject;
}
