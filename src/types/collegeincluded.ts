import type { College } from "./college";
import type { User } from "./user";

export interface CollegeIncluded {
  college_id: number;
  user_id: number;
  college?: College;
  user?: User;
}
