import { pb } from "./pocketbase";
import { getClientIpAddressSync } from "./ipService";
import type { ActivityLog } from "../types/Log";

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  try {
    const records = await pb.collection("activity_logs").getFullList({
      expand: "user_id",
      sort: "-timestamp",
    });
    return records as unknown as ActivityLog[];
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
};

export const getLogsByGradeId = async (gradeId: string): Promise<ActivityLog[]> => {
  try {
    const records = await pb.collection("activity_logs").getFullList({
      filter: `record_id = "${gradeId}"`,
      expand: "user_id",
      sort: "-timestamp",
    });
    return records as unknown as ActivityLog[];
  } catch (error) {
    console.error("Error fetching logs for grade:", error);
    throw error;
  }
};

export const getLogsByUserId = async (userId: string): Promise<ActivityLog[]> => {
  try {
    const records = await pb.collection("activity_logs").getFullList({
      filter: `user_id = "${userId}"`,
      expand: "user_id",
      sort: "-timestamp",
    });
    return records as unknown as ActivityLog[];
  } catch (error) {
    console.error("Error fetching logs for user:", error);
    throw error;
  }
};

export const getLogsByActionType = async (actionType: 'LOGIN' | 'LOGOUT' | 'CREATE_GRADE' | 'UPDATE_GRADE' | 'DELETE_GRADE'): Promise<ActivityLog[]> => {
  try {
    const records = await pb.collection("activity_logs").getFullList({
      filter: `action_type = "${actionType}"`,
      expand: "user_id",
      sort: "-timestamp",
    });
    return records as unknown as ActivityLog[];
  } catch (error) {
    console.error("Error fetching logs by action type:", error);
    throw error;
  }
};

export const getLogsInDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<ActivityLog[]> => {
  try {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    const records = await pb.collection("activity_logs").getFullList({
      filter: `timestamp >= "${startIso}" && timestamp <= "${endIso}"`,
      expand: "user_id",
      sort: "-timestamp",
    });
    return records as unknown as ActivityLog[];
  } catch (error) {
    console.error("Error fetching logs in date range:", error);
    throw error;
  }
};

export const logAuthEvent = async (
  userId: string,
  actionType: 'LOGIN' | 'LOGOUT',
  userData: any
): Promise<void> => {
  try {
    await pb.collection("activity_logs").create({
      user_id: userId,
      action_type: actionType,
      record_id: userId,
      old_value: JSON.stringify({}),
      new_value: JSON.stringify(userData),
      timestamp: new Date().toISOString(),
      ip_address: getClientIpAddressSync(),
    });
  } catch (error) {
    console.warn(`Failed to log ${actionType} event (non-fatal):`, error);
  }
};
