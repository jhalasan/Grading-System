import { pb } from "./pocketbase";
import { validateUserExists } from "./pocketbase";
import { getClientIpAddressSync } from "./ipService";
import type { Grade } from "../types/Grade";

export const getAllGrades = async (): Promise<Grade[]> => {
  try {
    const records = await pb.collection("grades").getFullList({
      expand: "student_id,last_modified_by",
      sort: "-updated",
    });
    return records as unknown as Grade[];
  } catch (error: any) {
    console.error("Error fetching grades:", error);
    console.error("Error status:", error?.status);
    console.error("Error message:", error?.message);
    console.error("Full error:", JSON.stringify(error));
    throw error;
  }
};

export const getGradeById = async (gradeId: string): Promise<Grade> => {
  try {
    const record = await pb.collection("grades").getOne(gradeId, {
      expand: "student_id,last_modified_by",
    });
    return record as unknown as Grade;
  } catch (error) {
    console.error("Error fetching grade:", error);
    throw error;
  }
};

export const getGradesByStudentId = async (studentId: string): Promise<Grade[]> => {
  try {
    const records = await pb.collection("grades").getFullList({
      filter: `student_id = "${studentId}"`,
      expand: "student_id,last_modified_by",
      sort: "-updated",
    });
    return records as unknown as Grade[];
  } catch (error) {
    console.error("Error fetching student grades:", error);
    throw error;
  }
};

export const createGrade = async (
  studentId: string,
  subject: string,
  gradeValue: number,
  userId: string
): Promise<Grade> => {
  try {
    // Validate user exists in database
    const userExists = await validateUserExists(userId);
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in with a valid user account.`);
    }

    const newRecord = await pb.collection("grades").create({
      student_id: studentId,
      subject: subject,
      grade_value: gradeValue,
      last_modified_by: userId,
    });

    // Fetch the created record with expanded data
    const createdGradeWithExpand = await pb.collection("grades").getOne(newRecord.id, {
      expand: "student_id,last_modified_by",
    });

    // Create log entry
    try {
      await pb.collection("activity_logs").create({
        user_id: userId,
        action_type: "CREATE_GRADE",
        record_id: newRecord.id,
        old_value: JSON.stringify({}),
        new_value: JSON.stringify(createdGradeWithExpand),
        timestamp: new Date().toISOString(),
        ip_address: getClientIpAddressSync(),
      });
    } catch (logError) {
      console.error("Failed to create activity log (non-fatal):", logError);
      // Continue anyway - grade was created
    }

    return createdGradeWithExpand as unknown as Grade;
  } catch (error: any) {
    console.error("Error creating grade:", error);
    const message = error?.message || "Failed to create grade";
    throw new Error(message);
  }
};

export const updateGrade = async (
  gradeId: string,
  newGrade: number,
  userId: string
): Promise<Grade> => {
  try {
    // Validate user exists in database
    const userExists = await validateUserExists(userId);
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in with a valid user account.`);
    }

    // 1. Get current grade
    const oldRecord = await pb.collection("grades").getOne(gradeId, {
      expand: "student_id,last_modified_by",
    });

    // 2. Update grade
    await pb.collection("grades").update(gradeId, {
      grade_value: newGrade,
      last_modified_by: userId,
    });

    // 3. Get updated record with expanded data
    const updatedRecord = await pb.collection("grades").getOne(gradeId, {
      expand: "student_id,last_modified_by",
    });

    // 4. Create log entry
    try {
      await pb.collection("activity_logs").create({
        user_id: userId,
        action_type: "UPDATE_GRADE",
        record_id: gradeId,
        old_value: JSON.stringify(oldRecord),
        new_value: JSON.stringify(updatedRecord),
        timestamp: new Date().toISOString(),
        ip_address: getClientIpAddressSync(),
      });
    } catch (logError) {
      console.error("Failed to create activity log (non-fatal):", logError);
      // Continue anyway - grade was updated
    }

    return updatedRecord as unknown as Grade;
  } catch (error: any) {
    console.error("Error updating grade:", error);
    const message = error?.message || "Failed to update grade";
    throw new Error(message);
  }
};

export const deleteGrade = async (
  gradeId: string,
  userId: string
): Promise<void> => {
  try {
    // 0. Validate user exists in database
    const userExists = await validateUserExists(userId);
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist in the database. Please ensure you are logged in with a valid user account.`);
    }

    // 1. Get current record before deletion
    const oldRecord = await pb.collection("grades").getOne(gradeId, {
      expand: "student_id,last_modified_by",
    });

    // 2. Delete grade first
    await pb.collection("grades").delete(gradeId);

    // 3. Create log entry after successful deletion
    try {
      await pb.collection("activity_logs").create({
        user_id: userId,
        action_type: "DELETE_GRADE",
        record_id: gradeId,
        old_value: JSON.stringify(oldRecord),
        new_value: JSON.stringify({}),
        timestamp: new Date().toISOString(),
        ip_address: getClientIpAddressSync(),
      });
      console.log("Delete logged successfully for grade:", gradeId);
    } catch (logError: any) {
      console.error("Failed to create activity log for deletion:", logError);
      console.error("Log error details:", logError?.response?.data || logError?.message);
      // Note: We don't throw here because the grade was already deleted
      // But we log the error for debugging
    }
  } catch (error: any) {
    console.error("Error deleting grade:", error);
    const message = error?.message || "Failed to delete grade";
    throw new Error(message);
  }
};

export const getUserName = async (userId: string): Promise<string> => {
  try {
    const user = await pb.collection("users").getOne(userId);
    return (user as any).name || userId;
  } catch (error) {
    console.error("Error fetching user:", error);
    return userId;
  }
};