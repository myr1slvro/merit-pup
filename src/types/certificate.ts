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
