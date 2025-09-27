export type UserRole = "Faculty" | "PIMEC" | "UTLDO Admin" | "Technical Admin";

export type User = {
  id?: number;
  staff_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date: string;
  email: string;
  phone_number: string;
  password?: string;
  role: UserRole;
  created_by: string;
  created_at?: string;
  updated_by: string;
  updated_at?: string;
  is_deleted?: boolean;
};
