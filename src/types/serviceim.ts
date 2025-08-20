import type { College } from "./college";
import type { Subject } from "./subject";

export interface ServiceIM {
  id: number;
  college_id: number;
  subject_id: number;
  college?: College;
  subject?: Subject;
}
