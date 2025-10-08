export interface IMERPIMEC {
  id: number;
  // A section
  a1: number;
  a2: number;
  a3: number;
  a_comment?: string;
  a_subtotal: number;
  // B section
  b1: number;
  b2: number;
  b3: number;
  b_comment?: string;
  b_subtotal: number;
  // C section
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  c6: number;
  c7: number;
  c8: number;
  c9: number;
  c10: number;
  c_comment?: string;
  c_subtotal: number;
  // D section
  d1: number;
  d2: number;
  d3: number;
  d_comment?: string;
  d_subtotal: number;
  // E section
  e1: number;
  e2: number;
  e3: number;
  e_comment?: string;
  e_subtotal: number;
  // Totals
  total: number;
  overall_comment?: string;
  created_by: string;
  created_at: string; // ISO datetime
  updated_by: string;
  updated_at: string; // ISO datetime
  is_deleted: boolean;
}

export interface CreateIMERPIMECPayload {
  // A section
  a1: number;
  a2: number;
  a3: number;
  a_comment?: string;
  // B section
  b1: number;
  b2: number;
  b3: number;
  b_comment?: string;
  // C section
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  c6: number;
  c7: number;
  c8: number;
  c9: number;
  c10: number;
  c_comment?: string;
  // D section
  d1: number;
  d2: number;
  d3: number;
  d_comment?: string;
  // E section
  e1: number;
  e2: number;
  e3: number;
  e_comment?: string;
  // Overall
  overall_comment?: string;
  created_by: string;
  updated_by: string;
}

export type UpdateIMERPIMECPayload = Partial<
  Omit<CreateIMERPIMECPayload, "created_by">
> & {
  updated_by?: string;
};
