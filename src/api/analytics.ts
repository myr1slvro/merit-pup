import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/analytics`;

export interface AnalyticsFilters {
  college_id?: number;
  department_id?: number;
}

// Helper to handle API responses with proper error checking
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export interface AnalyticsOverview {
  status_distribution: Array<{ status: string; count: number }>;
  recent_activity_count: number;
  user_role_distribution: Array<{ role: string; count: number }>;
  ims_by_month: Array<{ year: number; month: number; count: number }>;
}

export interface CollegeAnalytics {
  colleges: Array<{
    id: number;
    name: string;
    count: number;
    certified?: number;
    completion_rate: number;
  }>;
}

export interface DepartmentAnalytics {
  departments: Array<{
    id: number;
    name: string;
    college_name: string;
    count: number;
  }>;
}

export interface UserContributions {
  top_contributors: Array<{
    user_id: number;
    name: string;
    role: string;
    college: string;
    contributions: number;
  }>;
}

export interface ActivityTimeline {
  timeline: Array<{
    date: string;
    CREATE: number;
    UPDATE: number;
  }>;
}

// Helper to build query string from filters
const buildQueryString = (
  params: Record<string, string | number | undefined>
): string => {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
  if (filtered.length === 0) return "";
  return (
    "?" + filtered.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&")
  );
};

// Get overall analytics overview
export const getAnalyticsOverview = async (
  token: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsOverview> => {
  const query = buildQueryString({
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/overview${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AnalyticsOverview>(res);
};

// Get analytics by college
export const getCollegeAnalytics = async (
  token: string,
  filters?: AnalyticsFilters
): Promise<CollegeAnalytics> => {
  const query = buildQueryString({
    college_id: filters?.college_id,
  });
  const res = await fetch(`${API_URL}/colleges${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<CollegeAnalytics>(res);
};

// Get analytics by department
export const getDepartmentAnalytics = async (
  token: string,
  collegeId?: number
): Promise<DepartmentAnalytics> => {
  const query = buildQueryString({ college_id: collegeId });
  const res = await fetch(`${API_URL}/departments${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<DepartmentAnalytics>(res);
};

// Get user contribution analytics
export const getUserContributions = async (
  token: string,
  limit: number = 10,
  filters?: AnalyticsFilters
): Promise<UserContributions> => {
  const query = buildQueryString({
    limit,
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/users/contributions${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserContributions>(res);
};

// Get activity timeline
export const getActivityTimeline = async (
  token: string,
  days: number = 30,
  filters?: AnalyticsFilters
): Promise<ActivityTimeline> => {
  const query = buildQueryString({
    days,
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/activity/timeline${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ActivityTimeline>(res);
};

export interface UserSubmissions {
  user_submissions: Array<{
    user_id: number;
    name: string;
    role: string;
    college: string;
    submissions: number;
  }>;
}

export interface SubmissionsTimeline {
  timeline: Array<{
    date: string;
    submissions: number;
  }>;
}

export interface DeadlineAnalytics {
  summary: {
    overdue: number;
    due_soon: number;
    due_this_month: number;
    on_track: number;
    no_deadline: number;
  };
  overdue_ims: Array<{
    im_id: number;
    subject: string | null;
    college: string | null;
    status: string;
    due_date: string;
    days_overdue: number;
  }>;
  due_soon_ims: Array<{
    im_id: number;
    subject: string | null;
    college: string | null;
    status: string;
    due_date: string;
    days_remaining: number;
  }>;
}

export interface WorkflowAnalytics {
  stages: Array<{
    name: string;
    count: number;
  }>;
  stuck_ims: Record<string, number>;
  total_active: number;
  total_completed: number;
}

// Get submissions count per user
export const getSubmissionsByUser = async (
  token: string,
  limit: number = 10,
  filters?: AnalyticsFilters
): Promise<UserSubmissions> => {
  const query = buildQueryString({
    limit,
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/submissions/by-user${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserSubmissions>(res);
};

// Get submissions timeline
export const getSubmissionsTimeline = async (
  token: string,
  days: number = 30,
  filters?: AnalyticsFilters
): Promise<SubmissionsTimeline> => {
  const query = buildQueryString({
    days,
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/submissions/timeline${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<SubmissionsTimeline>(res);
};

// Get deadline analytics
export const getDeadlineAnalytics = async (
  token: string,
  filters?: AnalyticsFilters
): Promise<DeadlineAnalytics> => {
  const query = buildQueryString({
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/deadlines${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<DeadlineAnalytics>(res);
};

// Get workflow analytics
export const getWorkflowAnalytics = async (
  token: string,
  filters?: AnalyticsFilters
): Promise<WorkflowAnalytics> => {
  const query = buildQueryString({
    college_id: filters?.college_id,
    department_id: filters?.department_id,
  });
  const res = await fetch(`${API_URL}/workflow${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<WorkflowAnalytics>(res);
};
