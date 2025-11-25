import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/analytics`;

export interface AnalyticsFilters {
  college_id?: number;
  department_id?: number;
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
  return res.json();
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
  return res.json();
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
  return res.json();
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
  return res.json();
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
  return res.json();
};
