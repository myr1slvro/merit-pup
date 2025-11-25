export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  table_name: string;
  record_id?: number | null;
  old_values?: string | null;
  new_values?: string | null;
  description: string;
  created_at: string;
}
