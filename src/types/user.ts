export type UserRole =
  | "Faculty"
  | "Evaluator"
  | "UTLDO Admin"
  | "Technical Admin";

export type User = {
  id: string;
  email: string;
  password: string;
  role: UserRole;
};
