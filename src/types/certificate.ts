export interface IMCertificate {
  id: number;
  qr_id: string;
  im_id: number;
  user_id: number;
  /** PDF presigned URL — null when PDF was not generated for this cert */
  s3_link: string | null;
  s3_link_docx?: string | null;
  date_issued: string;
  created_at?: string;
  // Joined fields returned by the list-by-user endpoint
  author_name?: string;
  subject_code?: string;
  subject_title?: string;
  im_version?: string;
}

/** A single generated certificate returned by the generate-certificates endpoint */
export interface CertResult {
  qr_id: string;
  user_id: number;
  author_name: string;
  /** PDF presigned URL — null when PDF conversion was unavailable */
  s3_link: string | null;
  s3_link_docx?: string;
}

/** Slim IM shape needed by CertificationDetail */
export interface CertificationIM {
  id: number;
  version?: number | string | null;
  im_type?: string;
  material_type?: string;
  category?: string;
  format?: string;
  notes?: string | null;
  semester?: string | null;
  department_id?: number | null;
  college_id?: number | null;
  [key: string]: unknown;
}

/** Author enriched with full user details */
export interface AuthorInfo {
  user_id: number;
  name: string;
  rank: string | null;
  email: string;
}
