import { pb } from "./pocketbase";
import { getClientIpAddressSync, getDeviceInfo } from "./ipService";
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
      device: getDeviceInfo(),
    });
  } catch (error) {
    console.warn(`Failed to log ${actionType} event (non-fatal):`, error);
  }
};

export const logGradeOperation = async (
  userId: string,
  actionType: 'CREATE_GRADE' | 'UPDATE_GRADE' | 'DELETE_GRADE',
  recordId: string,
  oldValue: any,
  newValue: any
): Promise<void> => {
  try {
    const logPayload = {
      user_id: userId,
      action_type: actionType,
      record_id: recordId,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
      timestamp: new Date().toISOString(),
      ip_address: getClientIpAddressSync(),
      device: getDeviceInfo(),
    };
    
    console.log(`Creating log entry with payload:`, logPayload);
    
    await pb.collection("activity_logs").create(logPayload);
    console.log(`Grade operation logged successfully: ${actionType} for record ${recordId}`);
  } catch (error: any) {
    console.error(`Failed to log ${actionType} event:`, error);
    console.error(`Full error object:`, JSON.stringify(error, null, 2));
    const errorDetails = error?.response?.data || error?.message || 'Unknown error';
    console.error(`Error details for ${actionType}:`, errorDetails);
    throw new Error(`Failed to log grade operation: ${error?.message || 'Unknown error'}`);
  }
};

export interface TeacherActivityStatus {
  userId: string;
  teacherName: string;
  teacherEmail: string;
  isActive: boolean;
  lastLoginTime: string | null;
  lastLogoutTime: string | null;
  lastActivityTime: string;
  lastActivityType: 'LOGIN' | 'LOGOUT' | null;
}

export const getTeacherActivityStatus = async (): Promise<TeacherActivityStatus[]> => {
  try {
    // Fetch all teachers
    const teachers = await pb.collection('users').getFullList({
      filter: 'role = "teacher"',
    });

    console.log('DEBUG: Teachers data from PocketBase:', teachers);
    if (teachers.length > 0) {
      console.log('DEBUG: First teacher object keys:', Object.keys(teachers[0]));
      console.log('DEBUG: First teacher email field:', (teachers[0] as any).email);
    }

    // Fetch all login/logout logs for teachers
    const loginLogoutLogs = await pb.collection('activity_logs').getFullList({
      filter: `action_type = "LOGIN" || action_type = "LOGOUT"`,
      expand: 'user_id',
      sort: '-timestamp',
    });

    // Process each teacher to determine their status
    const teacherStatusMap = new Map<string, TeacherActivityStatus>();

    teachers.forEach((teacher: any) => {
      teacherStatusMap.set(teacher.id, {
        userId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        isActive: false, // Will be set based on activity below
        lastLoginTime: null,
        lastLogoutTime: null,
        lastActivityTime: teacher.updated || teacher.created,
        lastActivityType: null,
      });
    });

    // Find the most recent login/logout for each teacher
    const processedTeachers = new Set<string>();

    loginLogoutLogs.forEach((log: any) => {
      const teacherId = log.user_id;

      if (teacherStatusMap.has(teacherId) && !processedTeachers.has(teacherId)) {
        const teacher = teacherStatusMap.get(teacherId)!;
        const logTimestamp = log.timestamp;
        
        if (log.action_type === 'LOGIN') {
          teacher.lastLoginTime = logTimestamp;
          teacher.lastActivityType = 'LOGIN';
          teacher.isActive = true;
        } else if (log.action_type === 'LOGOUT') {
          teacher.lastLogoutTime = logTimestamp;
          teacher.lastActivityType = 'LOGOUT';
          teacher.isActive = false;
        }

        teacher.lastActivityTime = logTimestamp;
        processedTeachers.add(teacherId);
      }
    });

    // Set disabled teachers as inactive
    const teacherArray = Array.from(teacherStatusMap.values());
    teacherArray.forEach((teacher) => {
      const originalTeacher = teachers.find((t: any) => t.id === teacher.userId) as any;
      if (originalTeacher?.disabled_at) {
        teacher.isActive = false;
      }
    });

    // Return array of teachers sorted by last activity time
    return Array.from(teacherStatusMap.values()).sort((a, b) => {
      const timeA = new Date(a.lastActivityTime).getTime();
      const timeB = new Date(b.lastActivityTime).getTime();
      return timeB - timeA; // Most recent first
    });
  } catch (error) {
    console.error('Error fetching teacher activity status:', error);
    throw error;
  }
};

export const getTeacherLoginHistory = async (
  teacherId: string,
  limit: number = 20
): Promise<ActivityLog[]> => {
  try {
    const records = await pb.collection('activity_logs').getFullList({
      filter: `user_id = "${teacherId}" && (action_type = "LOGIN" || action_type = "LOGOUT")`,
      expand: 'user_id',
      sort: '-timestamp',
    });
    return (records as unknown as ActivityLog[]).slice(0, limit);
  } catch (error) {
    console.error('Error fetching teacher login history:', error);
    throw error;
  }
};
