export type UserRole =
  | "Faculty"
  | "Evaluator"
  | "UTLDO Admin"
  | "Technical Admin";

export type User = {
  id: number;
  email: string;
  role: UserRole;
};
