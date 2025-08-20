export interface Subject {
  id: number;
  code: string;
  name: string;
  created_by: string;
  created_at?: string;
  updated_by: string;
  updated_at?: string;
  is_deleted?: boolean;
}
