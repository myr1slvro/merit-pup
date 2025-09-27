export interface IMERPIMEC {
  id: number;
  a: number; // metric A
  b: number; // metric B
  c: number; // metric C
  d: number; // metric D
  e: number; // metric E
  created_by: string;
  created_at: string; // ISO datetime
  updated_by: string;
  updated_at: string; // ISO datetime
  is_deleted: boolean;
}

export interface CreateIMERPIMECPayload {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  created_by: string;
  updated_by: string;
}

export type UpdateIMERPIMECPayload = Partial<
  Omit<CreateIMERPIMECPayload, "created_by">
> & {
  updated_by?: string;
};
