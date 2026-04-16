import { API_BASE_URL } from "./config";
import type { ActivityLog } from "../types/activitylog";

const API_URL = `${API_BASE_URL}/activity-logs`;

export interface PaginatedActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

export interface ActivityLogFilters {
  page?: number;
  per_page?: number;
  user_id?: number;
  table_name?: string;
  action?: string;
  q?: string;
  start_date?: string;
  end_date?: string;
}

export interface ActivityLogFilterMetadata {
  actions: string[];
  table_names: string[];
}

function buildQuery(filters: ActivityLogFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseJsonResponse(response: Response) {
  const fallback = {
    error: `Request failed (${response.status})`,
  };

  let body: any;
  try {
    body = await response.json();
  } catch {
    body = fallback;
  }

  if (!response.ok) {
    throw new Error(body?.error || fallback.error);
  }

  return body;
}

// Get all activity logs with pagination
export const getAllActivityLogs = async (
  token: string,
  filters: ActivityLogFilters = {},
): Promise<PaginatedActivityLogsResponse> => {
  const response = await fetch(`${API_URL}/${buildQuery(filters)}`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
};

// Get activity log by ID
export const getActivityLogById = async (logId: number, token: string) => {
  const response = await fetch(`${API_URL}/${logId}`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
};

// Get activity logs by user ID
export const getActivityLogsByUser = async (
  userId: number,
  token: string,
  filters: Omit<ActivityLogFilters, "user_id"> = {},
): Promise<PaginatedActivityLogsResponse> => {
  const response = await fetch(
    `${API_URL}/user/${userId}${buildQuery(filters)}`,
    {
      headers: authHeaders(token),
    },
  );
  return parseJsonResponse(response);
};

// Get activity logs by table name
export const getActivityLogsByTable = async (
  tableName: string,
  token: string,
  filters: Omit<ActivityLogFilters, "table_name"> = {},
): Promise<PaginatedActivityLogsResponse> => {
  const response = await fetch(
    `${API_URL}/table/${encodeURIComponent(tableName)}${buildQuery(filters)}`,
    {
      headers: authHeaders(token),
    },
  );
  return parseJsonResponse(response);
};

export const getAuditLogs = async (
  token: string,
  filters: ActivityLogFilters = {},
): Promise<PaginatedActivityLogsResponse> => {
  const response = await fetch(`${API_URL}/${buildQuery(filters)}`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
};

export const getActivityLogFilterMetadata = async (
  token: string,
): Promise<ActivityLogFilterMetadata> => {
  const response = await fetch(`${API_URL}/meta`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
};
