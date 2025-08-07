export type UserRole =
  | "Faculty"
  | "Evaluator"
  | "UTLDO Admin"
  | "Technical Admin";

export type User = {
  user_id: number;
  staff_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  is_deleted: boolean;
};
