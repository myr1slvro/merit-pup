import axios from "./config";
import type { ActivityLog } from "../types/activitylog";

export interface PaginatedActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

// Get all activity logs with pagination
export const getAllActivityLogs = async (
  page: number = 1
): Promise<PaginatedActivityLogsResponse> => {
  const response = await axios.get(`/activity-logs/`, {
    params: { page },
  });
  return response.data;
};

// Get activity log by ID
export const getActivityLogById = async (logId: number) => {
  const response = await axios.get(`/activity-logs/${logId}`);
  return response.data;
};

// Get activity logs by user ID
export const getActivityLogsByUser = async (
  userId: number,
  page: number = 1
): Promise<PaginatedActivityLogsResponse> => {
  const response = await axios.get(`/activity-logs/user/${userId}`, {
    params: { page },
  });
  return response.data;
};

// Get activity logs by table name
export const getActivityLogsByTable = async (
  tableName: string,
  page: number = 1
): Promise<PaginatedActivityLogsResponse> => {
  const response = await axios.get(`/activity-logs/table/${tableName}`, {
    params: { page },
  });
  return response.data;
};
